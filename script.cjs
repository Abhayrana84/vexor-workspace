const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore('vexor-workspace');
db.collection('users').where('email', '==', 'abhayrana8272@gmail.com').get().then(snap => {
  if (snap.empty) { console.log('User not found'); process.exit(1); }
  const doc = snap.docs[0];
  const perms = {
    can_manage_users: true,
    can_manage_projects: true,
    can_assign_tasks: true,
    can_view_clients: true,
    can_manage_clients: true,
    can_view_finance: true,
    can_manage_finance: true,
    can_view_audit_logs: true,
    can_manage_system: true,
  };
  doc.ref.update({ permission: 'SUPER_ADMIN', role: 'SUPER_ADMIN', permissions: perms }).then(() => {
    admin.auth().getUserByEmail('abhayrana8272@gmail.com').then(user => {
        admin.auth().setCustomUserClaims(user.uid, { role: 'SUPER_ADMIN', permissions: perms }).then(() => {
            console.log('Successfully updated to SUPER_ADMIN');
            process.exit(0);
        });
    });
  });
});
