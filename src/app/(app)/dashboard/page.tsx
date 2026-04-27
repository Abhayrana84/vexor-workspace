// src/app/(app)/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { Avatar, Card } from '@/components/ui'
import { getStatusColor, getStatusLabel, timeAgo } from '@/lib/utils'
import Link from 'next/link'

async function getDashboardData() {
  const [
    totalProjects,
    activeProjects,
    totalTasks,
    activeTasks,
    completedTasks,
    reviewTasks,
    recentActivitySnapshot,
    projectProgressSnapshot
  ] = await Promise.all([
    adminDb.collection('projects').count().get(),
    adminDb.collection('projects').where('status', '==', 'IN_PROGRESS').count().get(),
    adminDb.collection('tasks').count().get(),
    adminDb.collection('tasks').where('status', '==', 'IN_PROGRESS').count().get(),
    adminDb.collection('tasks').where('status', '==', 'COMPLETED').count().get(),
    adminDb.collection('tasks').where('status', '==', 'REVIEW').count().get(),
    adminDb.collection('activities').orderBy('createdAt', 'desc').limit(8).get(),
    adminDb.collection('projects').orderBy('updatedAt', 'desc').limit(5).get(),
  ])

  // Process activities and include user data
  const recentActivity = await Promise.all(
    recentActivitySnapshot.docs.map(async (doc) => {
      const activity = doc.data()
      const userSnapshot = await adminDb.collection('users').doc(activity.userId).get()
      const userData = userSnapshot.data() || { name: 'Unknown', initials: '??', avatarColor: '#ccc' }
      return {
        id: doc.id,
        ...activity,
        createdAt: activity.createdAt?.toDate?.() || activity.createdAt,
        user: userData,
      }
    })
  ) as any[]

  // Process project progress
  const projectProgress = await Promise.all(
    projectProgressSnapshot.docs.map(async (doc) => {
      const project = doc.data()
      const tasksSnapshot = await adminDb.collection('tasks').where('projectId', '==', doc.id).get()
      const tasks = tasksSnapshot.docs.map(tdoc => tdoc.data())
      return {
        id: doc.id,
        ...project,
        tasks: tasks,
      }
    })
  ) as any[]

  return {
    totalProjects: totalProjects.data().count,
    activeProjects: activeProjects.data().count,
    totalTasks: totalTasks.data().count,
    activeTasks: activeTasks.data().count,
    completedTasks: completedTasks.data().count,
    reviewTasks: reviewTasks.data().count,
    recentActivity,
    projectProgress,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const d = await getDashboardData()
  const firstName = session?.user?.name?.split(' ')[0]

  const stats = [
    { label: 'Total Projects', value: d.totalProjects, icon: '📁', color: '#6d6afe' },
    { label: 'Active Tasks', value: d.activeTasks, icon: '⚡', color: '#f59e0b' },
    { label: 'Completed', value: d.completedTasks, icon: '✅', color: '#22c55e' },
    { label: 'In Review', value: d.reviewTasks, icon: '🔍', color: '#a855f7' },
  ]

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--txt0)' }}>
          Good morning, {firstName} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--txt3)' }}>
          Here's what's happening at Vexor today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="rounded-xl p-5 relative overflow-hidden"
            style={{ background: 'var(--bg1)', border: '1px solid var(--border)', animationDelay: `${i * 0.05}s` }}
          >
            <div
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: `${s.color}15` }}
            >
              {s.icon}
            </div>
            <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--txt3)' }}>
              {s.label}
            </div>
            <div className="text-3xl font-bold tracking-tight" style={{ color: 'var(--txt0)' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="grid grid-cols-2 gap-5">
        {/* Activity feed */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>Team Activity</div>
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--greenbg)', color: '#22c55e' }}>Live</span>
          </div>
          <div className="space-y-0">
            {d.recentActivity.map((a) => (
              <div
                key={a.id}
                className="flex gap-2.5 py-2.5"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <Avatar initials={a.user.initials} color={a.user.avatarColor} size={28} />
                <div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--txt1)' }}>
                    <strong style={{ color: 'var(--txt0)' }}>{a.user.name.split(' ')[0]}</strong>{' '}
                    {a.action}{' '}
                    <span style={{ color: 'var(--accent2)' }}>{a.target}</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--txt3)' }}>
                    {timeAgo(a.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          {/* Project progress */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>Project Progress</div>
              <Link href="/projects" className="text-xs" style={{ color: 'var(--accent2)' }}>View all →</Link>
            </div>
            <div className="space-y-3">
              {d.projectProgress.map((p) => {
                const done = p.tasks.filter((t: any) => t.status === 'COMPLETED').length
                const pct = p.tasks.length ? Math.round((done / p.tasks.length) * 100) : 0
                return (
                  <div key={p.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--txt1)' }} className="truncate pr-4">{p.name}</span>
                      <span style={{ color: 'var(--txt3)' }}>{pct}%</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: 'var(--bg3)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: 'var(--accent)' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Quick links */}
          <Card>
            <div className="text-sm font-semibold mb-3" style={{ color: 'var(--txt0)' }}>Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/projects/new', label: '+ New Project', color: 'var(--accent)' },
                { href: '/kanban', label: 'Open Kanban', color: 'var(--txt2)' },
                { href: '/team', label: 'View Team', color: 'var(--txt2)' },
                { href: '/tasks', label: 'My Tasks', color: 'var(--txt2)' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-center transition-opacity hover:opacity-70"
                  style={{
                    background: item.label.startsWith('+') ? 'var(--accent)' : 'var(--bg2)',
                    color: item.label.startsWith('+') ? '#fff' : 'var(--txt1)',
                    border: item.label.startsWith('+') ? 'none' : '1px solid var(--border2)',
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
