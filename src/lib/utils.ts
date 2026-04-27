// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy')
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PLANNING: 'Planning',
    IN_PROGRESS: 'In Progress',
    REVIEW: 'Review',
    COMPLETED: 'Completed',
    TODO: 'To Do',
  }
  return map[status] ?? status
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PLANNING: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    REVIEW: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    COMPLETED: 'bg-green-500/10 text-green-400 border border-green-500/20',
    TODO: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
  }
  return map[status] ?? 'bg-zinc-500/10 text-zinc-400'
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    HIGH: 'bg-red-500/10 text-red-400 border border-red-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    LOW: 'bg-green-500/10 text-green-400 border border-green-500/20',
  }
  return map[priority] ?? 'bg-zinc-500/10 text-zinc-400'
}

import { ROLE_PERMISSIONS, Permissions, Permission } from './permissions'

export function getPermissionColor(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-500/10 text-red-400 border border-red-500/20',
    ADMIN: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    MANAGER: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    TEAM_LEAD: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    MEMBER: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    CLIENT_OPERATIONS: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  }
  return map[role] ?? 'bg-zinc-500/10 text-zinc-400'
}

export function hasPermission(userPermissions: Permissions | undefined, permission: Permission): boolean {
  if (!userPermissions) return false
  return userPermissions[permission] === true
}

// Convenience helpers
export function canManageUsers(p?: Permissions) { return hasPermission(p, 'can_manage_users') }
export function canViewFinance(p?: Permissions) { return hasPermission(p, 'can_view_finance') }
export function canManageProjects(p?: Permissions) { return hasPermission(p, 'can_manage_projects') }
export function canAssignTasks(p?: Permissions) { return hasPermission(p, 'can_assign_tasks') }
export function canViewAuditLogs(p?: Permissions) { return hasPermission(p, 'can_view_audit_logs') }

export function getProjectProgress(tasks: Array<{ status: string }>): number {
  if (!tasks.length) return 0
  const done = tasks.filter((t) => t.status === 'COMPLETED').length
  return Math.round((done / tasks.length) * 100)
}
