// src/app/api/users/avatar/upload/route.ts
import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { withAuth } from '@/lib/api-handler'
import * as admin from 'firebase-admin'
import { Storage } from '@google-cloud/storage'

// Direct GCS client — bypasses Firebase Admin storage wrapper issues
const gcs = new Storage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
})

export const POST = withAuth(async (req, session) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > 3 * 1024 * 1024) return NextResponse.json({ error: 'Max file size is 3MB' }, { status: 400 })

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const filename = `avatars/${session.user.id}-${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!
    const bucket = gcs.bucket(bucketName)
    const fileRef = bucket.file(filename)

    await fileRef.save(buffer, {
      metadata: { contentType: file.type || 'image/jpeg' },
    })

    // Make the file publicly readable
    await fileRef.makePublic()

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`

    // Update Firestore
    await adminDb.collection('users').doc(session.user.id).update({
      avatarUrl: publicUrl,
      sessionVersion: admin.firestore.FieldValue.increment(1),
    })

    return NextResponse.json({ success: true, avatarUrl: publicUrl })
  } catch (err: any) {
    console.error('[Avatar Upload Error]', err?.message || err)
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}, { rateLimit: { limit: 10, windowMs: 60 * 1000 } })
