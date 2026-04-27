// src/app/api/finances/route.ts
import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { withAuth } from '@/lib/api-handler'

export const GET = withAuth(async (req, session) => {
  if (!session.user.permissions?.can_view_finance) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // e.g. "2024-04"

  let query: any = adminDb.collection('finances').orderBy('createdAt', 'desc')

  const snapshot = await query.limit(200).get()
  const records = snapshot.docs.map((doc: any) => {
    const d = doc.data()
    return {
      id: doc.id,
      ...d,
      createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt,
    }
  })

  // Calculate summaries
  const totalIncome = records.filter((r: any) => r.type === 'INCOME').reduce((a: number, r: any) => a + (r.amount || 0), 0)
  const totalExpense = records.filter((r: any) => r.type === 'EXPENSE').reduce((a: number, r: any) => a + (r.amount || 0), 0)

  // Month-over-month trend
  const now = new Date()
  const thisMonth = records.filter((r: any) => {
    const d = new Date(r.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const lastMonth = records.filter((r: any) => {
    const d = new Date(r.createdAt)
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear()
  })

  const thisMonthIncome = thisMonth.filter((r: any) => r.type === 'INCOME').reduce((a: number, r: any) => a + r.amount, 0)
  const lastMonthIncome = lastMonth.filter((r: any) => r.type === 'INCOME').reduce((a: number, r: any) => a + r.amount, 0)
  const incomeGrowth = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1) : null

  const thisMonthExpense = thisMonth.filter((r: any) => r.type === 'EXPENSE').reduce((a: number, r: any) => a + r.amount, 0)
  const lastMonthExpense = lastMonth.filter((r: any) => r.type === 'EXPENSE').reduce((a: number, r: any) => a + r.amount, 0)
  const expenseGrowth = lastMonthExpense > 0 ? ((thisMonthExpense - lastMonthExpense) / lastMonthExpense * 100).toFixed(1) : null

  return NextResponse.json({
    records,
    summary: { totalIncome, totalExpense, balance: totalIncome - totalExpense, incomeGrowth, expenseGrowth }
  })
}, { rateLimit: { limit: 20, windowMs: 60 * 1000 } })

export const POST = withAuth(async (req, session) => {
  if (!session.user.permissions?.can_view_finance) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { type, category, amount, description, clientName, status } = await req.json()
  if (!type || !category || !amount) {
    return NextResponse.json({ error: 'type, category, amount are required' }, { status: 400 })
  }

  const docRef = await adminDb.collection('finances').add({
    type,         // 'INCOME' | 'EXPENSE'
    category,
    amount: Number(amount),
    description: description || '',
    clientName: clientName || '',
    status: status || 'CLEARED',
    createdBy: session.user.id,
    createdAt: new Date(),
  })

  return NextResponse.json({ id: docRef.id, created: true }, { status: 201 })
}, { rateLimit: { limit: 10, windowMs: 60 * 1000 } })

export const DELETE = withAuth(async (req, session) => {
  if (!session.user.permissions?.can_view_finance) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await adminDb.collection('finances').doc(id).delete()
  return NextResponse.json({ deleted: true })
}, { rateLimit: { limit: 10, windowMs: 60 * 1000 } })
