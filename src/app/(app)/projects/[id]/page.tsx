// src/app/(app)/projects/[id]/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { notFound } from 'next/navigation'
import { Avatar, Badge, Card, Button } from '@/components/ui'
import { canManageProjects, getStatusColor, getStatusLabel, getPriorityColor, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  const projectDoc = await adminDb.collection('projects').doc(params.id).get()
  if (!projectDoc.exists) notFound()
  const projectData = projectDoc.data() as any

  // Fetch manager
  const managerDoc = await adminDb.collection('users').doc(projectData.managerId).get()
  const manager = { id: managerDoc.id, ...managerDoc.data() }

  // Fetch client
  let client = null
  if (projectData.clientId) {
    const clientDoc = await adminDb.collection('clients').doc(projectData.clientId).get()
    client = { id: clientDoc.id, ...clientDoc.data() }
  }

  // Fetch members
  const membersSnapshot = await adminDb.collection('project_members').where('projectId', '==', params.id).get()
  const members = await Promise.all(membersSnapshot.docs.map(async (mdoc: any) => {
    const udoc = await adminDb.collection('users').doc(mdoc.data().userId).get()
    return { id: mdoc.id, user: { id: udoc.id, ...udoc.data() } }
  }))
  const displayMembers = members.length > 0 ? members : [{ id: 'm1', user: manager }]

  // Fetch tasks
  const tasksSnapshot = await adminDb.collection('tasks').where('projectId', '==', params.id).orderBy('position', 'asc').get()
  const tasks = await Promise.all(tasksSnapshot.docs.map(async (tdoc) => {
    const tdata = tdoc.data()
    const assigneeDoc = tdata.assigneeId ? await adminDb.collection('users').doc(tdata.assigneeId).get() : null
    const commentsSnapshot = await adminDb.collection('comments').where('taskId', '==', tdoc.id).count().get()
    
    return {
      id: tdoc.id,
      ...tdata,
      dueDate: tdata.dueDate?.toDate?.() || tdata.dueDate,
      assignee: assigneeDoc ? { id: assigneeDoc.id, ...assigneeDoc.data() } : null,
      _count: { comments: commentsSnapshot.data().count }
    }
  }))

  const project = {
    id: projectDoc.id,
    ...projectData,
    createdAt: projectData.createdAt?.toDate?.() || projectData.createdAt,
    manager,
    client,
    members: displayMembers,
    tasks
  }

  if (!project) notFound()

  const can = canManageProjects(session?.user?.permissions)
  const done = project.tasks.filter((t: any) => t.status === 'COMPLETED').length
  const pct = project.tasks.length ? Math.round((done / project.tasks.length) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="px-6 py-5" style={{ background: 'var(--bg1)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/projects" className="flex items-center gap-1 text-xs mb-3 hover:opacity-70 transition-opacity" style={{ color: 'var(--txt3)' }}>
          <ChevronLeft size={12} /> Back to Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--txt0)' }}>{project.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={getStatusColor(project.status)}>{getStatusLabel(project.status)}</Badge>
              <span className="text-xs" style={{ color: 'var(--txt3)' }}>
                {project.client ? `📎 ${project.client.name}` : 'Internal Project'}
              </span>
              <span className="text-xs" style={{ color: 'var(--txt3)' }}>
                Manager: {project.manager.name}
              </span>
            </div>
          </div>
          {can && (
            <div className="flex gap-2">
              <Link href={`/projects/${project.id}/edit`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'var(--bg2)', color: 'var(--txt1)', border: '1px solid var(--border2)' }}>
                Edit
              </Link>
            </div>
          )}
        </div>
        {project.description && (
          <p className="text-sm mt-3 max-w-2xl" style={{ color: 'var(--txt2)' }}>{project.description}</p>
        )}
      </div>

      <div className="p-6 grid grid-cols-3 gap-5">
        {/* Tasks column */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>
              Tasks ({project.tasks.length})
            </div>
            {can && (
              <Link href={`/tasks?projectId=${project.id}`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'var(--accent)', color: '#fff' }}>
                + Add Task
              </Link>
            )}
          </div>

          {project.tasks.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--txt3)' }}>
              <div className="text-2xl mb-2 opacity-30">📋</div>
              <div className="text-sm">No tasks yet</div>
            </div>
          ) : (
            <div className="space-y-3">
              {project.tasks.map((task: any) => (
                <div
                  key={task.id}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium" style={{ color: 'var(--txt0)' }}>{task.title}</div>
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    {task.assignee && (
                      <div className="flex items-center gap-1.5">
                        <Avatar initials={task.assignee.initials} color={task.assignee.avatarColor} size={20} />
                        <span className="text-xs" style={{ color: 'var(--txt3)' }}>{task.assignee.name.split(' ')[0]}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <span className="text-xs ml-auto" style={{ color: 'var(--txt3)' }}>
                        Due {formatDate(task.dueDate)}
                      </span>
                    )}
                    <Badge className={getStatusColor(task.status)}>{getStatusLabel(task.status)}</Badge>
                    {task._count.comments > 0 && (
                      <span className="text-xs" style={{ color: 'var(--txt3)' }}>💬 {task._count.comments}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Progress */}
          <Card>
            <div className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--txt3)' }}>Progress</div>
            <div className="text-3xl font-bold mb-2" style={{ color: 'var(--accent)' }}>{pct}%</div>
            <div className="h-1.5 rounded-full" style={{ background: 'var(--bg3)' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
            </div>
            <div className="text-xs mt-2" style={{ color: 'var(--txt3)' }}>{done} of {project.tasks.length} tasks complete</div>
          </Card>

          {/* Team */}
          <Card>
            <div className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--txt3)' }}>Team</div>
            <div className="space-y-2">
              {project.members.map(({ user: u }: any) => (
                <div key={u.id} className="flex items-center gap-2.5">
                  <Avatar initials={u.initials} color={u.avatarColor} size={30} />
                  <div>
                    <div className="text-xs font-medium" style={{ color: 'var(--txt0)' }}>{u.name}</div>
                    <div className="text-xs" style={{ color: 'var(--txt3)' }}>{u.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Info */}
          <Card>
            <div className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--txt3)' }}>Details</div>
            <table className="w-full text-xs">
              {[
                ['Client', project.client?.name || 'Internal'],
                ['Manager', project.manager.name],
                ['Created', formatDate(project.createdAt)],
                ['Status', getStatusLabel(project.status)],
              ].map(([k, v]: any) => (
                <tr key={k}>
                  <td className="py-1.5" style={{ color: 'var(--txt3)' }}>{k}</td>
                  <td className="py-1.5 text-right" style={{ color: 'var(--txt0)' }}>{v}</td>
                </tr>
              ))}
            </table>
          </Card>
        </div>
      </div>
    </div>
  )
}
