// src/app/api/clients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import { hasPermission } from '@/lib/utils'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientDoc = await adminDb.collection('clients').doc(params.id).get()
  if (!clientDoc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  
  const clientData = clientDoc.data() as any

  // Fetch projects for this client
  const projectsSnapshot = await adminDb.collection('projects').where('clientId', '==', params.id).get()
  const projects = await Promise.all(projectsSnapshot.docs.map(async (pdoc) => {
    const pdata = pdoc.data() as any
    const managerDoc = await adminDb.collection('users').doc(pdata.managerId).get()
    const tasksSnapshot = await adminDb.collection('tasks').where('projectId', '==', pdoc.id).get()
    const tasks = tasksSnapshot.docs.map(t => t.data())
    
    return {
      id: pdoc.id,
      ...pdata,
      manager: managerDoc.data(),
      tasks,
      _count: { tasks: tasks.length }
    }
  }))

  return NextResponse.json({ id: clientDoc.id, ...clientData, projects })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(session.user.permissions, 'can_manage_clients')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const { name, contactName, email, phone, emoji } = body

  const updateData: any = { updatedAt: new Date() }
  if (name) updateData.name = name
  if (contactName !== undefined) updateData.contactName = contactName
  if (email) updateData.email = email
  if (phone !== undefined) updateData.phone = phone
  if (emoji) updateData.emoji = emoji

  await adminDb.collection('clients').doc(params.id).update(updateData)

  return NextResponse.json({ id: params.id, ...updateData })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!hasPermission(session.user.permissions, 'can_manage_clients')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  await adminDb.collection('clients').doc(params.id).delete()
  return NextResponse.json({ message: 'Client deleted' })
}
