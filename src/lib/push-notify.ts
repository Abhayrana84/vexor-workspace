// src/lib/push-notify.ts
// Server-side utility: sends a push notification to ALL subscribed users

import webpush from 'web-push'
import { adminDb } from './firebase-admin'

webpush.setVapidDetails(
  'mailto:admin@vexorit.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface NotifyPayload {
  title: string
  body: string
  icon?: string
  url?: string
  tag?: string
}

export async function sendPushToAll(payload: NotifyPayload, excludeUserId?: string) {
  try {
    const subsSnap = await adminDb.collection('push_subscriptions').get()
    const json = JSON.stringify({
      ...payload,
      icon: payload.icon || '/icon-192.png',
      badge: '/icon-192.png',
    })

    const sends = subsSnap.docs
      .filter(doc => doc.data().userId !== excludeUserId)
      .map(async doc => {
        const sub = doc.data().subscription
        try {
          await webpush.sendNotification(sub, json)
        } catch (err: any) {
          // Remove expired / invalid subscriptions
          if (err.statusCode === 410 || err.statusCode === 404) {
            await adminDb.collection('push_subscriptions').doc(doc.id).delete()
          }
        }
      })

    await Promise.allSettled(sends)
  } catch (err) {
    console.error('[push-notify] Failed to send push:', err)
  }
}
