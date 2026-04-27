// src/app/(app)/clients/[id]/page.tsx
import { adminDb } from '@/lib/firebase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { Badge, Card } from '@/components/ui'
import { getStatusColor, getStatusLabel, getProjectProgress, formatDate, hasPermission } from '@/lib/utils'
import Link from 'next/link'
import { ChevronLeft, Mail, Phone } from 'lucide-react'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  const clientDoc = await adminDb.collection('clients').doc(params.id).get()
  if (!clientDoc.exists) notFound()
  const clientData = clientDoc.data() as any

  // Fetch projects for this client
  const projectsSnapshot = await adminDb.collection('projects').where('clientId', '==', params.id).get()
  const projects = await Promise.all(projectsSnapshot.docs.map(async (pdoc) => {
    const pdata = pdoc.data() as any
    const managerDoc = await adminDb.collection('users').doc(pdata.managerId).get()
    const tasksSnapshot = await adminDb.collection('tasks').where('projectId', '==', pdoc.id).get()
    const tasks = tasksSnapshot.docs.map((t: any) => t.data())
    
    return {
      id: pdoc.id,
      ...pdata,
      manager: managerDoc.data(),
      tasks,
      _count: { tasks: tasks.length }
    }
  }))

  const client = { id: clientDoc.id, ...clientData, projects }
  const can = hasPermission(session?.user?.permissions, 'can_manage_clients')

  return (
    <div className="p-6 max-w-4xl">
      <Link href="/clients" className="flex items-center gap-1 text-xs mb-5 hover:opacity-70" style={{ color: 'var(--txt3)' }}>
        <ChevronLeft size={12} /> Back to Clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: 'var(--accentbg)', border: '1px solid var(--border2)' }}>
            {client.emoji}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--txt0)' }}>{client.name}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--txt3)' }}>
                <Mail size={11} /> {client.email}
              </div>
              {client.phone && (
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--txt3)' }}>
                  <Phone size={11} /> {client.phone}
                </div>
              )}
            </div>
          </div>
        </div>
        {can && (
          <Link href={`/projects/new?clientId=${client.id}`}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            + New Project
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Projects', value: client.projects.length },
          { label: 'Active', value: client.projects.filter((p: any) => p.status === 'IN_PROGRESS').length },
          { label: 'Completed', value: client.projects.filter((p: any) => p.status === 'COMPLETED').length },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center"
            style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--txt0)' }}>{s.value}</div>
            <div className="text-xs" style={{ color: 'var(--txt3)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Projects */}
      <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--txt0)' }}>
        Projects ({client.projects.length})
      </h2>
      {client.projects.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--txt3)' }}>
          <div className="text-2xl mb-2 opacity-30">📂</div>
          <div className="text-sm">No projects yet for this client</div>
        </div>
      ) : (
        <div className="space-y-3">
          {client.projects.map((p: any) => {
            const pct = getProjectProgress(p.tasks)
            return (
              <Link key={p.id} href={`/projects/${p.id}`}
                className="block rounded-xl p-5 transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>{p.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--txt3)' }}>
                      Manager: {p.manager.name} · Created {formatDate(p.createdAt)}
                    </div>
                  </div>
                  <Badge className={getStatusColor(p.status)}>{getStatusLabel(p.status)}</Badge>
                </div>
                <div className="h-1 rounded-full mb-2" style={{ background: 'var(--bg3)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                </div>
                <div className="flex justify-between text-xs" style={{ color: 'var(--txt3)' }}>
                  <span>{pct}% complete</span>
                  <span>{p._count.tasks} tasks</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
