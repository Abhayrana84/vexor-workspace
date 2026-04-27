// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { canManageProjects } from '@/lib/utils'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectDoc = await adminDb.collection('projects').doc(params.id).get()
  if (!projectDoc.exists) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  
  const projectData = projectDoc.data() as any

  // Join data (BATCHED)
  const [managerDoc, clientDoc, tasksSnapshot, membersSnapshot] = await Promise.all([
    adminDb.collection('users').doc(projectData.managerId).get(),
    projectData.clientId ? adminDb.collection('clients').doc(projectData.clientId).get() : Promise.resolve(null),
    adminDb.collection('tasks').where('projectId', '==', params.id).orderBy('position', 'asc').get(),
    adminDb.collection('project_members').where('projectId', '==', params.id).get(),
  ])

  // Hydrate member details (BATCHED)
  const memberUserIds = membersSnapshot.docs.map(d => d.data().userId)
  const memberUserDocs = memberUserIds.length > 0 
    ? await adminDb.getAll(...memberUserIds.map(id => adminDb.collection('users').doc(id)))
    : []
  
  const memberMap = Object.fromEntries(memberUserDocs.map(d => [d.id, {
    id: d.id,
    name: d.data()?.name,
    initials: d.data()?.initials,
    avatarColor: d.data()?.avatarColor,
    role: d.data()?.role
  }]))

  const project = {
    id: projectDoc.id,
    ...projectData,
    manager: {
      id: managerDoc.id,
      name: managerDoc.data()?.name,
      initials: managerDoc.data()?.initials,
      avatarColor: managerDoc.data()?.avatarColor
    },
    client: clientDoc?.data() || null,
    tasks: tasksSnapshot.docs.map(d => ({ id: d.id, ...d.data() })),
    members: membersSnapshot.docs.map(d => ({ 
      id: d.id, 
      ...d.data(), 
      user: memberMap[d.data().userId] || { name: 'Unknown User' } 
    })),
  }

  return NextResponse.json(project)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!canManageProjects(session.user.permissions)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const { name, description, status, managerId, clientId, memberIds } = body

  const updateData: any = { updatedAt: new Date() }
  if (name) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (status) updateData.status = status
  if (managerId) updateData.managerId = managerId
  if (clientId !== undefined) updateData.clientId = clientId || null
  
  // ATOMIC SYNC: Update memberIds array for security rules
  if (memberIds && Array.isArray(memberIds)) {
    updateData.memberIds = Array.from(new Set([managerId || session.user.id, ...memberIds]))
  }

  await adminDb.collection('projects').doc(params.id).update(updateData)

  // Sync project_members metadata table AND cascading security updates (FIX P0-B)
  if (memberIds && Array.isArray(memberIds)) {
    const [existingMembers, tasks, recentActivities] = await Promise.all([
      adminDb.collection('project_members').where('projectId', '==', params.id).get(),
      adminDb.collection('tasks').where('projectId', '==', params.id).get(),
      adminDb.collection('activities')
        .where('projectId', '==', params.id)
        .orderBy('createdAt', 'desc')
        .limit(100) // Keep recent feed items perfectly synced
        .get()
    ])
    
    // CHUNKING LOGIC: Firestore hard limit is 500 ops/batch.
    // We collect all operations as callbacks or data, then batch them safely.
    const ops: Array<(b: FirebaseFirestore.WriteBatch) => void> = []

    // 1. Refresh metadata table
    existingMembers.docs.forEach(doc => {
      ops.push((b) => b.delete(doc.ref))
    })
    updateData.memberIds.forEach((uid: string) => {
      const ref = adminDb.collection('project_members').doc()
      ops.push((b) => b.set(ref, { projectId: params.id, userId: uid, joinedAt: new Date() }))
    })

    // 2. Cascading Sync: Update all tasks
    tasks.docs.forEach(taskDoc => {
      ops.push((b) => b.update(taskDoc.ref, { projectMemberIds: updateData.memberIds }))
    })

    // 3. Cascading Sync: Update visibleTo on recent activities (Single-Query feed optimization)
    recentActivities.docs.forEach(actDoc => {
      ops.push((b) => b.update(actDoc.ref, { visibleTo: updateData.memberIds }))
    })

    // 4. Execute chunks sequentially (Max 450 to be safe)
    const CHUNK_SIZE = 450
    for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
      const chunk = ops.slice(i, i + CHUNK_SIZE)
      const batch = adminDb.batch()
      chunk.forEach(op => op(batch))
      await batch.commit()
    }
  }

  await adminDb.collection('activities').add({
    userId: session.user.id,
    action: 'updated project',
    target: name || 'Project',
    projectId: params.id,
    visibleTo: updateData.memberIds || [], // NEW: Single-query feed optimization
    createdAt: new Date(),
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!session.user.permissions?.can_manage_projects) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // CASCADING DELETE (Prevent Orphans)
  const batch = adminDb.batch()
  const [tasks, members, activities] = await Promise.all([
    adminDb.collection('tasks').where('projectId', '==', params.id).get(),
    adminDb.collection('project_members').where('projectId', '==', params.id).get(),
    adminDb.collection('activities').where('projectId', '==', params.id).get(),
  ])

  tasks.docs.forEach(d => batch.delete(d.ref))
  members.docs.forEach(d => batch.delete(d.ref))
  activities.docs.forEach(d => batch.delete(d.ref))
  batch.delete(adminDb.collection('projects').doc(params.id))

  await batch.commit()
  return NextResponse.json({ message: 'Project and all related data deleted' })
}
