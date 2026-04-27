'use client'
// src/app/(app)/clients/page.tsx
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Badge, EmptyState } from '@/components/ui'
import { hasPermission, getStatusColor } from '@/lib/utils'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClientsPage() {
  const { data: session } = useSession()
  const can = hasPermission(session?.user?.permissions, 'can_manage_clients')
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(data => {
      setClients(Array.isArray(data) ? data : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete client "${name}"? This cannot be undone.`)) return
    const toastId = toast.loading('Deleting client...')
    const res = await fetch(`/api/clients?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Client deleted', { id: toastId })
      setClients(prev => prev.filter(c => c.id !== id))
    } else {
      toast.error('Failed to delete client', { id: toastId })
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
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--txt0)' }}>Clients</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--txt3)' }}>{clients.length} active clients</p>
        </div>
        {can && (
          <Link href="/clients/new"
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            + Add Client
          </Link>
        )}
      </div>

      {clients.length === 0 ? (
        <EmptyState icon="🏢" title="No clients yet" sub="Add your first client" />
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
          {clients.map((client, i) => (
            <div
              key={client.id}
              className="flex items-center gap-4 px-5 py-4 group"
              style={{ borderBottom: i < clients.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              {/* Logo */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: 'var(--accentbg)' }}
              >
                {client.emoji}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>{client.name}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--txt3)' }}>
                  {client.contactName && `${client.contactName} · `}{client.email}
                  {client.phone && ` · ${client.phone}`}
                </div>
              </div>

              {/* Projects */}
              <div className="flex gap-2 flex-wrap">
                {client.projects?.map((p: any) => (
                  <Link key={p.id} href={`/projects/${p.id}`}>
                    <Badge className={getStatusColor(p.status)}>{p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name}</Badge>
                  </Link>
                ))}
                {(!client.projects || client.projects.length === 0) && (
                  <span className="text-xs" style={{ color: 'var(--txt3)' }}>No projects linked</span>
                )}
              </div>

              {/* Delete */}
              {can && (
                <button
                  onClick={() => handleDelete(client.id, client.name)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all hover:bg-red-500/10 flex-shrink-0"
                  style={{ color: '#ef4444' }}
                  title="Delete client"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
