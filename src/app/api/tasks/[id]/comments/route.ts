// src/app/api/tasks/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

  const commentRef = adminDb.collection('comments').doc()
  const now = new Date()
  
  const commentData = {
    content: content.trim(),
    taskId: params.id,
    userId: session.user.id, // Fixed field name to match my Activity/Auth logic
    createdAt: now,
  }

  await commentRef.set(commentData)

  // Hydrate for response
  const author = {
    id: session.user.id,
    name: session.user.name,
    initials: (session.user as any).initials,
    avatarColor: (session.user as any).avatarColor,
  }

  return NextResponse.json({ id: commentRef.id, ...commentData, author }, { status: 201 })
}
