// src/hooks/useProjects.ts
import { useState, useEffect } from 'react'
import type { Project } from '@/types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetch_() {
    try {
      const res = await fetch('/api/projects')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setProjects(data)
    } catch (e) {
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch_() }, [])

  return { projects, loading, error, refetch: fetch_ }
}

// src/hooks/useTasks.ts
export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function fetch_() {
    const url = projectId ? `/api/tasks?projectId=${projectId}` : '/api/tasks'
    const res = await fetch(url)
    const data = await res.json()
    setTasks(data)
    setLoading(false)
  }

  useEffect(() => { fetch_() }, [projectId])

  async function updateTaskStatus(id: string, status: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  return { tasks, loading, refetch: fetch_, updateTaskStatus }
}

// src/hooks/useTeam.ts
export function useTeam() {
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/team')
      .then(r => r.json())
      .then(data => { setTeam(data); setLoading(false) })
  }, [])

  return { team, loading }
}
