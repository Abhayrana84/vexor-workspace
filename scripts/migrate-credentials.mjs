/**
 * One-time migration script
 * Creates a `credentials` doc for every Firestore user that doesn't have one.
 * This fixes dashboard-created users who were created before the credentials fix.
 *
 * Run: node scripts/migrate-credentials.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load service account from env or file
const serviceAccountPath = resolve(__dirname, '../firebase-service-account.json');
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch {
  console.error('❌ Could not load firebase-service-account.json');
  console.error('   Place your Firebase service account JSON at:', serviceAccountPath);
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const usersSnap = await db.collection('users').get();
let migrated = 0;
let skipped = 0;

for (const userDoc of usersSnap.docs) {
  const credRef = db.collection('credentials').doc(userDoc.id);
  const credSnap = await credRef.get();

  if (credSnap.exists) {
    skipped++;
    continue;
  }

  const userData = userDoc.data();
  const passwordHash = userData.password; // stored on the user doc

  if (!passwordHash) {
    console.warn(`⚠️  User ${userData.email} has no password hash — skipping`);
    skipped++;
    continue;
  }

  await credRef.set({
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`✅ Created credentials doc for: ${userData.email}`);
  migrated++;
}

console.log(`\n📋 Migration complete: ${migrated} created, ${skipped} skipped`);
process.exit(0);
