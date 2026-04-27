'use client'
// src/app/(app)/projects/new/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button, FormField, Input, Select, Textarea } from '@/components/ui'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useEffect } from 'react'

export default function NewProjectPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [team, setTeam] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '', description: '', status: 'PLANNING',
    managerId: '', clientId: '', memberIds: [] as string[],
  })

  useEffect(() => {
    Promise.all([fetch('/api/team').then(r => r.json()), fetch('/api/clients').then(r => r.json())])
      .then(([t, c]) => { setTeam(t.data || t || []); setClients(c); setForm(f => ({ ...f, managerId: session?.user?.id || '' })) })
  }, [session])

  function toggleMember(id: string) {
    setForm(f => ({
      ...f,
      memberIds: f.memberIds.includes(id) ? f.memberIds.filter(m => m !== id) : [...f.memberIds, id]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Project name is required')
    setLoading(true)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) {
      const project = await res.json()
      toast.success('Project created!')
      router.push(`/projects/${project.id}`)
    } else {
      toast.error('Failed to create project')
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/projects" className="flex items-center gap-1 text-xs mb-5 hover:opacity-70" style={{ color: 'var(--txt3)' }}>
        <ChevronLeft size={12} /> Back to Projects
      </Link>
      <h1 className="text-xl font-bold tracking-tight mb-6" style={{ color: 'var(--txt0)' }}>New Project</h1>

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl p-6 space-y-1" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
          <FormField label="Project Name *">
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Brand Identity Redesign"
              required
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief project overview…"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Status">
              <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Completed</option>
              </Select>
            </FormField>

            <FormField label="Client">
              <Select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                <option value="">No Client (Internal)</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </Select>
            </FormField>
          </div>

          <FormField label="Project Manager">
            <Select value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}>
              <option value="">Select manager…</option>
              {team.map(u => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
            </Select>
          </FormField>

          <FormField label="Team Members">
            <div className="grid grid-cols-2 gap-2">
              {team.map(u => (
                <label
                  key={u.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  style={{
                    background: form.memberIds.includes(u.id) ? 'var(--accentbg)' : 'var(--bg2)',
                    border: `1px solid ${form.memberIds.includes(u.id) ? 'var(--accentborder)' : 'var(--border2)'}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.memberIds.includes(u.id)}
                    onChange={() => toggleMember(u.id)}
                    className="hidden"
                  />
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ background: `${u.avatarColor}20`, color: u.avatarColor }}
                  >
                    {u.initials}
                  </div>
                  <span className="text-xs" style={{ color: form.memberIds.includes(u.id) ? 'var(--accent2)' : 'var(--txt1)' }}>
                    {u.name.split(' ')[0]}
                  </span>
                </label>
              ))}
            </div>
          </FormField>
        </div>

        <div className="flex gap-3 justify-end mt-5">
          <Link href="/projects">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Project'}
          </Button>
        </div>
      </form>
    </div>
  )
}
