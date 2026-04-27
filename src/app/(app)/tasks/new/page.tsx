'use client'
// src/app/(app)/tasks/new/page.tsx
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, FormField, Input, Select, Textarea } from '@/components/ui'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function NewTaskPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    projectId: searchParams.get('projectId') || '',
    assigneeId: '',
    priority: 'MEDIUM',
    status: searchParams.get('status') || 'TODO',
    dueDate: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/team').then(r => r.json()),
    ]).then(([p, t]) => { setProjects(p.data || p || []); setTeam(t.data || t || []) })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Task title is required')
    if (!form.projectId) return toast.error('Please select a project')
    setLoading(true)
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) {
      toast.success('Task created!')
      router.push('/tasks')
    } else {
      toast.error('Failed to create task')
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/tasks" className="flex items-center gap-1 text-xs mb-5 hover:opacity-70" style={{ color: 'var(--txt3)' }}>
        <ChevronLeft size={12} /> Back to Tasks
      </Link>
      <h1 className="text-xl font-bold tracking-tight mb-6" style={{ color: 'var(--txt0)' }}>New Task</h1>

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl p-6 space-y-1" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
          <FormField label="Task Title *">
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Describe what needs to be done…"
              required
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Optional details, acceptance criteria, links…"
            />
          </FormField>

          <FormField label="Project *">
            <Select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
              <option value="">Select project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </FormField>

          <FormField label="Assign To">
            <Select value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
              <option value="">Unassigned</option>
              {team.map(u => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
            </Select>
          </FormField>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Priority">
              <Select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Completed</option>
              </Select>
            </FormField>
            <FormField label="Due Date">
              <Input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </FormField>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-5">
          <Link href="/tasks"><Button variant="ghost">Cancel</Button></Link>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create Task'}
          </Button>
        </div>
      </form>
    </div>
  )
}
