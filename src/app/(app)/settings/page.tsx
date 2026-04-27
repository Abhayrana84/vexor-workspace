'use client'
// src/app/(app)/settings/page.tsx
import { useSession } from 'next-auth/react'
import { Avatar } from '@/components/ui'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

function Toggle({ checked = false, onChange }: { checked?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-10 h-5 rounded-full relative transition-colors flex-shrink-0"
      style={{ background: checked ? 'var(--accent)' : 'var(--bg4)', border: '1px solid var(--border2)' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
        style={{ left: checked ? '18px' : '2px' }}
      />
    </button>
  )
}

const NOTIF_SETTINGS = [
  { id: 'notifTaskAssignments', label: 'Task assignments', desc: 'Notify when a task is assigned to you', defaultOn: true },
  { id: 'notifProjectUpdates', label: 'Project updates', desc: 'Get updates on project status changes', defaultOn: true },
  { id: 'notifNewComments', label: 'New comments', desc: 'Alert when someone comments on your tasks', defaultOn: false },
  { id: 'notifMentions', label: 'Mentions', desc: 'Alert when someone @mentions you', defaultOn: true },
]

const WORKSPACE_SETTINGS = [
  { id: 'lightMode', label: 'Light mode', desc: 'Use light theme across the workspace', defaultOn: false },
  { id: 'compactSidebar', label: 'Compact sidebar', desc: 'Use condensed navigation labels', defaultOn: false },
  { id: 'activityFeed', label: 'Activity feed', desc: 'Show team activity on dashboard', defaultOn: true },
  { id: 'emailDigests', label: 'Email digests', desc: 'Receive a weekly summary email', defaultOn: false },
]

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const user = session?.user
  
  const [settings, setSettings] = useState<any>({ lightMode: false })

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data.settings) setSettings(data.settings)
    })
  }, [])

  // Update HTML class when lightMode changes
  if (typeof window !== 'undefined') {
    if (settings.lightMode) document.documentElement.classList.add('light')
    else document.documentElement.classList.remove('light')
  }

  const updateSetting = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    // Optimistic UI update
    if (key === 'lightMode') {
      if (value) document.documentElement.classList.add('light')
      else document.documentElement.classList.remove('light')
    }

    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings })
      })
    } catch (e) {
      toast.error('Failed to save settings')
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold tracking-tight mb-6" style={{ color: 'var(--txt0)' }}>Settings</h1>

      {/* Profile */}
      <section className="mb-8">
        <div className="text-sm font-semibold mb-1" style={{ color: 'var(--txt0)' }}>Account</div>
        <div className="text-xs mb-4" style={{ color: 'var(--txt3)' }}>Your profile and account information</div>
        <div className="rounded-xl p-5" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4 mb-5">
            <label className="cursor-pointer relative group">
              <Avatar
                initials={user?.initials}
                color={user?.avatarColor}
                size={56}
                image={user?.avatarUrl}
              />
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-white font-semibold">EDIT</span>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 3 * 1024 * 1024) return toast.error('Image must be less than 3MB')

                  const tid = toast.loading('Uploading...')
                  try {
                    const formData = new FormData()
                    formData.append('file', file)

                    const res = await fetch('/api/users/avatar/upload', {
                      method: 'POST',
                      body: formData,
                    })

                    const data = await res.json()
                    if (res.ok && data.avatarUrl) {
                      await updateSession({ avatarUrl: data.avatarUrl })
                      toast.success('Avatar updated!', { id: tid })
                    } else {
                      throw new Error(data.error || 'Upload failed')
                    }
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to upload', { id: tid })
                  }
                }}
              />
            </label>
            <div>
              <div className="text-base font-semibold" style={{ color: 'var(--txt0)' }}>{user?.name}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--txt3)' }}>{user?.email}</div>
            </div>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Role', (user as any)?.role],
                ['Permission Level', (user as any)?.permission || (user as any)?.role],
                ['Email', user?.email],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-2.5" style={{ color: 'var(--txt3)' }}>{k}</td>
                  <td className="py-2.5 text-right capitalize" style={{ color: 'var(--txt0)' }}>{String(v || '—').toLowerCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Security */}
      <section className="mb-8">
        <div className="text-sm font-semibold mb-1" style={{ color: 'var(--txt0)' }}>Security</div>
        <div className="text-xs mb-4" style={{ color: 'var(--txt3)' }}>Manage your password and security settings</div>
        <div className="rounded-xl p-5" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              const currentPassword = target.currentPassword.value;
              const newPassword = target.newPassword.value;
              
              const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword }),
                headers: { 'Content-Type': 'application/json' }
              });
              
              if (res.ok) {
                toast.success('Password updated successfully');
                target.reset();
              } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to update password');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--txt3)' }}>
                Current Password
              </label>
              <input
                name="currentPassword"
                type="password"
                required
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--txt0)' }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--txt3)' }}>
                New Password
              </label>
              <input
                name="newPassword"
                type="password"
                required
                minLength={6}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--txt0)' }}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Update Password
            </button>
          </form>
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-8">
        <div className="text-sm font-semibold mb-1" style={{ color: 'var(--txt0)' }}>Notifications</div>
        <div className="text-xs mb-4" style={{ color: 'var(--txt3)' }}>Control how you receive alerts and updates</div>
        <div className="rounded-xl" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
          {NOTIF_SETTINGS.map((s, i) => (
            <div
              key={s.label}
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: i < NOTIF_SETTINGS.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--txt0)' }}>{s.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--txt3)' }}>{s.desc}</div>
              </div>
              <Toggle checked={settings[s.id as keyof typeof settings] ?? s.defaultOn} onChange={(v) => updateSetting(s.id, v)} />
            </div>
          ))}
        </div>
      </section>

      {/* Workspace */}
      <section className="mb-8">
        <div className="text-sm font-semibold mb-1" style={{ color: 'var(--txt0)' }}>Workspace</div>
        <div className="text-xs mb-4" style={{ color: 'var(--txt3)' }}>General workspace preferences</div>
        <div className="rounded-xl" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
          {WORKSPACE_SETTINGS.map((s, i) => (
            <div
              key={s.label}
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: i < WORKSPACE_SETTINGS.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--txt0)' }}>{s.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--txt3)' }}>{s.desc}</div>
              </div>
              <Toggle checked={settings[s.id as keyof typeof settings] ?? s.defaultOn} onChange={(v) => updateSetting(s.id, v)} />
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <div className="text-sm font-semibold mb-1" style={{ color: '#ef4444' }}>Danger Zone</div>
        <div className="text-xs mb-4" style={{ color: 'var(--txt3)' }}>Irreversible actions — proceed with caution</div>
        <div className="rounded-xl p-5" style={{ background: 'var(--bg1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="text-sm mb-3" style={{ color: 'var(--txt1)' }}>Sign out from all devices and sessions</div>
          <button
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
            onClick={() => toast.error('Signed out from all sessions')}
          >
            Sign Out Everywhere
          </button>
        </div>
      </section>
    </div>
  )
}
