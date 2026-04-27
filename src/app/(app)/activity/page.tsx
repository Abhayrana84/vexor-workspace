import { adminDb } from '@/lib/firebase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Avatar } from '@/components/ui'
import { timeAgo, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function ActivityPage() {
  await getServerSession(authOptions)

  const activitiesSnapshot = await adminDb.collection('activities').orderBy('createdAt', 'desc').limit(100).get()
  const activities = await Promise.all(activitiesSnapshot.docs.map(async (doc) => {
    const data = doc.data()
    
    // Manual join for user, project, task
    const userDoc = await adminDb.collection('users').doc(data.userId).get()
    const projectDoc = data.projectId ? await adminDb.collection('projects').doc(data.projectId).get() : null
    const taskDoc = data.taskId ? await adminDb.collection('tasks').doc(data.taskId).get() : null

    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      user: { id: userDoc.id, ...userDoc.data() },
      project: projectDoc ? { id: projectDoc.id, name: projectDoc.data()?.name } : null,
      task: taskDoc ? { id: taskDoc.id, title: taskDoc.data()?.title } : null,
    }
  }))

  // Group by date
  const grouped: Record<string, typeof activities> = {}
  for (const a of activities) {
    const key = formatDate(a.createdAt)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(a)
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--txt0)' }}>Activity Log</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--txt3)' }}>
          Full history of workspace events
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div
              className="text-xs uppercase tracking-widest font-semibold mb-4 pb-2"
              style={{ color: 'var(--txt3)', borderBottom: '1px solid var(--border)' }}
            >
              {date}
            </div>
            <div className="space-y-0">
              {items.map((a, i) => (
                <div
                  key={a.id}
                  className="flex gap-3 py-3"
                  style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center flex-shrink-0 w-8">
                    <Avatar
                      initials={a.user.initials}
                      color={a.user.avatarColor}
                      size={28}
                      name={a.user.name}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="text-sm" style={{ color: 'var(--txt1)' }}>
                      <span className="font-semibold" style={{ color: 'var(--txt0)' }}>
                        {a.user.name}
                      </span>{' '}
                      <span>{a.action}</span>{' '}
                      {a.project ? (
                        <Link
                          href={`/projects/${a.project.id}`}
                          className="font-medium hover:underline"
                          style={{ color: 'var(--accent2)' }}
                        >
                          {a.target}
                        </Link>
                      ) : a.task ? (
                        <Link
                          href={`/tasks/${a.task.id}`}
                          className="font-medium hover:underline"
                          style={{ color: 'var(--accent2)' }}
                        >
                          {a.target}
                        </Link>
                      ) : (
                        <span className="font-medium" style={{ color: 'var(--txt0)' }}>{a.target}</span>
                      )}
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--txt3)' }}>
                      {timeAgo(a.createdAt)}
                      {a.project && (
                        <>
                          {' · '}
                          <Link href={`/projects/${a.project.id}`} className="hover:underline">
                            {a.project.name}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--txt3)' }}>
            <div className="text-3xl mb-3 opacity-30">📜</div>
            <div className="text-sm">No activity yet</div>
          </div>
        )}
      </div>
    </div>
  )
}
