// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin'
import type { Firestore } from 'firebase-admin/firestore'
import type { Auth } from 'firebase-admin/auth'

let adminDb: Firestore
let adminAuth: Auth
let _initialized = false

function getAdminApp() {
  if (admin.apps.length) return admin.apps[0]!

  const projectId   = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      '[firebase-admin] Missing env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY. ' +
      'Add them to Render → Environment Variables.'
    )
  }

  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey } as admin.ServiceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
}

try {
  getAdminApp()
  const { getFirestore } = require('firebase-admin/firestore')
  adminDb   = getFirestore('vexor-workspace')
  adminAuth = admin.auth()
  _initialized = true
} catch (err: any) {
  console.error('[firebase-admin] Initialization failed:', err?.message || err)
  // Provide stub objects so imports don't crash — actual calls will fail gracefully
  adminDb   = null as any
  adminAuth = null as any
}

export { adminDb, adminAuth, _initialized }
