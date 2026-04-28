'use client'
// src/app/(app)/tasks/TasksClient.tsx
import { useState } from 'react'
import Link from 'next/link'
import { Avatar, Badge, EmptyState } from '@/components/ui'
import { getPriorityColor, getStatusColor, getStatusLabel, formatDate } from '@/lib/utils'
import { AlertTriangle, Minus, ArrowDown, CheckSquare, ListTodo } from 'lucide-react'

interface Task {
  id: string
  title: string
  priority: string
  status: string
  dueDate: string | null
  project: { id: string; name: string }
  assignee: { name: string; initials: string; avatarColor: string } | null
  _count: { comments: number }
}

interface Props {
  tasks: Task[]
  myTasks: Task[]
  isAdmin: boolean
  currentUserId: string
}

const PRIORITY_CONFIG = {
  HIGH: {
    label: 'High Priority',
    icon: AlertTriangle,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    dot: '#ef4444',
  },
  MEDIUM: {
    label: 'Medium Priority',
    icon: Minus,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    dot: '#f59e0b',
  },
  LOW: {
    label: 'Low Priority',
    icon: ArrowDown,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.25)',
    dot: '#22c55e',
  },
}

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function PriorityLane({ priority, tasks, isAdmin }: { priority: string; tasks: Task[]; isAdmin: boolean }) {
  const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG]
  if (!config || tasks.length === 0) return null
  const Icon = config.icon

  return (
    <div
      className="rounded-xl overflow-hidden mb-4"
      style={{ border: `1px solid ${config.border}`, background: config.bg }}
    >
      {/* Lane header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: `1px solid ${config.border}` }}
      >
        <Icon size={14} style={{ color: config.color }} />
        <span className="text-sm font-semibold" style={{ color: config.color }}>
          {config.label}
        </span>
        <span
          className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${config.color}22`, color: config.color }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Task rows */}
      <div>
        {tasks.map((task, i) => (
          <div
            key={task.id}
            className="group flex items-center gap-4 px-4 py-3 transition-colors"
            style={{
              borderBottom: i < tasks.length - 1 ? `1px solid ${config.border}` : 'none',
              background: 'transparent',
            }}
          >
            {/* Priority dot */}
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: config.dot }}
            />

            {/* Title + project */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/tasks/${task.id}`}
                className="text-sm font-medium hover:underline block truncate"
                style={{ color: 'var(--txt0)' }}
              >
                {task.title}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <Link
                  href={`/projects/${task.project.id}`}
                  className="text-xs hover:underline truncate"
                  style={{ color: 'var(--accent2)' }}
                >
                  {task.project.name}
                </Link>
                {isOverdue(task.dueDate) && task.status !== 'COMPLETED' && (
                  <span className="text-xs font-medium" style={{ color: '#ef4444' }}>
                    ⚠ Overdue
                  </span>
                )}
              </div>
            </div>

            {/* Status */}
            <Badge className={getStatusColor(task.status)}>{getStatusLabel(task.status)}</Badge>

            {/* Due date */}
            <span
              className="text-xs flex-shrink-0 hidden sm:block"
              style={{ color: isOverdue(task.dueDate) && task.status !== 'COMPLETED' ? '#ef4444' : 'var(--txt3)' }}
            >
              {task.dueDate ? formatDate(new Date(task.dueDate)) : '—'}
            </span>

            {/* Edit */}
            {isAdmin && (
              <Link
                href={`/tasks/${task.id}/edit`}
                className="text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                style={{ color: 'var(--txt3)' }}
              >
                Edit
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function AllTasksTable({ tasks, isAdmin }: { tasks: Task[]; isAdmin: boolean }) {
  if (tasks.length === 0) {
    return <EmptyState icon="✅" title="No tasks found" sub="All caught up!" />
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Task', 'Project', 'Assignee', 'Priority', 'Status', 'Due Date', ''].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs uppercase tracking-wider font-semibold"
                style={{ color: 'var(--txt3)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="group" style={{ borderBottom: '1px solid var(--border)' }}>
              <td className="px-4 py-3">
                <Link
                  href={`/tasks/${task.id}`}
                  className="text-sm font-medium hover:underline block"
                  style={{ color: 'var(--txt0)' }}
                >
                  {task.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/projects/${task.project.id}`}
                  className="text-xs hover:underline"
                  style={{ color: 'var(--accent2)' }}
                >
                  {task.project.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar initials={task.assignee.initials} color={task.assignee.avatarColor} size={22} />
                    <span className="text-xs" style={{ color: 'var(--txt1)' }}>
                      {task.assignee.name.split(' ')[0]}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--txt3)' }}>Unassigned</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge className={getStatusColor(task.status)}>{getStatusLabel(task.status)}</Badge>
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--txt3)' }}>
                {task.dueDate ? formatDate(new Date(task.dueDate)) : '—'}
              </td>
              <td className="px-4 py-3">
                {isAdmin && (
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--txt3)' }}
                  >
                    Edit
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TasksClient({ tasks, myTasks, isAdmin, currentUserId }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all')

  const highTasks   = myTasks.filter(t => t.priority === 'HIGH')
  const mediumTasks = myTasks.filter(t => t.priority === 'MEDIUM')
  const lowTasks    = myTasks.filter(t => t.priority === 'LOW')

  const tabs = [
    { id: 'all',  label: 'All Tasks',   icon: ListTodo,    count: tasks.length },
    { id: 'mine', label: 'My Tasks',    icon: CheckSquare, count: myTasks.length },
  ] as const

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--txt0)' }}>
            Tasks
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--txt3)' }}>
            {activeTab === 'all'
              ? `${tasks.length} total tasks`
              : `${myTasks.length} tasks assigned to you`}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/tasks/new"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            + New Task
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl mb-5 w-fit"
        style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}
      >
        {tabs.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={
                active
                  ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px rgba(109,106,254,0.35)' }
                  : { color: 'var(--txt2)' }
              }
            >
              <Icon size={13} />
              {tab.label}
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={
                  active
                    ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                    : { background: 'var(--bg2)', color: 'var(--txt3)' }
                }
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'all' ? (
        <AllTasksTable tasks={tasks} isAdmin={isAdmin} />
      ) : (
        <div>
          {myTasks.length === 0 ? (
            <EmptyState icon="🎯" title="No tasks assigned to you" sub="You're all clear!" />
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {([
                  { key: 'HIGH',   count: highTasks.length,   label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
                  { key: 'MEDIUM', count: mediumTasks.length, label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
                  { key: 'LOW',    count: lowTasks.length,    label: 'Low',    color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)' },
                ] as const).map(p => (
                  <div
                    key={p.key}
                    className="rounded-xl px-4 py-3 flex items-center gap-3"
                    style={{ background: p.bg, border: `1px solid ${p.border}` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <div>
                      <div className="text-xl font-bold" style={{ color: p.color }}>{p.count}</div>
                      <div className="text-xs" style={{ color: 'var(--txt3)' }}>{p.label} Priority</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Priority lanes */}
              <PriorityLane priority="HIGH"   tasks={highTasks}   isAdmin={isAdmin} />
              <PriorityLane priority="MEDIUM" tasks={mediumTasks} isAdmin={isAdmin} />
              <PriorityLane priority="LOW"    tasks={lowTasks}    isAdmin={isAdmin} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
