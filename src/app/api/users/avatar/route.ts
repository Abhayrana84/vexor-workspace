// src/app/api/users/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { withAuth } from '@/lib/api-handler'
import * as admin from 'firebase-admin'

export const POST = withAuth(async (req, session) => {
  const { avatarUrl } = await req.json()
  if (!avatarUrl) return NextResponse.json({ error: 'avatarUrl required' }, { status: 400 })

  await adminDb.collection('users').doc(session.user.id).update({ 
    avatarUrl,
    sessionVersion: admin.firestore.FieldValue.increment(1) // Force session update
  })

  // Revoke to force NextAuth JWT callback to refresh claims/db data (if we implemented it)
  // Or the client can call router.refresh() or next-auth update()
  const { adminAuth } = require('@/lib/firebase-admin');
  await adminAuth.revokeRefreshTokens(session.user.id);

  return NextResponse.json({ success: true, avatarUrl })
}, { rateLimit: { limit: 10, windowMs: 60 * 1000 } });
