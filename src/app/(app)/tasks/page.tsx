// src/app/(app)/tasks/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { canAssignTasks } from '@/lib/utils'
import { TasksClient } from './TasksClient'

export default async function TasksPage({ searchParams }: { searchParams: { projectId?: string } }) {
  const session = await getServerSession(authOptions)
  const isAdmin = canAssignTasks(session?.user?.permissions)

  let tasksQuery = adminDb.collection('tasks').orderBy('status', 'asc')

  if (searchParams.projectId) {
    tasksQuery = tasksQuery.where('projectId', '==', searchParams.projectId)
  }

  if (!isAdmin) {
    tasksQuery = tasksQuery.where('assigneeId', '==', session?.user?.id)
  }

  const tasksSnapshot = await tasksQuery.get()
  const rawTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]

  // Batch fetch projects + users to avoid N+1
  const projectIds = Array.from(new Set(rawTasks.map(t => t.projectId).filter(Boolean)))
  const assigneeIds = Array.from(new Set(rawTasks.map(t => t.assigneeId).filter(Boolean)))

  const [projectsSnapshot, usersSnapshot] = await Promise.all([
    projectIds.length ? adminDb.collection('projects').where('__name__', 'in', projectIds).get() : { docs: [] },
    assigneeIds.length ? adminDb.collection('users').where('__name__', 'in', assigneeIds).get() : { docs: [] },
  ])

  const projectMap = Object.fromEntries(projectsSnapshot.docs.map(d => [d.id, { id: d.id, ...d.data() }]))
  const userMap = Object.fromEntries(usersSnapshot.docs.map(d => [d.id, { id: d.id, ...d.data() }]))

  const tasks = rawTasks.map(t => ({
    ...t,
    project: projectMap[t.projectId] || { id: t.projectId, name: 'Unknown Project' },
    assignee: userMap[t.assigneeId] || null,
    dueDate: t.dueDate?.toDate?.()?.toISOString() || t.dueDate || null,
    _count: { comments: 0 },
  }))

  // My tasks = tasks assigned to the current user, sorted by priority weight
  const priorityOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  const myTasks = tasks
    .filter(t => t.assigneeId === session?.user?.id)
    .sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3))

  return (
    <TasksClient
      tasks={tasks}
      myTasks={myTasks}
      isAdmin={isAdmin}
      currentUserId={session?.user?.id ?? ''}
    />
  )
}
