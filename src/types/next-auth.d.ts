// src/types/next-auth.d.ts
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      avatarUrl?: string
      role: string
      permissions: {
        can_manage_users: boolean;
        can_manage_projects: boolean;
        can_assign_tasks: boolean;
        can_view_clients: boolean;
        can_manage_clients: boolean;
        can_view_finance: boolean;
        can_manage_finance: boolean;
        can_view_audit_logs: boolean;
        can_manage_system: boolean;
      }
      avatarColor: string
      initials: string
      sessionVersion: number
    }
  }

  interface User {
    id: string
    role: string
    permissions: any
    avatarUrl?: string
    avatarColor: string
    initials: string
    sessionVersion: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    permissions: any
    avatarUrl?: string
    avatarColor: string
    initials: string
    sessionVersion: number
  }
}
