// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 1. Fetch activities related to the user's projects and tasks
  // For Firestore, we'll fetch general recent activities and filter in JS for now,
  // or use more specific queries if indexed.
  const activitiesSnapshot = await adminDb.collection('activities')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get()

  const allActivities = activitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

  // 2. Filter for relevant notifications
  // - On projects user manages
  // - On tasks assigned to user
  // - Not by the user themselves
  const notifications = allActivities.filter(a => {
    if (a.userId === session.user.id) return false
    // Note: In a larger app, we'd query project/task membership specifically.
    return true // Simplified for MVP/Beta
  }).slice(0, 20)

  // 3. Join related data
  const populated = await Promise.all(notifications.map(async (n) => {
    const userDoc = await adminDb.collection('users').doc(n.userId).get()
    const userData = userDoc.data()
    return {
      ...n,
      user: { name: userData?.name, initials: userData?.initials, avatarColor: userData?.avatarColor, avatarUrl: userData?.avatarUrl },
      createdAt: n.createdAt?.toDate?.() || n.createdAt
    }
  }))

  const userDoc = await adminDb.collection('users').doc(session.user.id).get()
  const lastRead = userDoc.data()?.lastReadNotification?.toDate?.()?.getTime() || 0

  const unreadCount = populated.filter((n: any) => {
    const time = new Date(n.createdAt).getTime()
    return time > lastRead
  }).length

  return NextResponse.json({ notifications: populated, unreadCount })
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = require('firebase-admin')
  await adminDb.collection('users').doc(session.user.id).update({
    lastReadNotification: admin.firestore.FieldValue.serverTimestamp()
  })

  return NextResponse.json({ success: true })
}
