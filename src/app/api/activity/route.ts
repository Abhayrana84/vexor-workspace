// src/app/api/activity/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

import { withAuth } from '@/lib/api-handler'

export const GET = withAuth(async (req, session) => {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  const limit = parseInt(searchParams.get('limit') || '50')

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
  const userId = session.user.id

  let rawActivities: any[] = []

  if (projectId) {
    // If a specific project is requested, check access
    if (!isAdmin) {
      const pDoc = await adminDb.collection('projects').doc(projectId).get()
      if (!pDoc.exists || (!pDoc.data()?.memberIds?.includes(userId) && pDoc.data()?.managerId !== userId)) {
        return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 })
      }
    }
    const query = adminDb.collection('activities')
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .limit(Math.min(limit, 100))
    const snapshot = await query.get()
    rawActivities = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
  } else if (!isAdmin) {
    // SINGLE-QUERY FEED ARCHITECTURE: Fetch directly via denormalized visibleTo array
    const query = adminDb.collection('activities')
      .where('visibleTo', 'array-contains', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
    
    const snapshot = await query.get()
    
    // Post-fetch server-side filtering to drop stale activities if visibleTo is out of sync
    const pSnap = await adminDb.collection('projects').where('memberIds', 'array-contains', userId).get()
    const activeProjectIds = new Set(pSnap.docs.map(d => d.id))
    
    const fetchedActivities = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
    
    // Filter to strictly ensure the user still has access to the project
    rawActivities = fetchedActivities.filter(act => 
      !act.projectId || activeProjectIds.has(act.projectId)
    )
  } else {
    // Admin full access
    const query = adminDb.collection('activities')
      .orderBy('createdAt', 'desc')
      .limit(Math.min(limit, 100))
    const snapshot = await query.get()
    rawActivities = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
  }

  // Batch join
  const populated = await Promise.all(rawActivities.map(async (a: any) => {
    const [userDoc, projectDoc, taskDoc] = await Promise.all([
      adminDb.collection('users').doc(a.userId).get(),
      a.projectId ? adminDb.collection('projects').doc(a.projectId).get() : Promise.resolve(null),
      a.taskId ? adminDb.collection('tasks').doc(a.taskId).get() : Promise.resolve(null),
    ])

    return {
      ...a,
      user: userDoc.data(),
      project: projectDoc?.data(),
      task: taskDoc?.data(),
    }
  }))

  return NextResponse.json(populated)
}, { rateLimit: { limit: 30, windowMs: 60 * 1000 } });
