import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../.env') })

import * as admin from 'firebase-admin'

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  })
}

const db = admin.firestore()

async function backfillActivities() {
  console.log('Starting visibleTo backfill for activities...')
  
  const activitiesSnap = await db.collection('activities').get()
  const total = activitiesSnap.size
  let processed = 0
  let updated = 0
  let skipped = 0

  // We will process in batches of 400
  const CHUNK_SIZE = 400
  const ops = []

  for (const doc of activitiesSnap.docs) {
    const data = doc.data()
    
    // Skip if already has visibleTo or if it's an org-wide activity without a projectId
    if (data.visibleTo !== undefined || !data.projectId) {
      skipped++
      processed++
      continue
    }

    // Fetch the parent project to get memberIds
    const projectDoc = await db.collection('projects').doc(data.projectId).get()
    const memberIds = projectDoc.exists ? projectDoc.data()?.memberIds || [] : []

    ops.push((batch: FirebaseFirestore.WriteBatch) => {
      batch.set(doc.ref, { visibleTo: memberIds }, { merge: true })
    })

    updated++
    processed++

    if (processed % 100 === 0) {
      console.log(`Processed ${processed}/${total} activities...`)
    }
  }

  // Execute chunks
  console.log(`Committing ${updated} updates...`)
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const chunk = ops.slice(i, i + CHUNK_SIZE)
    const batch = db.batch()
    chunk.forEach(op => op(batch))
    await batch.commit()
    console.log(`Committed chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(ops.length / CHUNK_SIZE)}`)
  }

  console.log(`Backfill complete. Total: ${total}. Updated: ${updated}. Skipped: ${skipped}.`)
}

backfillActivities()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
