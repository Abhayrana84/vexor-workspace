'use client'
// src/components/layout/Sidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, FolderKanban, Kanban, CheckSquare, Users, Building2, Settings, LogOut, Activity, ShieldCheck, Wallet } from 'lucide-react'
import { canManageUsers, canViewFinance, getPermissionColor } from '@/lib/utils'
import { Permissions } from '@/lib/permissions'

interface NavItem { href: string; icon: any; label: string; permission?: keyof Permissions }

const NAV: { label: string; items: NavItem[] }[] = [
  { label: 'Workspace', items: [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/projects', icon: FolderKanban, label: 'Projects' },
    { href: '/kanban', icon: Kanban, label: 'Kanban Board' },
    { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { href: '/activity', icon: Activity, label: 'Activity Log' },
  ]},
  { label: 'Management', items: [
    { href: '/finances', icon: Wallet, label: 'Finances', permission: 'can_view_finance' },
    { href: '/team', icon: Users, label: 'Team', permission: 'can_manage_users' },
    { href: '/clients', icon: Building2, label: 'Clients' },
  ]},
  { label: 'System', items: [
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]},
]

interface SidebarProps {
  user: { 
    name?: string | null; 
    email?: string | null; 
    role: string; 
    initials: string; 
    avatarColor: string; 
    permissions: Permissions 
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <div className="mobile-overlay md:hidden" onClick={() => document.body.classList.remove('mobile-menu-open')} />
      <aside className="sidebar-nav flex flex-col flex-shrink-0 w-64 md:w-56" style={{ background: 'var(--bg1)', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className="px-4 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="text-sm font-bold tracking-tight" style={{ color: 'var(--txt0)', letterSpacing: '-0.5px' }}>
          <span style={{ color: 'var(--accent)' }}>VEX</span>OR Workspace
        </div>
        <div style={{ color: 'var(--txt3)', fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '2px' }}>
          Internal OS · Vexor IT Solutions
        </div>
      </div>

      {/* Current user */}
      <div className="px-4 py-3 flex items-center gap-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: `${user.avatarColor}25`, color: user.avatarColor }}
        >
          {user.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold truncate" style={{ color: 'var(--txt0)' }}>
            {user.name?.split(' ').slice(0, 2).join(' ')}
          </div>
          <div className="truncate" style={{ color: 'var(--txt3)', fontSize: '9px' }}>{user.role.replace('_', ' ')}</div>
        </div>
        <div className={`text-xs px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${getPermissionColor(user.role)}`} style={{ fontSize: '8px' }}>
          {user.role === 'SUPER_ADMIN' ? 'S.ADMIN' : user.role === 'CLIENT_OPERATIONS' ? 'CCO' : user.role}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map((section) => {
          const visibleItems = section.items.filter(item => {
            if (!item.permission) return true
            return user.permissions?.[item.permission] === true
          })
          
          if (visibleItems.length === 0) return null

          return (
            <div key={section.label} className="mb-1">
              <div className="px-4 pt-3 pb-1 font-semibold uppercase"
                style={{ color: 'var(--txt3)', fontSize: '9px', letterSpacing: '1.5px' }}>
                {section.label}
              </div>
              {visibleItems.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                return (
                  <Link key={href} href={href}
                    onClick={() => document.body.classList.remove('mobile-menu-open')}
                    className="flex items-center gap-2.5 mx-2 px-3 py-2 rounded-lg text-xs font-medium"
                    style={active
                      ? { background: 'rgba(109,106,254,0.12)', color: 'var(--accent2)', borderLeft: '2px solid var(--accent)', paddingLeft: '10px' }
                      : { color: 'var(--txt2)' }}>
                    <Icon size={13} style={{ flexShrink: 0 }} />
                    {label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#ef4444' }}>
          <LogOut size={12} />
          Sign Out
        </button>
      </div>
      </aside>
    </>
  )
}
