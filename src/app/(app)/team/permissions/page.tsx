'use client'
// src/app/(app)/team/permissions/page.tsx
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Avatar, Badge, Loading } from '@/components/ui'
import { getPermissionColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import { ShieldCheck } from 'lucide-react'

const PERMISSION_LEVELS = [
  { value: 'ADMIN', label: 'Admin', desc: 'Full control — create, edit, delete everything, manage permissions' },
  { value: 'MANAGER', label: 'Manager', desc: 'Create and manage projects and tasks, add clients' },
  { value: 'MEMBER', label: 'Member', desc: 'View all, work on assigned tasks, add comments' },
]

export default function PermissionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      toast.error('Admin access required')
      router.push('/team')
      return
    }
    fetch('/api/team').then(r => r.json()).then(data => {
      setTeam(data.data || data || [])
      setLoading(false)
    })
  }, [session, status])

  async function updatePermission(userId: string, permission: string) {
    if (userId === session?.user?.id) {
      toast.error("You can't change your own permission level")
      return
    }
    setUpdating(userId)
    const res = await fetch('/api/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, permission }),
    })
    setUpdating(null)
    if (res.ok) {
      setTeam(prev => prev.map(u => u.id === userId ? { ...u, permission } : u))
      toast.success('Permission updated')
    } else {
      toast.error('Failed to update permission')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck size={20} style={{ color: 'var(--accent)' }} />
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--txt0)' }}>
          Permissions
        </h1>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--txt3)' }}>
        Control what each team member can access and edit. Admin only.
      </p>

      {/* Permission legend */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {PERMISSION_LEVELS.map(p => (
          <div key={p.value} className="rounded-xl p-4" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
            <Badge className={`${getPermissionColor(p.value)} mb-2`}>{p.label}</Badge>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--txt3)' }}>{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Team list */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
        {team.map((u, i) => (
          <div
            key={u.id}
            className="flex items-center gap-4 px-5 py-4"
            style={{ borderBottom: i < team.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <Avatar initials={u.initials} color={u.avatarColor} size={36} name={u.name} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>
                {u.name}
                {u.id === session?.user?.id && (
                  <span className="ml-2 text-xs" style={{ color: 'var(--txt3)' }}>(you)</span>
                )}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--txt3)' }}>{u.role} · {u.email}</div>
            </div>

            {/* Permission selector */}
            <div className="flex gap-2">
              {PERMISSION_LEVELS.map(p => (
                <button
                  key={p.value}
                  disabled={updating === u.id || u.id === session?.user?.id}
                  onClick={() => updatePermission(u.id, p.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: u.permission === p.value ? 'var(--accent)' : 'var(--bg2)',
                    color: u.permission === p.value ? '#fff' : 'var(--txt2)',
                    border: `1px solid ${u.permission === p.value ? 'var(--accent)' : 'var(--border2)'}`,
                  }}
                >
                  {updating === u.id ? '…' : p.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
