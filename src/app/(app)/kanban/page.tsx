'use client'
// src/app/(app)/kanban/page.tsx
import { useEffect, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Avatar, Badge, Loading } from '@/components/ui'
import { getPriorityColor, getStatusColor } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Task, TaskStatus } from '@/types'

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO', label: 'To Do', color: '#8890aa' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#f59e0b' },
  { id: 'REVIEW', label: 'Review', color: '#a855f7' },
  { id: 'COMPLETED', label: 'Completed', color: '#22c55e' },
]

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tasks')
      .then((r) => r.json())
      .then((data) => { setTasks(data); setLoading(false) })
  }, [])

  async function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId as TaskStatus
    const task = tasks.find((t) => t.id === draggableId)
    if (!task) return

    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === draggableId ? { ...t, status: newStatus } : t))

    const res = await fetch(`/api/tasks/${draggableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, position: destination.index }),
    })

    if (!res.ok) {
      // Revert on failure
      setTasks((prev) => prev.map((t) => t.id === draggableId ? { ...t, status: task.status } : t))
      toast.error('Failed to update task status')
    } else {
      toast.success(`Moved to ${COLUMNS.find(c => c.id === newStatus)?.label}`)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="p-6 overflow-x-auto min-h-full">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--txt0)' }}>Kanban Board</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--txt3)' }}>Drag tasks between columns to update status</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id)
            return (
              <div
                key={col.id}
                className="flex flex-col rounded-xl"
                style={{
                  width: 280,
                  background: 'var(--bg1)',
                  border: '1px solid var(--border)',
                  maxHeight: 'calc(100vh - 160px)',
                }}
              >
                {/* Column header */}
                <div className="px-4 py-3 flex items-center justify-between flex-shrink-0 group" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-bold uppercase tracking-wide" style={{ color: col.color }}>
                      {col.label}
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--bg3)', color: 'var(--txt3)' }}
                    >
                      {colTasks.length}
                    </span>
                  </div>
                  <a
                    href={`/tasks/new?status=${col.id}`}
                    className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10"
                    style={{ color: 'var(--txt2)' }}
                    title="Add Task"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  </a>
                </div>

                {/* Tasks */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 overflow-y-auto p-3 space-y-2.5"
                      style={{ background: snapshot.isDraggingOver ? 'rgba(109,106,254,0.04)' : 'transparent' }}
                    >
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="rounded-lg p-3 cursor-grab active:cursor-grabbing"
                              style={{
                                ...provided.draggableProps.style,
                                background: 'var(--bg2)',
                                border: `1px solid ${snapshot.isDragging ? 'var(--accent)' : 'var(--border2)'}`,
                                opacity: snapshot.isDragging ? 0.9 : 1,
                                boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
                              }}
                            >
                              <div className="text-xs font-medium mb-1.5 leading-snug" style={{ color: 'var(--txt0)' }}>
                                {task.title}
                              </div>
                              {task.project && (
                                <div className="text-xs mb-2" style={{ color: 'var(--txt3)' }}>
                                  {task.project.name}
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <Badge className={getPriorityColor(task.priority)}>{task.priority.toLowerCase()}</Badge>
                                {task.assignee && (
                                  <Avatar
                                    initials={task.assignee.initials}
                                    color={task.assignee.avatarColor}
                                    name={task.assignee.name}
                                    size={20}
                                  />
                                )}
                              </div>
                              {task.dueDate && (
                                <div className="text-xs mt-2" style={{ color: 'var(--txt3)' }}>
                                  Due {formatDate(task.dueDate)}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center py-8 text-xs" style={{ color: 'var(--txt3)' }}>
                          Drop tasks here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}
