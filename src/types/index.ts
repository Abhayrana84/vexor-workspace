// src/types/index.ts

export type Permission = 'ADMIN' | 'MANAGER' | 'MEMBER'
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface User {
  id: string
  name: string
  email: string
  role: string
  permission: Permission
  avatarColor: string
  initials: string
  createdAt: string
}

export interface Client {
  id: string
  name: string
  contactName: string
  email: string
  phone?: string
  emoji: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  managerId: string
  manager?: User
  clientId?: string
  client?: Client
  members?: User[]
  tasks?: Task[]
  _count?: { tasks: number }
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  position: number
  projectId: string
  project?: Project
  assigneeId?: string
  assignee?: User
  comments?: Comment[]
  _count?: { comments: number }
  createdAt: string
}

export interface Comment {
  id: string
  content: string
  taskId: string
  authorId: string
  author?: User
  createdAt: string
}

export interface Activity {
  id: string
  action: string
  target: string
  userId: string
  user?: User
  projectId?: string
  taskId?: string
  createdAt: string
}

export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  totalTasks: number
  activeTasks: number
  completedTasks: number
  reviewTasks: number
}

export interface KanbanColumn {
  id: TaskStatus
  label: string
  tasks: Task[]
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Form input types
export interface CreateProjectInput {
  name: string
  description?: string
  status: ProjectStatus
  managerId: string
  clientId?: string
  memberIds: string[]
}

export interface CreateTaskInput {
  title: string
  description?: string
  projectId: string
  assigneeId?: string
  priority: TaskPriority
  status: TaskStatus
  dueDate?: string
}

export interface UpdateTaskStatusInput {
  status: TaskStatus
  position?: number
}
