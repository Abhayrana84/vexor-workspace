// src/app/api/tasks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

import { withAuth } from '@/lib/api-handler'
import { sendPushToAll } from '@/lib/push-notify'

export const GET = withAuth(async (req, session) => {
  // Extract id from req.nextUrl.pathname since withAuth wraps NextRequest but not params perfectly
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop()!

  const taskDoc = await adminDb.collection('tasks').doc(id).get()
  if (!taskDoc.exists) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  
  const taskData = taskDoc.data() as any
  
  // Joins
  const projectDoc = await adminDb.collection('projects').doc(taskData.projectId).get()
  const assigneeDoc = taskData.assigneeId ? await adminDb.collection('users').doc(taskData.assigneeId).get() : null
  
  const commentsSnapshot = await adminDb.collection('comments')
    .where('taskId', '==', id)
    .orderBy('createdAt', 'asc')
    .get()
  
  const comments = await (async () => {
    if (commentsSnapshot.empty) return []
    const authorIds = Array.from(new Set(commentsSnapshot.docs.map(d => d.data().userId || d.data().authorId).filter(Boolean)))
    const authorsSnapshot = authorIds.length
      ? await adminDb.collection('users').where('__name__', 'in', authorIds).get()
      : { docs: [] as any[] }
    const authorMap = Object.fromEntries(authorsSnapshot.docs.map((d: any) => [d.id, { id: d.id, ...d.data() }]))
    return commentsSnapshot.docs.map(cdoc => {
      const cdata = cdoc.data()
      const authorId = cdata.userId || cdata.authorId
      return {
        id: cdoc.id,
        ...cdata,
        createdAt: cdata.createdAt?.toDate?.() || cdata.createdAt,
        author: authorMap[authorId] || { name: 'Unknown', initials: '??', avatarColor: '#ccc' }
      }
    })
  })()

  const task = {
    id: taskDoc.id,
    ...taskData,
    createdAt: taskData.createdAt?.toDate?.() || taskData.createdAt,
    updatedAt: taskData.updatedAt?.toDate?.() || taskData.updatedAt,
    dueDate: taskData.dueDate?.toDate?.() || taskData.dueDate,
    project: { id: projectDoc.id, name: projectDoc.data()?.name },
    assignee: assigneeDoc ? { id: assigneeDoc.id, ...assigneeDoc.data() } : null,
    comments,
  }

  return NextResponse.json(task)
}, { rateLimit: { limit: 30, windowMs: 60 * 1000 } })

export const PATCH = withAuth(async (req, session) => {
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop()!

  const taskRef = adminDb.collection('tasks').doc(id)
  const taskDoc = await taskRef.get()
  if (!taskDoc.exists) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  const currentTask = taskDoc.data() as any

  const body = await req.json()
  const { title, description, status, priority, assigneeId, dueDate, position } = body

  // FIX 8 & 13: Permission checks
  const canAssign = session.user.permissions?.can_assign_tasks === true
  const isAssignee = currentTask.assigneeId === session.user.id

  if (!canAssign && !isAssignee) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const updateData: any = { updatedAt: new Date() }

  if (canAssign) {
    if (title) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (position !== undefined) updateData.position = position
    
      updateData.assigneeId = assigneeId || null
  } else if (isAssignee) {
    // Assignees can ONLY update status
    if (status) updateData.status = status
  }

  await taskRef.update(updateData)

  const updatedTaskDoc = await adminDb.collection('tasks').doc(id).get()
  const task = { id: updatedTaskDoc.id, ...updatedTaskDoc.data() }

  if (status) {
    await adminDb.collection('activities').add({
      userId: session.user.id,
      action: `moved task to ${status.replace('_', ' ').toLowerCase()}`,
      target: (task as any).title,
      projectId: (task as any).projectId,
      taskId: task.id,
      visibleTo: (task as any).projectMemberIds || [],
      createdAt: new Date(),
    })

    const statusLabel: Record<string, string> = {
      TODO: '📋 To Do', IN_PROGRESS: '🔄 In Progress', REVIEW: '🔍 Review', COMPLETED: '✅ Done'
    }
    sendPushToAll({
      title: `Task Moved → ${statusLabel[status] || status}`,
      body: `${session.user.name} moved "${(task as any).title}"`,
      url: `/tasks/${task.id}`,
      tag: `task-moved-${task.id}`,
    }, session.user.id)
  } else if (title || description !== undefined || priority || assigneeId !== undefined) {
    sendPushToAll({
      title: '✏️ Task Updated',
      body: `${session.user.name} updated "${(task as any).title}"`,
      url: `/tasks/${task.id}`,
      tag: `task-updated-${task.id}`,
    }, session.user.id)
  }

  return NextResponse.json(task)
}, { rateLimit: { limit: 10, windowMs: 60 * 1000 } })

export const DELETE = withAuth(async (req, session) => {
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop()!

  if (!session.user.permissions.can_manage_projects) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  await adminDb.collection('tasks').doc(id).delete()
  return NextResponse.json({ message: 'Task deleted' })
}, { rateLimit: { limit: 10, windowMs: 60 * 1000 } })
