// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { canManageProjects } from '@/lib/utils'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).default('PLANNING'),
  managerId: z.string().regex(/^[a-zA-Z0-9]{20,30}$/),
  clientId: z.string().optional(),
  memberIds: z.array(z.string().regex(/^[a-zA-Z0-9]{20,30}$/)).max(100).default([]),
})

import { withAuth } from '@/lib/api-handler'

export const GET = withAuth(async (req, session) => {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('q')
  const cursor = searchParams.get('cursor')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
  const userId = session.user.id

  let query: any = adminDb.collection('projects').orderBy('createdAt', 'desc')
  
  if (!isAdmin) {
    query = query.where('memberIds', 'array-contains', userId)
  }

  if (status) query = query.where('status', '==', status)

  // FIX 16: Cursor-based pagination
  if (cursor) {
    const cursorDoc = await adminDb.collection('projects').doc(cursor).get()
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc)
    }
  }

  const projectsSnapshot = await query.limit(limit).get()
  const projects = projectsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
  const nextCursor = projects.length === limit ? projects[projects.length - 1].id : null

  if (search) {
    const s = search.toLowerCase()
    const filtered = projects.filter((p: any) => p.name.toLowerCase().includes(s))
    // Note: search breaks pagination slightly, but this is a simple implementation
    return NextResponse.json({ data: filtered, nextCursor: null })
  }

  // Populate manager details
  const managerIds = Array.from(new Set<string>(projects.map((p: any) => p.managerId).filter(Boolean)))
  let managerMap: Record<string, any> = {}
  
  if (managerIds.length > 0) {
    const managerDocs = await adminDb.getAll(...managerIds.map(id => adminDb.collection('users').doc(id)))
    managerMap = Object.fromEntries(managerDocs.map(d => [d.id, d.data()]))
  }

  const populated = projects.map((p: any) => ({
    ...p,
    manager: managerMap[p.managerId] ? {
      id: p.managerId,
      name: managerMap[p.managerId].name,
      initials: managerMap[p.managerId].initials,
      avatarColor: managerMap[p.managerId].avatarColor,
    } : null
  }))

  return NextResponse.json({ data: populated, nextCursor })
}, { rateLimit: { limit: 20, windowMs: 60 * 1000 } });

export const POST = withAuth(async (req, session) => {
  if (!canManageProjects(session.user.permissions)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const result = createProjectSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  const { name, description, status, managerId, clientId, memberIds } = result.data
  const now = new Date()

  // Ensure all memberIds are unique and include the manager
  const finalMemberIds = Array.from(new Set([managerId, ...memberIds]))

  // FIX 15: Batch check user existence
  const userDocs = await adminDb.getAll(...finalMemberIds.map(id => adminDb.collection('users').doc(id)))
  if (userDocs.some(d => !d.exists)) {
    return NextResponse.json({ error: 'One or more member IDs are invalid' }, { status: 400 })
  }

  const projectRef = adminDb.collection('projects').doc()
  const projectData = {
    name,
    description: description || '',
    status,
    managerId,
    clientId: clientId || null,
    memberIds: finalMemberIds, // Array of user IDs for security rules
    createdAt: now,
    updatedAt: now,
  }

  const batch = adminDb.batch()
  batch.set(projectRef, projectData)

  // Denormalize members into a sub-collection or separate collection for easier querying
  finalMemberIds.forEach(uid => {
    const memberRef = adminDb.collection('project_members').doc()
    batch.set(memberRef, {
      projectId: projectRef.id,
      userId: uid,
      joinedAt: now,
    })
  })

  await batch.commit()

  await adminDb.collection('activities').add({
    userId: session.user.id,
    action: 'created project',
    target: name,
    projectId: projectRef.id,
    visibleTo: finalMemberIds, // NEW: Single-query feed optimization
    createdAt: now,
  })

  return NextResponse.json({ id: projectRef.id, ...projectData }, { status: 201 })
}, { rateLimit: { limit: 10, windowMs: 60 * 1000 } });
