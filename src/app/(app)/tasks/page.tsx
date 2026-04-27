// src/app/(app)/tasks/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { Avatar, Badge, EmptyState } from '@/components/ui'
import { getPriorityColor, getStatusColor, getStatusLabel, formatDate, canAssignTasks } from '@/lib/utils'
import Link from 'next/link'

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

  // --- BATCH FETCHING (Solves N+1) ---
  const projectIds = Array.from(new Set(rawTasks.map(t => t.projectId).filter(Boolean)))
  const assigneeIds = Array.from(new Set(rawTasks.map(t => t.assigneeId).filter(Boolean)))

  const [projectsSnapshot, usersSnapshot] = await Promise.all([
    projectIds.length ? adminDb.collection('projects').where('__name__', 'in', projectIds).get() : { docs: [] },
    assigneeIds.length ? adminDb.collection('users').where('__name__', 'in', assigneeIds).get() : { docs: [] },
  ])

  const projectMap = Object.fromEntries(projectsSnapshot.docs.map(d => [d.id, { id: d.id, ...d.data() }]))
  const userMap = Object.fromEntries(usersSnapshot.docs.map(d => [d.id, { id: d.id, ...d.data() }]))

  const tasks = rawTasks.map(t => {
    const project = projectMap[t.projectId] || { name: 'Unknown Project' }
    const assignee = userMap[t.assigneeId] || null
    return {
      ...t,
      project,
      assignee,
      dueDate: t.dueDate?.toDate?.() || t.dueDate,
      _count: { comments: 0 } // Performance tradeoff: skip N+1 comment counts for now
    }
  })

  const can = canAssignTasks(session?.user?.permissions)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--txt0)' }}>Tasks</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--txt3)' }}>
            {tasks.length} tasks {!isAdmin ? '(assigned to you)' : ''}
          </p>
        </div>
        {can && (
          <Link
            href="/tasks/new"
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            + New Task
          </Link>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon="✅" title="No tasks found" sub="All caught up!" />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Task', 'Project', 'Assignee', 'Priority', 'Status', 'Due Date', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--txt3)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="group"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium" style={{ color: 'var(--txt0)' }}>{task.title}</div>
                    {task._count.comments > 0 && (
                      <span className="text-xs" style={{ color: 'var(--txt3)' }}>💬 {task._count.comments}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/projects/${task.project.id}`} className="text-xs hover:underline" style={{ color: 'var(--accent2)' }}>
                      {task.project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar initials={task.assignee.initials} color={task.assignee.avatarColor} size={22} />
                        <span className="text-xs" style={{ color: 'var(--txt1)' }}>
                          {task.assignee.name.split(' ')[0]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--txt3)' }}>Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(task.status)}>{getStatusLabel(task.status)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--txt3)' }}>
                    {task.dueDate ? formatDate(task.dueDate) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {can && (
                      <Link
                        href={`/tasks/${task.id}/edit`}
                        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--txt3)' }}
                      >
                        Edit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
