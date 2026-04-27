'use client'
// src/app/(app)/tasks/[id]/page.tsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Avatar, Badge, Button, FormField, Select, Input, Loading } from '@/components/ui'
import {
  getPriorityColor, getStatusColor, getStatusLabel,
  formatDate, timeAgo, canAssignTasks,
} from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ChevronLeft, Trash2, Send, MessageSquare, Calendar, User, Tag } from 'lucide-react'

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH']

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const [task, setTask] = useState<any>(null)
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const commentsEndRef = useRef<HTMLDivElement>(null)

  const can = canAssignTasks(session?.user?.permissions)
  const isAdmin = canAssignTasks(session?.user?.permissions)

  useEffect(() => {
    Promise.all([
      fetch(`/api/tasks/${id}`).then(r => r.json()),
      fetch('/api/team').then(r => r.json()),
    ]).then(([t, team]) => {
      setTask(t)
      setTeam(team.data || team || [])
      setEditForm({
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        assigneeId: t.assigneeId || '',
        dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '',
      })
      setLoading(false)
    })
  }, [id])

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setSaving(false)
    if (res.ok) {
      const updated = await res.json()
      setTask((prev: any) => ({ ...prev, ...updated }))
      setEditing(false)
      toast.success('Task updated')
    } else {
      toast.error('Failed to update task')
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this task permanently?')) return
    setDeleting(true)
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Task deleted')
      router.push('/tasks')
    } else {
      toast.error('Failed to delete task')
      setDeleting(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTask((prev: any) => ({ ...prev, status: updated.status }))
      toast.success(`Moved to ${getStatusLabel(newStatus)}`)
    }
  }

  async function postComment() {
    if (!comment.trim()) return
    setPosting(true)
    const res = await fetch(`/api/tasks/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment.trim() }),
    })
    setPosting(false)
    if (res.ok) {
      const newComment = await res.json()
      setTask((prev: any) => ({ ...prev, comments: [...(prev.comments || []), newComment] }))
      setComment('')
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } else {
      toast.error('Failed to post comment')
    }
  }

  if (loading) return <Loading />
  if (!task) return <div className="p-6" style={{ color: 'var(--txt3)' }}>Task not found</div>

  return (
    <div className="p-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-5" style={{ color: 'var(--txt3)' }}>
        <Link href="/tasks" className="hover:opacity-70 flex items-center gap-1">
          <ChevronLeft size={12} /> Tasks
        </Link>
        <span>/</span>
        <Link href={`/projects/${task.project?.id}`} className="hover:opacity-70" style={{ color: 'var(--accent2)' }}>
          {task.project?.name}
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-5">

          {/* Title + actions */}
          <div className="rounded-xl p-5" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
            {editing ? (
              <div className="space-y-3">
                <FormField label="Title">
                  <Input
                    value={editForm.title}
                    onChange={e => setEditForm((f: any) => ({ ...f, title: e.target.value }))}
                    placeholder="Task title"
                  />
                </FormField>
                <FormField label="Description">
                  <textarea
                    value={editForm.description}
                    onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))}
                    placeholder="Add details, links, acceptance criteria…"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y min-h-24"
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }}
                  />
                </FormField>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h1 className="text-lg font-bold leading-snug" style={{ color: 'var(--txt0)' }}>
                    {task.title}
                  </h1>
                  {can && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                      {isAdmin && (
                        <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
                          <Trash2 size={11} />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap mb-4">
                  <Badge className={getStatusColor(task.status)}>{getStatusLabel(task.status)}</Badge>
                  <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                </div>
                {task.description ? (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--txt2)' }}>{task.description}</p>
                ) : (
                  <p className="text-sm italic" style={{ color: 'var(--txt3)' }}>No description</p>
                )}
              </>
            )}
          </div>

          {/* Move to column buttons */}
          <div className="rounded-xl p-4" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
            <div className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--txt3)' }}>
              Move to
            </div>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                  style={{
                    background: task.status === s ? 'var(--accent)' : 'var(--bg2)',
                    color: task.status === s ? '#fff' : 'var(--txt1)',
                    border: `1px solid ${task.status === s ? 'var(--accent)' : 'var(--border2)'}`,
                  }}
                >
                  {getStatusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="rounded-xl p-5" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={14} style={{ color: 'var(--txt3)' }} />
              <div className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>
                Comments ({task.comments?.length || 0})
              </div>
            </div>

            <div className="space-y-4 mb-5">
              {task.comments?.length === 0 && (
                <p className="text-sm text-center py-6" style={{ color: 'var(--txt3)' }}>
                  No comments yet — be the first to say something
                </p>
              )}
              {task.comments?.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar initials={c.author?.initials} color={c.author?.avatarColor} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold" style={{ color: 'var(--txt0)' }}>
                        {c.author?.name}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--txt3)' }}>
                        {timeAgo(c.createdAt)}
                      </span>
                    </div>
                    <div
                      className="text-sm leading-relaxed rounded-lg px-3 py-2"
                      style={{ background: 'var(--bg2)', color: 'var(--txt1)' }}
                    >
                      {c.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment input */}
            <div className="flex gap-2 items-end">
              <Avatar
                initials={session?.user?.initials}
                color={session?.user?.avatarColor}
                size={28}
              />
              <div className="flex-1 flex gap-2">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment() } }}
                  placeholder="Write a comment… (Enter to send)"
                  rows={2}
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border2)',
                    color: 'var(--txt0)',
                    fontFamily: 'Sora, sans-serif',
                  }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={postComment}
                  disabled={posting || !comment.trim()}
                  style={{ alignSelf: 'flex-end', flexShrink: 0 }}
                >
                  <Send size={12} />
                  {posting ? '…' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Task properties */}
          <div className="rounded-xl p-5" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
            <div className="text-xs uppercase tracking-wider font-semibold mb-4" style={{ color: 'var(--txt3)' }}>
              Properties
            </div>

            {/* Assignee */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: 'var(--txt3)' }}>
                <User size={11} /> Assignee
              </div>
              {can ? (
                <Select
                  value={editForm.assigneeId}
                  onChange={async e => {
                    const newId = e.target.value
                    setEditForm((f: any) => ({ ...f, assigneeId: newId }))
                    await fetch(`/api/tasks/${id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ assigneeId: newId }),
                    })
                    const updated = team.find(u => u.id === newId)
                    setTask((prev: any) => ({ ...prev, assignee: updated || null, assigneeId: newId }))
                    toast.success('Assignee updated')
                  }}
                >
                  <option value="">Unassigned</option>
                  {team.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </Select>
              ) : (
                task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar initials={task.assignee.initials} color={task.assignee.avatarColor} size={24} />
                    <span className="text-sm" style={{ color: 'var(--txt0)' }}>{task.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--txt3)' }}>Unassigned</span>
                )
              )}
            </div>

            {/* Priority */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: 'var(--txt3)' }}>
                <Tag size={11} /> Priority
              </div>
              {can ? (
                <Select
                  value={editForm.priority}
                  onChange={async e => {
                    const p = e.target.value
                    setEditForm((f: any) => ({ ...f, priority: p }))
                    await fetch(`/api/tasks/${id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ priority: p }),
                    })
                    setTask((prev: any) => ({ ...prev, priority: p }))
                    toast.success('Priority updated')
                  }}
                >
                  {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </Select>
              ) : (
                <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
              )}
            </div>

            {/* Due date */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: 'var(--txt3)' }}>
                <Calendar size={11} /> Due Date
              </div>
              {can ? (
                <Input
                  type="date"
                  value={editForm.dueDate}
                  onChange={async e => {
                    const d = e.target.value
                    setEditForm((f: any) => ({ ...f, dueDate: d }))
                    await fetch(`/api/tasks/${id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ dueDate: d }),
                    })
                    setTask((prev: any) => ({ ...prev, dueDate: d }))
                    toast.success('Due date updated')
                  }}
                />
              ) : (
                <span className="text-sm" style={{ color: 'var(--txt0)' }}>
                  {task.dueDate ? formatDate(task.dueDate) : '—'}
                </span>
              )}
            </div>

            {/* Project */}
            <div>
              <div className="text-xs mb-2" style={{ color: 'var(--txt3)' }}>Project</div>
              <Link
                href={`/projects/${task.project?.id}`}
                className="text-sm hover:underline"
                style={{ color: 'var(--accent2)' }}
              >
                {task.project?.name}
              </Link>
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-xl p-5" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
            <div className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: 'var(--txt3)' }}>
              Info
            </div>
            <table className="w-full text-xs">
            <tbody>
              {[
                ['Created', timeAgo(task.createdAt)],
                ['Updated', timeAgo(task.updatedAt)],
                ['Comments', task.comments?.length || 0],
              ].map(([k, v]) => (
                <tr key={String(k)}>
                  <td className="py-1.5" style={{ color: 'var(--txt3)' }}>{k}</td>
                  <td className="py-1.5 text-right" style={{ color: 'var(--txt0)' }}>{String(v)}</td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
