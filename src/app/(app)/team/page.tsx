// src/app/(app)/team/page.tsx
import { adminDb } from '@/lib/firebase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TeamClient } from './TeamClient'

export default async function TeamPage() {
  const session = await getServerSession(authOptions)
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')

  const teamSnapshot = await adminDb.collection('users').orderBy('createdAt', 'asc').get()
  const team = teamSnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      role: data.role,
      permission: data.permission,
      avatarColor: data.avatarColor,
      initials: data.initials,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      _count: { 
        assignedTasks: data.assignedTasksCount || 0, 
        managedProjects: data.managedProjectsCount || 0 
      }
    }
  })

  return <TeamClient initialTeam={team} isAdmin={isAdmin} />
}
