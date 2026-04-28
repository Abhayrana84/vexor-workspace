// src/app/api/notifications/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

// Save a push subscription for the current user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { subscription } = await req.json()
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  // Upsert — one record per endpoint (device/browser)
  const existing = await adminDb.collection('push_subscriptions')
    .where('subscription.endpoint', '==', subscription.endpoint)
    .limit(1)
    .get()

  if (existing.empty) {
    await adminDb.collection('push_subscriptions').add({
      userId: session.user.id,
      userName: session.user.name,
      subscription,
      createdAt: new Date(),
    })
  } else {
    await existing.docs[0].ref.update({ subscription, userId: session.user.id })
  }

  return NextResponse.json({ subscribed: true })
}

// Remove subscription (on logout or manual opt-out)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 })

  const snap = await adminDb.collection('push_subscriptions')
    .where('subscription.endpoint', '==', endpoint)
    .limit(1)
    .get()

  if (!snap.empty) await snap.docs[0].ref.delete()

  return NextResponse.json({ unsubscribed: true })
}
