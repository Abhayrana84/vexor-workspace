// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { hasPermission } from '@/lib/utils'

import { withAuth } from '@/lib/api-handler'

export const GET = withAuth(async (req, session) => {
  // FIX 9: Permission gating
  const isAuthorized = session.user.role === 'ADMIN' || 
                       session.user.role === 'MANAGER' || 
                       session.user.permissions?.can_view_clients === true

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const clientsSnapshot = await adminDb.collection('clients').orderBy('createdAt', 'desc').get()
  const clients = await Promise.all(clientsSnapshot.docs.map(async (doc) => {
    const data = doc.data()
    const projectsSnapshot = await adminDb.collection('projects').where('clientId', '==', doc.id).get()
    const projects = projectsSnapshot.docs.map(p => ({ id: p.id, name: p.data().name, status: p.data().status }))
    return { id: doc.id, ...data, projects }
  }))

  return NextResponse.json(clients)
}, { rateLimit: { limit: 20, windowMs: 60 * 1000 } });

export const POST = withAuth(async (req, session) => {
  if (!hasPermission(session.user.permissions, 'can_manage_clients')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { name, contactName, email, phone, emoji } = await req.json()
  if (!name || !email) return NextResponse.json({ error: 'Name and email required' }, { status: 400 })

  const now = new Date()
  const clientRef = adminDb.collection('clients').doc()
  const clientData = {
    name,
    contactName: contactName || '',
    email,
    phone: phone || '',
    emoji: emoji || '🏢',
    createdAt: now,
    updatedAt: now,
  }

  await clientRef.set(clientData)

  await adminDb.collection('activities').add({
    userId: session.user.id,
    action: 'added new client',
    target: name,
    createdAt: now,
  })

  return NextResponse.json({ id: clientRef.id, ...clientData }, { status: 201 })
}, { rateLimit: { limit: 10, windowMs: 60 * 1000 } });

export const PATCH = withAuth(async (req, session) => {
  if (!hasPermission(session.user.permissions, 'can_manage_clients')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('id')
  if (!clientId) return NextResponse.json({ error: 'Client ID required' }, { status: 400 })

  const body = await req.json()
  const { name, contactName, email, phone, emoji } = body
  const updates: any = { updatedAt: new Date() }
  if (name) updates.name = name
  if (contactName !== undefined) updates.contactName = contactName
  if (email) updates.email = email
  if (phone !== undefined) updates.phone = phone
  if (emoji) updates.emoji = emoji

  await adminDb.collection('clients').doc(clientId).update(updates)
  return NextResponse.json({ id: clientId, updated: true })
}, { rateLimit: { limit: 10, windowMs: 60 * 1000 } });

export const DELETE = withAuth(async (req, session) => {
  if (!hasPermission(session.user.permissions, 'can_manage_clients')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('id')
  if (!clientId) return NextResponse.json({ error: 'Client ID required' }, { status: 400 })

  await adminDb.collection('clients').doc(clientId).delete()
  return NextResponse.json({ deleted: true })
}, { rateLimit: { limit: 10, windowMs: 60 * 1000 } });
