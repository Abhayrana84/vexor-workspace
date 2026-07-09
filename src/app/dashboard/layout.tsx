'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users2,
  Briefcase,
  DollarSign,
  HeartHandshake,
  Activity,
  Cpu,
  Sparkles,
  LogOut,
  User,
} from 'lucide-react';
import { getStoredUser, logout } from '../../lib/api';
import ThemeToggle from '../../components/ThemeToggle';
import VexorLogo from '../../components/VexorLogo';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  allowedRoles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'CRM (Leads)', href: '/dashboard/crm', icon: Users2, allowedRoles: ['FOUNDER', 'CO_FOUNDER', 'ADMIN', 'SALES_MANAGER', 'SALES_EXECUTIVE'] },
  { name: 'Projects', href: '/dashboard/projects', icon: Briefcase, allowedRoles: ['FOUNDER', 'CO_FOUNDER', 'ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'DESIGNER', 'CLIENT', 'SALES_MANAGER'] },
  { name: 'Finance & Invoices', href: '/dashboard/finance', icon: DollarSign, allowedRoles: ['FOUNDER', 'CO_FOUNDER', 'ADMIN', 'FINANCE_MANAGER', 'CLIENT', 'SALES_MANAGER'] },
  { name: 'HRMS (Staff)', href: '/dashboard/hrms', icon: HeartHandshake, allowedRoles: ['FOUNDER', 'CO_FOUNDER', 'ADMIN', 'HR', 'DEVELOPER', 'DESIGNER'] },
  { name: 'Uptime Monitor', href: '/dashboard/monitoring', icon: Activity, allowedRoles: ['FOUNDER', 'CO_FOUNDER', 'ADMIN', 'PROJECT_MANAGER'] },
  { name: 'Automations', href: '/dashboard/automation', icon: Cpu, allowedRoles: ['FOUNDER', 'CO_FOUNDER', 'ADMIN'] },
  { name: 'AI Business Agent', href: '/dashboard/ai', icon: Sparkles },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const activeUser = getStoredUser();
    if (!activeUser) {
      router.push('/login');
    } else {
      setUser(activeUser);
    }
  }, [router]);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter navigation items by RBAC
  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(user.role);
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col justify-between shrink-0">
        <div>
          {/* Header/Logo */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VexorLogo variant="full" size={28} />
              <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase ml-0.5">OS</span>
            </div>
            <ThemeToggle />
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/5'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-border bg-background/50">
          <div className="flex items-center gap-3 mb-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold leading-tight truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/10 uppercase">
                {user.role}
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-red-500 rounded-lg hover:bg-red-500/5 transition border border-transparent hover:border-red-500/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
