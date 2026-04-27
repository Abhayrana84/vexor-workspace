// scripts/migrate-passwords.ts
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore('vexor-workspace');

async function migrate() {
  console.log('🔐 Starting Password Migration...');
  
  const usersSnapshot = await db.collection('users').get();
  const batch = db.batch();
  let count = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    
    if (userData.password) {
      console.log(`  Migrating password for: ${userData.email}`);
      
      // 1. Move to secure /credentials collection
      const credRef = db.collection('credentials').doc(userDoc.id);
      batch.set(credRef, { 
        passwordHash: userData.password,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 2. Remove from main /users collection
      batch.update(userDoc.ref, {
        password: admin.firestore.FieldValue.delete()
      });

      count++;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`✅ Successfully migrated ${count} user passwords.`);
  } else {
    console.log('ℹ️ No passwords found to migrate.');
  }

  process.exit(0);
}

migrate().catch(console.error);
