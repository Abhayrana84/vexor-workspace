// src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

import { withAuth } from '@/lib/api-handler'

export const GET = withAuth(async (req, session) => {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) return NextResponse.json({ projects: [], tasks: [] })

  // Firestore prefix search
  const end = q.replace(/.$/, c => String.fromCharCode(c.charCodeAt(0) + 1));

  const [projectsSnapshot, tasksSnapshot] = await Promise.all([
    adminDb.collection('projects')
      .where('name', '>=', q)
      .where('name', '<', end)
      .limit(5)
      .get(),
    adminDb.collection('tasks')
      .where('title', '>=', q)
      .where('title', '<', end)
      .limit(5)
      .get(),
  ])

  let projects = projectsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))
  let tasks = tasksSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }))

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
  const userId = session.user.id

  if (!isAdmin) {
    projects = projects.filter((p: any) => 
      p.managerId === userId || (p.memberIds && p.memberIds.includes(userId))
    )
    tasks = tasks.filter((t: any) => 
      t.assigneeId === userId || (t.projectMemberIds && t.projectMemberIds.includes(userId))
    )
  }

  return NextResponse.json({ projects, tasks })
}, { rateLimit: { limit: 30, windowMs: 60 * 1000 } });
