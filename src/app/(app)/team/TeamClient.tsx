'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, Badge, Button, Modal, FormField, Input, Select } from '@/components/ui'
import { getPermissionColor } from '@/lib/utils'
import { Edit2, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const permLabel: Record<string, string> = { 
  SUPER_ADMIN: 'Super Admin', 
  ADMIN: 'Administrator', 
  MANAGER: 'Project Manager', 
  TEAM_LEAD: 'Team Lead', 
  MEMBER: 'Member', 
  CLIENT_OPERATIONS: 'CCO' 
}

export function TeamClient({ initialTeam, isAdmin }: { initialTeam: any[], isAdmin: boolean }) {
  const [team, setTeam] = useState(initialTeam)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const router = useRouter()

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    const target = e.target as any
    const data = {
      name: target.userName.value,
      email: target.email.value,
      role: target.role.value,
      password: target.password.value,
    }

    const toastId = toast.loading('Adding member...')
    const res = await fetch('/api/team', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    })

    if (res.ok) {
      toast.success('Member added!', { id: toastId })
      setShowAddModal(false)
      router.refresh()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to add member', { id: toastId })
    }
  }

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault()
    const target = e.target as any
    const role = target.role.value
    const password = target.password.value

    const data: any = { userId: editingUser.id }
    if (role) data.role = role
    if (password) data.password = password

    const toastId = toast.loading('Updating member...')
    const res = await fetch('/api/team', {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    })

    if (res.ok) {
      toast.success('Member updated!', { id: toastId })
      setEditingUser(null)
      router.refresh()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to update member', { id: toastId })
    }
  }

  const handleDeleteMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the team? This cannot be undone.`)) return
    const toastId = toast.loading('Removing member...')
    const res = await fetch(`/api/team?userId=${userId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Member removed', { id: toastId })
      setTeam(prev => prev.filter(u => u.id !== userId))
      setEditingUser(null)
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to remove member', { id: toastId })
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--txt0)' }}>Team</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--txt3)' }}>{team.length} members at Vexor IT Solutions</p>
        </div>
        {isAdmin && (
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Member
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {team.map((u) => (
          <div
            key={u.id}
            className="rounded-xl p-5 text-center relative group"
            style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}
          >
            {isAdmin && (
              <button
                onClick={() => setEditingUser(u)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:bg-black/10"
                style={{ color: 'var(--txt3)' }}
              >
                <Edit2 size={14} />
              </button>
            )}
            <div className="flex justify-center mb-3">
              <Avatar initials={u.initials} color={u.avatarColor} size={56} name={u.name} />
            </div>
            <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--txt0)' }}>{u.name}</div>
            <div className="text-xs mb-1" style={{ color: 'var(--txt3)' }}>{u.role}</div>
            <div className="text-xs mb-3" style={{ color: 'var(--accent2)' }}>{u.email}</div>
            <Badge className={getPermissionColor(u.permission)}>
              {permLabel[u.permission] || u.permission}
            </Badge>
            <div className="flex justify-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div>
                <div className="text-sm font-bold" style={{ color: 'var(--txt0)' }}>{u._count.assignedTasks}</div>
                <div className="text-xs" style={{ color: 'var(--txt3)' }}>Tasks</div>
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: 'var(--txt0)' }}>{u._count.managedProjects}</div>
                <div className="text-xs" style={{ color: 'var(--txt3)' }}>Projects</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <Modal title="Add New Member" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddMember} className="space-y-4">
            <FormField label="Full Name">
              <Input name="userName" required placeholder="John Doe" />
            </FormField>
            <FormField label="Email">
              <Input name="email" type="email" required placeholder="john@vexor.in" />
            </FormField>
            <FormField label="Role / Permission">
              <Select name="role" required>
                <option value="MEMBER">Member</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="CLIENT_OPERATIONS">Client Operations</option>
              </Select>
            </FormField>
            <FormField label="Temporary Password">
              <Input name="password" type="text" required minLength={6} placeholder="Secure password" />
            </FormField>
            <div className="pt-2 flex justify-end">
              <Button variant="primary" type="submit">Create Member</Button>
            </div>
          </form>
        </Modal>
      )}

      {editingUser && (
        <Modal title={`Edit ${editingUser.name}`} onClose={() => setEditingUser(null)}>
          <form onSubmit={handleEditMember} className="space-y-4">
            <FormField label="Change Role">
              <Select name="role" defaultValue={editingUser.permission}>
                <option value="">No Change</option>
                <option value="MEMBER">Member</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="CLIENT_OPERATIONS">Client Operations</option>
              </Select>
            </FormField>
            <FormField label="Reset Password">
              <Input name="password" type="text" minLength={6} placeholder="Leave blank to keep current" />
            </FormField>
            <div className="pt-2 flex justify-between items-center">
              <Button
                variant="danger"
                type="button"
                onClick={() => handleDeleteMember(editingUser.id, editingUser.name)}
              >
                <Trash2 size={13} /> Remove Member
              </Button>
              <Button variant="primary" type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
