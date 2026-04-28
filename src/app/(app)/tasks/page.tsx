// src/app/(app)/tasks/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { canAssignTasks } from '@/lib/utils'
import { TasksClient } from './TasksClient'

/** Recursively converts Firestore Timestamps and class instances to plain JSON-safe values */
function serialize(data: any): any {
  if (data === null || data === undefined) return null
  if (typeof data?.toDate === 'function') return data.toDate().toISOString() // Firestore Timestamp
  if (data instanceof Date) return data.toISOString()
  if (Array.isArray(data)) return data.map(serialize)
  if (typeof data === 'object' && Object.getPrototypeOf(data) === Object.prototype) {
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, serialize(v)]))
  }
  return data // primitives
}

export default async function TasksPage({ searchParams }: { searchParams: { projectId?: string } }) {
  try {
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

    const projectIds  = Array.from(new Set(rawTasks.map(t => t.projectId).filter(Boolean)))
    const assigneeIds = Array.from(new Set(rawTasks.map(t => t.assigneeId).filter(Boolean)))

    const [projectsSnapshot, usersSnapshot] = await Promise.all([
      projectIds.length  ? adminDb.collection('projects').where('__name__', 'in', projectIds).get()  : { docs: [] },
      assigneeIds.length ? adminDb.collection('users').where('__name__', 'in', assigneeIds).get()    : { docs: [] },
    ])

    // Serialize ALL Firestore docs — eliminates Timestamp / class instance errors
    const projectMap = Object.fromEntries(
      projectsSnapshot.docs.map((d: any) => [d.id, serialize({ id: d.id, ...d.data() })])
    )
    const userMap = Object.fromEntries(
      usersSnapshot.docs.map((d: any) => [d.id, serialize({ id: d.id, ...d.data() })])
    )

    const tasks = rawTasks.map(t => serialize({
      ...t,
      project:  projectMap[t.projectId]  || { id: t.projectId, name: 'Unknown Project' },
      assignee: userMap[t.assigneeId]    || null,
      dueDate:  t.dueDate?.toDate?.()?.toISOString() || t.dueDate || null,
      _count:   { comments: 0 },
    }))

    const priorityOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    const myTasks = tasks
      .filter((t: any) => t.assigneeId === session?.user?.id)
      .sort((a: any, b: any) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3))

    return (
      <TasksClient
        tasks={tasks}
        myTasks={myTasks}
        isAdmin={isAdmin}
        currentUserId={session?.user?.id ?? ''}
      />
    )
  } catch (err: any) {
    console.error('[TasksPage] Failed to load tasks:', err?.message || err)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-4xl">⚠️</div>
        <div className="text-base font-semibold" style={{ color: 'var(--txt0)' }}>
          Failed to load tasks
        </div>
        <div className="text-sm text-center max-w-sm" style={{ color: 'var(--txt3)' }}>
          Could not connect to the database. Please try again.
        </div>
        <a href="/tasks" className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          Try Again
        </a>
      </div>
    )
  }
}
