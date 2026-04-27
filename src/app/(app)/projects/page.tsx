'use client'
// src/app/(app)/projects/page.tsx
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { canManageProjects, getStatusColor, getStatusLabel, getProjectProgress } from '@/lib/utils'
import { Avatar, Badge, EmptyState } from '@/components/ui'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProjectsPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const can = canManageProjects(session?.user?.permissions)

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(data => {
      setProjects(data.data || data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete project "${name}" and all its tasks? This cannot be undone.`)) return
    const tid = toast.loading('Deleting project...')
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Project deleted', { id: tid })
      setProjects(prev => prev.filter(p => p.id !== id))
    } else {
      toast.error('Failed to delete project', { id: tid })
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--txt0)' }}>Projects</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--txt3)' }}>{projects.length} total projects</p>
        </div>
        {can && (
          <Link href="/projects/new" className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>
            + New Project
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState icon="📂" title="No projects yet" sub="Create your first project to get started" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((p) => {
            const tasks = p.tasks || []
            const pct = getProjectProgress(tasks)
            return (
              <div key={p.id} className="relative group">
                <Link
                  href={`/projects/${p.id}`}
                  className="block rounded-xl p-5 transition-all hover:-translate-y-0.5 h-full"
                  style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="pr-6">
                      <div className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>{p.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--txt3)' }}>
                        {p.client ? `${p.client.emoji || '🏢'} ${p.client.name}` : 'Internal'}
                      </div>
                    </div>
                    <Badge className={getStatusColor(p.status)}>{getStatusLabel(p.status)}</Badge>
                  </div>

                  <p className="text-xs leading-relaxed mb-4 line-clamp-2" style={{ color: 'var(--txt2)' }}>
                    {p.description || 'No description'}
                  </p>

                  {/* Progress bar */}
                  <div className="h-1 rounded-full mb-4" style={{ background: 'var(--bg3)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      {p.members?.slice(0, 4).map((m: any) => (
                        <Avatar key={m.user?.id || m.id} name={m.user?.name} initials={m.user?.initials} color={m.user?.avatarColor} size={24} />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--txt3)' }}>
                      {tasks.filter((t: any) => t.status === 'COMPLETED').length}/{tasks.length} tasks
                    </span>
                  </div>
                </Link>

                {can && (
                  <button
                    onClick={(e) => handleDelete(e, p.id, p.name)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10"
                    style={{ color: '#ef4444' }}
                    title="Delete project"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
