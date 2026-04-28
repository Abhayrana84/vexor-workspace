// src/app/api/team/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'
import * as admin from 'firebase-admin'

import { withAuth } from '@/lib/api-handler'

export const GET = withAuth(async (req, session) => {
  // FIX 1: Role-based authorization
  const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'MANAGER']
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  // PAGINATION: Default 25, Max 50
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 50)

  let query = adminDb.collection('users').orderBy('createdAt', 'asc')

  if (cursor) {
    const cursorDoc = await adminDb.collection('users').doc(cursor).get()
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc)
    }
  }

  const usersSnapshot = await query.limit(limit).get()
  const users = usersSnapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      role: data.role,
      permission: data.permission,
      avatarColor: data.avatarColor,
      initials: data.initials,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      _count: { 
        assignedTasks: data.assignedTasksCount || 0, 
        managedProjects: data.managedProjectsCount || 0 
      },
    }
  })

  const nextCursor = users.length === limit ? users[users.length - 1].id : null

  return NextResponse.json({ data: users, nextCursor })
}, { rateLimit: { limit: 20, windowMs: 60 * 1000 } });

import { ROLE_PERMISSIONS } from '@/lib/permissions'

export const PATCH = withAuth(async (req, session) => {
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only admins can update users' }, { status: 403 })
  }

  const { userId, role, password } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (!role && !password) return NextResponse.json({ error: 'No updates provided' }, { status: 400 })

  const updates: any = { sessionVersion: admin.firestore.FieldValue.increment(1) }
  const { adminAuth } = require('@/lib/firebase-admin');
  
  const userDoc = await adminDb.collection('users').doc(userId).get()
  const email = userDoc.data()?.email
  let authUid = userId

  if (email) {
    try {
      const authUser = await adminAuth.getUserByEmail(email)
      authUid = authUser.uid
    } catch (e) {
      console.warn('User not found in Firebase Auth:', email)
    }
  }

  if (role) {
    updates.permission = role
    updates.role = role
    updates.permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS['MEMBER']
    
    if (email && authUid !== userId || authUid === userId) {
      try {
        await adminAuth.setCustomUserClaims(authUid, { role, permissions: updates.permissions })
      } catch (e) {
        console.error('Error updating claims:', e)
      }
    }
  }

  if (password) {
    const bcrypt = require('bcryptjs')
    updates.password = await bcrypt.hash(password, 10)
    
    if (email && authUid !== userId || authUid === userId) {
      try {
        await adminAuth.updateUser(authUid, { password })
      } catch (e) {
        console.error('Error updating Firebase Auth password:', e)
      }
    }
  }

  try {
    await adminDb.collection('users').doc(userId).update(updates)
  } catch(e) {
    console.error('Error updating Firestore:', e)
    return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
  }

  try {
    await adminAuth.revokeRefreshTokens(authUid);
  } catch (e) {
    console.warn('Could not revoke tokens for', authUid)
  }

  return NextResponse.json({ id: userId, updated: true })
}, { rateLimit: { limit: 10, windowMs: 60 * 1000 } });

export const POST = withAuth(async (req, session) => {
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 })
  }

  const { name, email, role, password } = await req.json()
  if (!name || !email || !role || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { adminAuth } = require('@/lib/firebase-admin');
  const { ROLE_PERMISSIONS } = require('@/lib/permissions');
  const bcrypt = require('bcryptjs');

  try {
    const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['MEMBER']
    let uid;
    try {
      const authUser = await adminAuth.createUser({ email, password, displayName: name })
      uid = authUser.uid
    } catch (e: any) {
      if (e.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
      throw e
    }

    await adminAuth.setCustomUserClaims(uid, { role, permissions: perms })
    
    const hash = await bcrypt.hash(password, 10)
    const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    
    // Pick a random avatar color
    const colors = ['#6d6afe', '#22c55e', '#ec4899', '#3b82f6', '#a855f7', '#0ea5e9', '#f59e0b', '#ef4444']
    const avatarColor = colors[Math.floor(Math.random() * colors.length)]

    const userData = {
      name,
      email,
      role,
      permission: role,
      permissions: perms,
      password: hash,
      avatarColor,
      initials,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      sessionVersion: 0,
    }

    const docRef = await adminDb.collection('users').add(userData)

    // Also write a credentials doc so change-password works for dashboard-created users
    await adminDb.collection('credentials').doc(docRef.id).set({
      passwordHash: hash,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ id: docRef.id, ...userData })
  } catch (error: any) {
    console.error('Error adding member:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}, { rateLimit: { limit: 10, windowMs: 60 * 1000 } });

export const DELETE = withAuth(async (req, session) => {
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  if (userId === session.user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  const { adminAuth } = require('@/lib/firebase-admin')

  try {
    const userDoc = await adminDb.collection('users').doc(userId).get()
    const email = userDoc.data()?.email

    // Delete from Firestore
    await adminDb.collection('users').doc(userId).delete()

    // Delete from Firebase Auth
    if (email) {
      try {
        const authUser = await adminAuth.getUserByEmail(email)
        await adminAuth.deleteUser(authUser.uid)
      } catch (e) {
        console.warn('Could not delete Firebase Auth user:', e)
      }
    }

    return NextResponse.json({ deleted: true })
  } catch (error: any) {
    console.error('Error deleting member:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}, { rateLimit: { limit: 5, windowMs: 60 * 1000 } });
