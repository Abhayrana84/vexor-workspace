'use client'
// src/components/layout/Topbar.tsx
import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Bell, X, Menu } from 'lucide-react'
import { getStatusColor, getStatusLabel, getPriorityColor, timeAgo } from '@/lib/utils'
import { Avatar } from '@/components/ui'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard', '/projects': 'Projects', '/kanban': 'Kanban Board',
  '/tasks': 'Tasks', '/team': 'Team', '/team/permissions': 'Permissions',
  '/clients': 'Clients', '/settings': 'Settings', '/activity': 'Activity Log',
}

export function Topbar({ user }: { user: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifsLoaded, setNotifsLoaded] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const title = PAGE_TITLES[pathname] ||
    (pathname.startsWith('/projects/') ? 'Project Detail' :
     pathname.startsWith('/tasks/') ? 'Task Detail' :
     pathname.startsWith('/clients/') ? 'Client Detail' : 'Vexor Workspace')

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', handler)
    
    // Fetch initial notifications
    fetch('/api/notifications').then(res => res.json()).then(data => {
      if (data.notifications) {
        setNotifs(data.notifications)
        setUnreadCount(data.unreadCount || 0)
        setNotifsLoaded(true)
      }
    }).catch(console.error)

    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults(null); setShowResults(false); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data); setShowResults(true)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  async function handleBell() {
    setShowNotifs(v => !v)
    if (!notifsLoaded) {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifs(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
      setNotifsLoaded(true)
    }
    if (unreadCount > 0) {
      setUnreadCount(0)
      fetch('/api/notifications', { method: 'POST' }).catch(console.error)
    }
  }

  return (
    <header className="flex items-center px-4 md:px-6 gap-3 md:gap-4 flex-shrink-0"
      style={{ height: '52px', borderBottom: '1px solid var(--border)', background: 'var(--bg0)' }}>
      <button 
        className="md:hidden flex items-center justify-center p-1.5 -ml-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10"
        onClick={() => document.body.classList.toggle('mobile-menu-open')}
      >
        <Menu size={16} style={{ color: 'var(--txt1)' }} />
      </button>
      <h1 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--txt0)' }}>{title}</h1>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        {/* Search */}
        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', minWidth: '220px' }}>
            <Search size={12} style={{ color: 'var(--txt3)', flexShrink: 0 }} />
            <input value={query} onChange={e => setQuery(e.target.value)}
              onFocus={() => results && setShowResults(true)}
              placeholder="Search projects, tasks…"
              className="bg-transparent outline-none w-full text-xs"
              style={{ color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }} />
            {query && <button onClick={() => { setQuery(''); setShowResults(false) }}><X size={11} style={{ color: 'var(--txt3)' }} /></button>}
          </div>
          {showResults && results && (
            <div className="absolute top-full right-0 mt-1 w-80 rounded-xl overflow-hidden z-50"
              style={{ background: 'var(--bg1)', border: '1px solid var(--border2)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              {results.projects?.length > 0 && <>
                <div className="px-3 py-2 text-xs uppercase font-semibold" style={{ color: 'var(--txt3)', borderBottom: '1px solid var(--border)', fontSize: '9px', letterSpacing: '1px' }}>Projects</div>
                {results.projects.map((p: any) => (
                  <div key={p.id} className="px-3 py-2.5 cursor-pointer text-xs" style={{ borderBottom: '1px solid var(--border)' }}
                    onClick={() => { router.push(`/projects/${p.id}`); setShowResults(false); setQuery('') }}>
                    <div className="font-medium mb-1" style={{ color: 'var(--txt0)' }}>{p.name}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</span>
                  </div>
                ))}
              </>}
              {results.tasks?.length > 0 && <>
                <div className="px-3 py-2 text-xs uppercase font-semibold" style={{ color: 'var(--txt3)', borderBottom: '1px solid var(--border)', fontSize: '9px', letterSpacing: '1px' }}>Tasks</div>
                {results.tasks.map((t: any) => (
                  <div key={t.id} className="px-3 py-2.5 cursor-pointer text-xs" style={{ borderBottom: '1px solid var(--border)' }}
                    onClick={() => { router.push(`/tasks/${t.id}`); setShowResults(false); setQuery('') }}>
                    <div className="font-medium mb-1" style={{ color: 'var(--txt0)' }}>{t.title}</div>
                    <div className="flex gap-1.5 items-center">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getPriorityColor(t.priority)}`}>{t.priority}</span>
                      <span style={{ color: 'var(--txt3)' }}>{t.project?.name}</span>
                    </div>
                  </div>
                ))}
              </>}
              {!results.projects?.length && !results.tasks?.length && (
                <div className="px-3 py-5 text-xs text-center" style={{ color: 'var(--txt3)' }}>No results found</div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button onClick={handleBell} className="w-8 h-8 rounded-lg flex items-center justify-center relative"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }}>
            <Bell size={14} style={{ color: 'var(--txt2)' }} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white flex items-center justify-center font-bold"
                style={{ background: 'var(--accent)', fontSize: '9px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute top-full right-0 mt-1 w-80 rounded-xl overflow-hidden z-50"
              style={{ background: 'var(--bg1)', border: '1px solid var(--border2)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxHeight: '360px', overflowY: 'auto' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold" style={{ color: 'var(--txt0)' }}>Notifications</div>
                <button onClick={() => setShowNotifs(false)}><X size={12} style={{ color: 'var(--txt3)' }} /></button>
              </div>
              {notifs.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs" style={{ color: 'var(--txt3)' }}>All caught up 🎉</div>
              ) : notifs.map((n: any, i: number) => (
                <div key={n.id} className="flex gap-3 px-4 py-3"
                  style={{ borderBottom: i < notifs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <Avatar initials={n.user?.initials} color={n.user?.avatarColor} image={n.user?.avatarUrl} size={26} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs leading-relaxed" style={{ color: 'var(--txt1)' }}>
                      <strong style={{ color: 'var(--txt0)' }}>{n.user?.name?.split(' ')[0]}</strong>{' '}{n.action}{' '}
                      <span style={{ color: 'var(--accent2)' }}>{n.target}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--txt3)' }}>{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
