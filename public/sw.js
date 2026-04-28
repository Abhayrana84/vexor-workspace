// public/sw.js
// Vexor Workspace — Push Notification Service Worker

const CACHE_VERSION = 'vexor-v1'
const SOUND_URL = '/notification.mp3'

// ─── Push event: fires even when app is closed ────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return

  let payload
  try { payload = event.data.json() }
  catch { payload = { title: 'Vexor Workspace', body: event.data.text() } }

  const options = {
    body:    payload.body    || 'Something changed in the workspace',
    icon:    payload.icon    || '/icon-192.png',
    badge:   '/icon-192.png',
    tag:     payload.tag     || 'vexor-notification',
    data:    { url: payload.url || '/' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    silent: false, // let OS play its default notification sound
    actions: [
      { action: 'open',    title: '📂 Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(payload.title || 'Vexor Workspace', options),
      // Broadcast to any open tabs so they can play a custom sound
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => client.postMessage({ type: 'PUSH_RECEIVED', payload }))
      }),
    ])
  )
})

// ─── Notification click ────────────────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // If app is already open, focus it and navigate
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      // Otherwise open a new window
      self.clients.openWindow(targetUrl)
    })
  )
})

// ─── Install & activate (minimal caching) ─────────────────────────────────
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})
