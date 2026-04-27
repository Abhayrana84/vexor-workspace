// scripts/seed-firebase.ts
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';
import { ROLE_PERMISSIONS, UserRole } from '../src/lib/permissions';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from the root directory
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
const auth = admin.auth();

const TEAM_DATA = [
  { name: 'Abhay Rana', email: 'abhayrana8272@gmail.com', teamId: 'VEX001', role: 'SUPER_ADMIN', avatarColor: '#6d6afe', initials: 'AR', password: 'Vexor@Abhay001' },
  { name: 'Sagar Panwar', email: 'sagarpanwar914925@gmail.com', teamId: 'VEX002', role: 'ADMIN', avatarColor: '#22c55e', initials: 'SP', password: 'Vexor@Sagar002' },
  { name: 'Anshika Siwach', email: 'siwachanshika551@gmail.com', teamId: 'VEX003', role: 'MANAGER', avatarColor: '#ec4899', initials: 'AS', password: 'Anshika@Vexor003' },
  { name: 'Abhishek Tyagi', email: 'mr.abhishek.tyagi.01@gmail.com', teamId: 'VEX004', role: 'MEMBER', avatarColor: '#3b82f6', initials: 'AT', password: 'Abhishek@Vexor004' },
  { name: 'Arnav Rathi', email: 'arnavrathi2111@gmail.com', teamId: 'VEX005', role: 'MEMBER', avatarColor: '#a855f7', initials: 'AR', password: 'Arnav@Vexor005' },
  { name: 'Abhinav Jaat', email: 'abhinavjaat106@gmail.com', teamId: 'VEX006', role: 'TEAM_LEAD', avatarColor: '#0ea5e9', initials: 'AJ', password: 'Abhinav@Vexor006' },
  { name: 'Govind Arya', email: 'govindarya521@gmail.com', teamId: 'VEX007', role: 'TEAM_LEAD', avatarColor: '#f59e0b', initials: 'GA', password: 'Govind@Vexor007' },
  { name: 'Vansh Rara', email: 'vanshrara5432@gmail.com', teamId: 'VEX008', role: 'CLIENT_OPERATIONS', avatarColor: '#ef4444', initials: 'VR', password: 'Vansh@Vexor008' },
];

async function seed() {
  console.log('🌱 Seeding Firebase Firestore & Authentication...');

  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Clean existing collections
  console.log('  Cleaning existing collections...');
  const collections = ['users', 'clients', 'projects', 'tasks', 'activities'];
  for (const col of collections) {
    const snapshot = await db.collection(col).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  // 2. Add team members
  console.log('  Adding team members...');
  const userMap: Record<string, string> = {};
  for (const member of TEAM_DATA) {
    const { password, ...userData } = member;
    
    // Auth & Claims
    let uid: string;
    try {
      const authUser = await auth.createUser({ email: member.email, password: member.password, displayName: member.name });
      uid = authUser.uid;
    } catch (e: any) {
      const authUser = await auth.getUserByEmail(member.email);
      uid = authUser.uid;
    }

    const perms = ROLE_PERMISSIONS[member.role as UserRole];
    await auth.setCustomUserClaims(uid, { role: member.role, permissions: perms });

    // Firestore
    const hash = await bcrypt.hash(member.password, 10);
    const userRef = db.collection('users').doc();
    await userRef.set({ ...userData, permissions: perms, password: hash, createdAt: now, updatedAt: now });
    userMap[member.email] = userRef.id;
  }

  // 3. Add Clients
  console.log('  Adding clients...');
  const clientRef1 = await db.collection('clients').add({ name: 'TechNova Labs', contactName: 'Rahul Mehta', email: 'rahul@technova.in', emoji: '🔬', createdAt: now, updatedAt: now });
  const clientRef2 = await db.collection('clients').add({ name: 'GreenPath Solutions', contactName: 'Priya Shah', email: 'priya@greenpath.co', emoji: '🌿', createdAt: now, updatedAt: now });

  // 4. Add Projects
  console.log('  Adding projects...');
  const p1 = await db.collection('projects').add({
    name: 'TechNova Brand Redesign',
    description: 'Full brand identity overhaul.',
    status: 'IN_PROGRESS',
    managerId: userMap['siwachanshika551@gmail.com'],
    clientId: clientRef1.id,
    createdAt: now,
    updatedAt: now
  });

  const p2 = await db.collection('projects').add({
    name: 'Vexor Internal OS',
    description: 'Internal workspace development.',
    status: 'PLANNING',
    managerId: userMap['abhayrana8272@gmail.com'],
    clientId: null,
    createdAt: now,
    updatedAt: now
  });

  // 5. Add Tasks
  console.log('  Adding tasks...');
  const p1Members = [userMap['siwachanshika551@gmail.com'], userMap['govindarya521@gmail.com']];
  const p2Members = [userMap['abhayrana8272@gmail.com'], userMap['abhinavjaat106@gmail.com']];

  await db.collection('tasks').add({ 
    title: 'Design logo concepts', 
    projectId: p1.id, 
    projectMemberIds: p1Members, 
    assigneeId: userMap['govindarya521@gmail.com'], 
    status: 'IN_PROGRESS', 
    priority: 'HIGH', 
    createdAt: now, 
    updatedAt: now 
  });
  
  await db.collection('tasks').add({ 
    title: 'Authentication system', 
    projectId: p2.id, 
    projectMemberIds: p2Members,
    assigneeId: userMap['abhinavjaat106@gmail.com'], 
    status: 'COMPLETED', 
    priority: 'HIGH', 
    createdAt: now, 
    updatedAt: now 
  });

  // 6. Add Activities
  console.log('  Adding activities...');
  await db.collection('activities').add({ userId: userMap['abhayrana8272@gmail.com'], action: 'created project', target: 'Vexor Internal OS', projectId: p2.id, createdAt: now });
  await db.collection('activities').add({ userId: userMap['abhinavjaat106@gmail.com'], action: 'completed task', target: 'Authentication system', projectId: p2.id, createdAt: now });

  console.log('✅ Firebase seed complete!');
  // 7. Add Finances (ONLY for Super Admin visibility)
  console.log('  Adding financial records...');
  await db.collection('finances').add({
    type: 'INCOME',
    category: 'Project Payment',
    amount: 150000,
    projectId: p2.id,
    clientName: 'GreenPath Solutions',
    status: 'CLEARED',
    createdAt: now,
    createdBy: userMap['abhayrana8272@gmail.com']
  });

  process.exit(0);
}

seed().catch(console.error);
