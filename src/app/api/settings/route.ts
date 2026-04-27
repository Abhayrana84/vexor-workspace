// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { withAuth } from '@/lib/api-handler'

export const GET = withAuth(async (req, session) => {
  const doc = await adminDb.collection('users').doc(session.user.id).get()
  const settings = doc.data()?.settings || { lightMode: false }
  return NextResponse.json({ settings })
}, { rateLimit: { limit: 20, windowMs: 60 * 1000 } });

export const PATCH = withAuth(async (req, session) => {
  const { settings } = await req.json()
  if (!settings) return NextResponse.json({ error: 'settings required' }, { status: 400 })

  await adminDb.collection('users').doc(session.user.id).update({ 
    settings: settings
  })

  return NextResponse.json({ success: true, settings })
}, { rateLimit: { limit: 10, windowMs: 60 * 1000 } });
