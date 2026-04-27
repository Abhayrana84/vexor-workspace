// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

import { withAuth } from '@/lib/api-handler'

export const GET = withAuth(async (req, session) => {
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
  const isManager = session.user.role === 'MANAGER'
  const userId = session.user.id

  // Base queries with role-based filtering
  let projectsQuery: any = adminDb.collection('projects')
  let tasksQuery: any = adminDb.collection('tasks')
  let activitiesQuery: any = adminDb.collection('activities')

  if (!isAdmin) {
    if (isManager) {
      projectsQuery = projectsQuery.where('managerId', '==', userId)
      // For tasks/activities, we first need the project IDs the manager has access to
      // However, for simpler filtering we can filter tasks by those they are involved in
    } else {
      projectsQuery = projectsQuery.where('memberIds', 'array-contains', userId)
    }
  }

  let totalProjects = 0, activeProjects = 0
  let totalTasks = 0, activeTasks = 0, completedTasks = 0, reviewTasks = 0
  let recentActivity: any[] = []
  let projectProgress: any[] = []

  // Projects logic is the same for both, as it doesn't use 'in' queries
  const [totalProjectsSnap, activeProjectsSnap, projectProgressSnap] = await Promise.all([
    projectsQuery.count().get(),
    projectsQuery.where('status', '==', 'IN_PROGRESS').count().get(),
    projectsQuery.orderBy('updatedAt', 'desc').limit(5).get(),
  ])

  totalProjects = totalProjectsSnap.data().count
  activeProjects = activeProjectsSnap.data().count

  if (isAdmin) {
    // Admins don't need 'in' queries, fetch globally
    const [totT, actT, compT, revT, actSnap] = await Promise.all([
      adminDb.collection('tasks').count().get(),
      adminDb.collection('tasks').where('status', '==', 'IN_PROGRESS').count().get(),
      adminDb.collection('tasks').where('status', '==', 'COMPLETED').count().get(),
      adminDb.collection('tasks').where('status', '==', 'REVIEW').count().get(),
      adminDb.collection('activities').orderBy('createdAt', 'desc').limit(8).get(),
    ])
    totalTasks = totT.data().count
    activeTasks = actT.data().count
    completedTasks = compT.data().count
    reviewTasks = revT.data().count
    recentActivity = actSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
  } else {
    // SINGLE-QUERY FEED ARCHITECTURE: Native O(1) fetching using array-contains
    const [totT, actT, compT, revT, actSnap, pSnap] = await Promise.all([
      adminDb.collection('tasks').where('projectMemberIds', 'array-contains', userId).count().get(),
      adminDb.collection('tasks').where('projectMemberIds', 'array-contains', userId).where('status', '==', 'IN_PROGRESS').count().get(),
      adminDb.collection('tasks').where('projectMemberIds', 'array-contains', userId).where('status', '==', 'COMPLETED').count().get(),
      adminDb.collection('tasks').where('projectMemberIds', 'array-contains', userId).where('status', '==', 'REVIEW').count().get(),
      adminDb.collection('activities').where('visibleTo', 'array-contains', userId).orderBy('createdAt', 'desc').limit(8).get(),
      adminDb.collection('projects').where('memberIds', 'array-contains', userId).select('__name__').get(), // To filter stale activities
    ])
    
    totalTasks = totT.data().count
    activeTasks = actT.data().count
    completedTasks = compT.data().count
    reviewTasks = revT.data().count

    const activeProjectIds = new Set(pSnap.docs.map(d => d.id))
    const fetchedActivities = actSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    
    // Post-fetch server-side filtering to drop stale activities if visibleTo is out of sync
    recentActivity = fetchedActivities.filter((act: any) => 
      !act.projectId || activeProjectIds.has(act.projectId)
    )
  }

  // Hydrate activities (BATCH FETCH)
  const userIds = Array.from(new Set(recentActivity.map((a: any) => a.userId).filter(Boolean)))
  const userDocs = userIds.length > 0 
    ? await adminDb.getAll(...userIds.map(id => adminDb.collection('users').doc(id)))
    : []
  const userMap = Object.fromEntries(userDocs.map(d => [d.id, d.data()]))

  recentActivity = recentActivity.map(a => ({
    ...a,
    user: { 
      name: userMap[a.userId]?.name, 
      initials: userMap[a.userId]?.initials, 
      avatarColor: userMap[a.userId]?.avatarColor 
    }
  }))

  // Calculate project progress (BATCH FETCH)
  const projectDocs = projectProgressSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[]
  const pIdsForProgress = projectDocs.map(p => p.id)
  
  // Tasks for progress calculation (also needs chunking if > 10, but limit is 5 so we are safe)
  const tasksSnapshot = pIdsForProgress.length > 0 
    ? await adminDb.collection('tasks').where('projectId', 'in', pIdsForProgress).get()
    : { docs: [] }
    
  const tasksByProject = tasksSnapshot.docs.reduce((acc: any, d: any) => {
    const t = d.data()
    if (!acc[t.projectId]) acc[t.projectId] = []
    acc[t.projectId].push(t)
    return acc
  }, {})

  projectProgress = projectDocs.map(p => {
    const tasks = tasksByProject[p.id] || []
    const total = tasks.length
    const completed = tasks.filter((t: any) => t.status === 'COMPLETED').length
    
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      total,
      completed,
      progress: total ? Math.round((completed / total) * 100) : 0,
    }
  })

  return NextResponse.json({
    stats: { 
      totalProjects, 
      activeProjects, 
      totalTasks, 
      activeTasks, 
      completedTasks, 
      reviewTasks 
    },
    recentActivity,
    projectProgress,
  })
}, { rateLimit: { limit: 20, windowMs: 60 * 1000 } });
