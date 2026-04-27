// src/lib/permissions.ts

export type Permission = 
  | 'can_manage_users'
  | 'can_manage_projects'
  | 'can_assign_tasks'
  | 'can_view_clients'
  | 'can_manage_clients'
  | 'can_view_finance'
  | 'can_manage_finance'
  | 'can_view_audit_logs'
  | 'can_manage_system';

export type Permissions = Record<Permission, boolean>;

export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'MANAGER' 
  | 'TEAM_LEAD' 
  | 'MEMBER' 
  | 'CLIENT_OPERATIONS';

export const ROLE_PERMISSIONS: Record<UserRole, Permissions> = {
  SUPER_ADMIN: {
    can_manage_users: true,
    can_manage_projects: true,
    can_assign_tasks: true,
    can_view_clients: true,
    can_manage_clients: true,
    can_view_finance: true,
    can_manage_finance: true,
    can_view_audit_logs: true,
    can_manage_system: true,
  },
  ADMIN: {
    can_manage_users: true,
    can_manage_projects: true,
    can_assign_tasks: true,
    can_view_clients: true,
    can_manage_clients: true,
    can_view_finance: false,
    can_manage_finance: false,
    can_view_audit_logs: true,
    can_manage_system: false,
  },
  MANAGER: {
    can_manage_users: false,
    can_manage_projects: true,
    can_assign_tasks: true,
    can_view_clients: true,
    can_manage_clients: false,
    can_view_finance: false,
    can_manage_finance: false,
    can_view_audit_logs: false,
    can_manage_system: false,
  },
  TEAM_LEAD: {
    can_manage_users: false,
    can_manage_projects: false,
    can_assign_tasks: true,
    can_view_clients: true,
    can_manage_clients: false,
    can_view_finance: false,
    can_manage_finance: false,
    can_view_audit_logs: false,
    can_manage_system: false,
  },
  MEMBER: {
    can_manage_users: false,
    can_manage_projects: false,
    can_assign_tasks: false,
    can_view_clients: false,
    can_manage_clients: false,
    can_view_finance: false,
    can_manage_finance: false,
    can_view_audit_logs: false,
    can_manage_system: false,
  },
  CLIENT_OPERATIONS: {
    can_manage_users: false,
    can_manage_projects: false,
    can_assign_tasks: false,
    can_view_clients: true,
    can_manage_clients: true,
    can_view_finance: false,
    can_manage_finance: false,
    can_view_audit_logs: false,
    can_manage_system: false,
  },
};
