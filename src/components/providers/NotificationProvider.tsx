'use client'
// src/components/providers/NotificationProvider.tsx
// Registers service worker, requests push permission, plays sound on notification

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(Array.from(raw).map(c => c.charCodeAt(0)))
}

/** Plays a soft notification beep using Web Audio API (no file needed) */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    // Silently fail if AudioContext isn't available
  }
}

export function NotificationProvider() {
  const { data: session, status } = useSession()
  const swRef = useRef<ServiceWorkerRegistration | null>(null)
  const askedRef = useRef(false)

  useEffect(() => {
    if (status !== 'authenticated' || !session) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const setup = async () => {
      try {
        // 1. Register Service Worker
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        await navigator.serviceWorker.ready
        swRef.current = reg

        // 2. Listen for messages from SW (for in-app sound)
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data?.type === 'PUSH_RECEIVED') {
            playBeep()
            const p = event.data.payload
            toast(`🔔 ${p.title}: ${p.body}`, {
              duration: 5000,
              style: { cursor: 'pointer' },
              onClick: () => p.url && (window.location.href = p.url),
            } as any)
          }
        })

        // 3. Request permission (only once per session)
        if (Notification.permission === 'default' && !askedRef.current) {
          askedRef.current = true
          const permission = await Notification.requestPermission()
          if (permission !== 'granted') return
        }

        if (Notification.permission !== 'granted') return

        // 4. Subscribe to push
        let sub = await reg.pushManager.getSubscription()
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          })
        }

        // 5. Save subscription to server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        })
      } catch (err) {
        console.error('[NotificationProvider]', err)
      }
    }

    setup()
  }, [status, session])

  return null // No UI — purely functional
}
