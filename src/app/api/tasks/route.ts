// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  projectId: z.string(),
  assigneeId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).default('TODO'),
  dueDate: z.string().optional(),
})

import { withAuth } from '@/lib/api-handler'

export const GET = withAuth(async (req, session) => {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const assigneeId = searchParams.get('assigneeId')
  const status = searchParams.get('status')
  const search = searchParams.get('q')

  let query = adminDb.collection('tasks').orderBy('position', 'asc')

  if (projectId) query = query.where('projectId', '==', projectId)
  if (assigneeId) query = query.where('assigneeId', '==', assigneeId)
  if (status) query = query.where('status', '==', status)

  const snapshot = await query.get()
  const rawTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

  // BATCH FETCH (FIX 11)
  const pIds = Array.from(new Set(rawTasks.map((t: any) => t.projectId).filter(Boolean)))
  const uIds = Array.from(new Set(rawTasks.map((t: any) => t.assigneeId).filter(Boolean)))

  const [projectDocs, userDocs] = await Promise.all([
    pIds.length > 0 ? adminDb.getAll(...pIds.map(id => adminDb.collection('projects').doc(id))) : Promise.resolve([]),
    uIds.length > 0 ? adminDb.getAll(...uIds.map(id => adminDb.collection('users').doc(id))) : Promise.resolve([]),
  ])

  const pMap = Object.fromEntries(projectDocs.map(d => [d.id, { id: d.id, name: d.data()?.name || 'Unknown' }]))
  const uMap = Object.fromEntries(userDocs.map(d => [d.id, { 
    id: d.id, 
    name: d.data()?.name, 
    initials: d.data()?.initials, 
    avatarColor: d.data()?.avatarColor 
  }]))

  let tasks = rawTasks.map(t => ({
    ...t,
    project: pMap[t.projectId] || { id: t.projectId, name: 'Unknown' },
    assignee: uMap[t.assigneeId] || null,
    dueDate: t.dueDate?.toDate?.() || t.dueDate,
  }))

  if (search) {
    tasks = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
  }

  return NextResponse.json(tasks)
}, { rateLimit: { limit: 30, windowMs: 60 * 1000 } });

export const POST = withAuth(async (req, session) => {
  const body = await req.json()
  const result = createTaskSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  const { title, description, projectId, assigneeId, priority, status, dueDate } = result.data

  const projectDoc = await adminDb.collection('projects').doc(projectId).get()
  if (!projectDoc.exists) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  const projectData = projectDoc.data() as any

  // Fetch project members for de-normalization
  const membersSnap = await adminDb.collection('project_members').where('projectId', '==', projectId).get()
  const projectMemberIds = membersSnap.docs.map(d => d.data().userId)

  // Get max position
  const tasksSnapshot = await adminDb.collection('tasks')
    .where('projectId', '==', projectId)
    .where('status', '==', status)
    .orderBy('position', 'desc')
    .limit(1)
    .get()
  
  const lastTask = tasksSnapshot.docs[0]
  const position = lastTask ? (lastTask.data().position || 0) + 1 : 0

  const now = new Date()
  const taskData = {
    title,
    description: description || '',
    projectId,
    projectMemberIds, // De-normalized for security rules
    assigneeId: assigneeId || null,
    priority,
    status,
    dueDate: dueDate ? new Date(dueDate) : null,
    position,
    createdAt: now,
    updatedAt: now,
  }

  const taskRef = await adminDb.collection('tasks').add(taskData)

  await adminDb.collection('activities').add({
    userId: session.user.id,
    action: 'created task',
    target: title,
    projectId,
    taskId: taskRef.id,
    visibleTo: projectMemberIds, // NEW: Single-query feed optimization
    createdAt: now,
  })

  return NextResponse.json({ id: taskRef.id, ...taskData }, { status: 201 })
}, { rateLimit: { limit: 10, windowMs: 60 * 1000 } });
