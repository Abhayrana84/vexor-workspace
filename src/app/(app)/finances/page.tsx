'use client'
// src/app/(app)/finances/page.tsx
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui'
import {
  Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp,
  Plus, Trash2, X, Download, CalendarDays,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'ALL'
type TxType = 'ALL' | 'INCOME' | 'EXPENSE'

interface Record {
  id: string
  type: 'INCOME' | 'EXPENSE'
  category: string
  amount: number
  description?: string
  clientName?: string
  status: string
  createdAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(val: any) {
  if (!val) return '—'
  try {
    return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getPeriodStart(period: Period): Date | null {
  const now = new Date()
  switch (period) {
    case 'TODAY': {
      const d = new Date(now); d.setHours(0, 0, 0, 0); return d
    }
    case 'WEEK': {
      const d = new Date(now); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d
    }
    case 'MONTH': {
      const d = new Date(now); d.setMonth(d.getMonth() - 1); d.setHours(0, 0, 0, 0); return d
    }
    case 'YEAR': {
      const d = new Date(now); d.setFullYear(d.getFullYear() - 1); d.setHours(0, 0, 0, 0); return d
    }
    default: return null
  }
}

const PERIOD_LABELS: Record<Period, string> = {
  TODAY: 'Today',
  WEEK:  'Last 7 Days',
  MONTH: 'Last Month',
  YEAR:  'Last Year',
  ALL:   'All Time',
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

function exportToCSV(records: Record[], period: Period) {
  const periodLabel = PERIOD_LABELS[period].replace(/ /g, '_')
  const fileName = `Vexor_Finances_${periodLabel}_${new Date().toISOString().slice(0, 10)}.csv`

  // BOM for proper UTF-8 / ₹ symbol rendering in Google Sheets / Excel
  const BOM = '\uFEFF'

  const headers = ['Date', 'Category', 'Client / Party', 'Description', 'Type', 'Status', 'Amount (INR)']

  const rows = records.map(r => [
    formatDate(r.createdAt),
    r.category,
    r.clientName || '',
    r.description || '',
    r.type,
    r.status,
    (r.type === 'INCOME' ? '' : '-') + r.amount.toFixed(2),
  ])

  // Summary rows at the bottom
  const totalIncome  = records.filter(r => r.type === 'INCOME').reduce((a, r) => a + r.amount, 0)
  const totalExpense = records.filter(r => r.type === 'EXPENSE').reduce((a, r) => a + r.amount, 0)
  const balance      = totalIncome - totalExpense

  const summaryRows = [
    [],
    ['', '', '', '', '', 'TOTAL INCOME',  totalIncome.toFixed(2)],
    ['', '', '', '', '', 'TOTAL EXPENSE', (-totalExpense).toFixed(2)],
    ['', '', '', '', '', 'NET BALANCE',   balance.toFixed(2)],
    [],
    [`Exported: ${new Date().toLocaleString('en-IN')}`, '', '', '', '', 'Period:', PERIOD_LABELS[period]],
  ]

  const escape = (v: string | number) => {
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const csvContent = BOM + [
    headers.map(escape).join(','),
    ...rows.map(r => r.map(escape).join(',')),
    ...summaryRows.map(r => r.map(escape).join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
  toast.success(`Exported ${records.length} transactions as CSV`)
}

// ─── Add Transaction Modal ────────────────────────────────────────────────────

const CATEGORIES = {
  INCOME:  ['Client Payment', 'Project Revenue', 'Consulting', 'Maintenance Contract', 'Other Income'],
  EXPENSE: ['Salaries', 'Software Licenses', 'Infrastructure', 'Marketing', 'Office Supplies', 'Travel', 'Utilities', 'Other Expense'],
}

function AddTransactionModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ type: 'INCOME', category: CATEGORIES.INCOME[0], amount: '', description: '', clientName: '', status: 'CLEARED' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || isNaN(Number(form.amount))) return toast.error('Enter a valid amount')
    setLoading(true)
    const res = await fetch('/api/finances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    })
    setLoading(false)
    if (res.ok) { toast.success('Transaction added!'); onAdded() }
    else { toast.error('Failed to add transaction') }
  }

  const cats = form.type === 'INCOME' ? CATEGORIES.INCOME : CATEGORIES.EXPENSE

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--bg1)', border: '1px solid var(--border2)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold" style={{ color: 'var(--txt0)' }}>Add Transaction</h2>
          <button onClick={onClose}><X size={16} style={{ color: 'var(--txt3)' }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {['INCOME', 'EXPENSE'].map(t => (
              <button key={t} type="button"
                onClick={() => setForm(f => ({ ...f, type: t, category: (CATEGORIES as any)[t][0] }))}
                className="py-2 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: form.type === t ? (t === 'INCOME' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)') : 'var(--bg2)',
                  color: form.type === t ? (t === 'INCOME' ? '#10b981' : '#ef4444') : 'var(--txt2)',
                  border: `1px solid ${form.type === t ? (t === 'INCOME' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)') : 'var(--border2)'}`,
                }}
              >{t}</button>
            ))}
          </div>
          {[
            { label: 'Category', el: <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }}>{cats.map(c => <option key={c}>{c}</option>)}</select> },
            { label: 'Amount (₹)', el: <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required placeholder="0.00" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }} /> },
            { label: 'Client / Party Name', el: <input type="text" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="e.g. Vexor Client" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }} /> },
            { label: 'Description', el: <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional notes..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }} /> },
            { label: 'Status', el: <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }}><option value="CLEARED">Cleared</option><option value="PENDING">Pending</option></select> },
          ].map(({ label, el }) => (
            <div key={label}>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--txt3)' }}>{label}</label>
              {el}
            </div>
          ))}
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-semibold mt-2"
            style={{ background: 'var(--accent)', color: '#fff', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Adding...' : 'Add Transaction'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinancesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords]   = useState<Record[]>([])
  const [summary, setSummary]   = useState({ totalIncome: 0, totalExpense: 0, balance: 0, incomeGrowth: null as string | null, expenseGrowth: null as string | null })
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [typeFilter, setTypeFilter]     = useState<TxType>('ALL')
  const [periodFilter, setPeriodFilter] = useState<Period>('ALL')

  useEffect(() => {
    if (status === 'authenticated' && !session?.user?.permissions?.can_view_finance) {
      router.push('/dashboard')
    }
  }, [session, status])

  const fetchData = () => {
    setLoading(true)
    fetch('/api/finances')
      .then(r => r.json())
      .then(data => {
        setRecords(data.records || [])
        setSummary(data.summary || { totalIncome: 0, totalExpense: 0, balance: 0, incomeGrowth: null, expenseGrowth: null })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction? This cannot be undone.')) return
    const res = await fetch(`/api/finances?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Transaction deleted'); fetchData() }
    else { toast.error('Failed to delete') }
  }

  // Apply both period + type filters client-side
  const filtered = useMemo(() => {
    const start = getPeriodStart(periodFilter)
    return records.filter(r => {
      const matchType   = typeFilter === 'ALL' || r.type === typeFilter
      const matchPeriod = !start || new Date(r.createdAt) >= start
      return matchType && matchPeriod
    })
  }, [records, typeFilter, periodFilter])

  // Recompute summary for the active period
  const periodSummary = useMemo(() => {
    const income  = filtered.filter(r => r.type === 'INCOME').reduce((a, r) => a + r.amount, 0)
    const expense = filtered.filter(r => r.type === 'EXPENSE').reduce((a, r) => a + r.amount, 0)
    return { income, expense, balance: income - expense }
  }, [filtered])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  )

  const PERIODS: Period[] = ['TODAY', 'WEEK', 'MONTH', 'YEAR', 'ALL']

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); fetchData() }} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--txt0)' }}>
            <Wallet size={20} style={{ color: 'var(--accent)' }} /> Financial Overview
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--txt3)' }}>Strictly confidential · Authorized access only</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">{session?.user?.name}</Badge>
          <button
            onClick={() => exportToCSV(filtered, periodFilter)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus size={14} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <CalendarDays size={14} style={{ color: 'var(--txt3)' }} />
        <div
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}
        >
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriodFilter(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                periodFilter === p
                  ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px rgba(109,106,254,0.3)' }
                  : { color: 'var(--txt2)' }
              }
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats — reflect the active period */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Revenue',  value: periodSummary.income,  color: '#10b981', icon: <TrendingUp size={40} />,        bg: 'var(--bg1)', growth: summary.incomeGrowth  },
          { label: 'Total Expenses', value: periodSummary.expense, color: '#ef4444', icon: <ArrowDownCircle size={40} />,   bg: 'var(--bg1)', growth: summary.expenseGrowth },
          { label: 'Net Balance',    value: periodSummary.balance, color: '#fff',    icon: <Wallet size={40} color="#fff" />, bg: 'var(--accent)', isAccent: true, growth: null },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-5 relative overflow-hidden"
            style={{ background: stat.bg, border: stat.isAccent ? 'none' : '1px solid var(--border)' }}>
            <div className="absolute top-0 right-0 p-4 opacity-10">{stat.icon}</div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: stat.isAccent ? 'rgba(255,255,255,0.7)' : 'var(--txt3)' }}>
              {stat.label}
              {periodFilter !== 'ALL' && (
                <span className="ml-1.5 normal-case font-normal" style={{ color: stat.isAccent ? 'rgba(255,255,255,0.5)' : 'var(--txt3)', fontSize: '10px' }}>
                  · {PERIOD_LABELS[periodFilter]}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold" style={{ color: stat.isAccent ? '#fff' : 'var(--txt0)' }}>
              {fmt(stat.value)}
            </div>
            {stat.growth != null && (
              <div className="text-xs mt-1" style={{ color: Number(stat.growth) >= 0 ? '#10b981' : '#ef4444' }}>
                {Number(stat.growth) >= 0 ? '↑' : '↓'} {Math.abs(Number(stat.growth))}% vs last month
              </div>
            )}
            {stat.isAccent && <div className="text-xs mt-1 text-white/70">Available for reinvestment</div>}
          </div>
        ))}
      </div>

      {/* Type filter + count */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {(['ALL', 'INCOME', 'EXPENSE'] as TxType[]).map(f => (
          <button key={f} onClick={() => setTypeFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: typeFilter === f ? 'var(--accent)' : 'var(--bg2)',
              color: typeFilter === f ? '#fff' : 'var(--txt2)',
              border: `1px solid ${typeFilter === f ? 'var(--accent)' : 'var(--border2)'}`,
            }}>
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs self-center" style={{ color: 'var(--txt3)' }}>
          {filtered.length} transactions
        </span>
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Description', 'Type', 'Status', 'Amount', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--txt3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--txt3)' }}>No transactions for this period</td></tr>
              ) : filtered.map((record, i) => (
                <tr key={record.id} className="group hover:bg-white/[0.02] transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs" style={{ color: 'var(--txt3)' }}>{formatDate(record.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="text-xs font-medium" style={{ color: 'var(--txt0)' }}>{record.category}</div>
                    {(record.description || record.clientName) && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--txt3)' }}>{record.clientName || record.description}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {record.type === 'INCOME'
                        ? <ArrowUpCircle size={13} className="text-green-400" />
                        : <ArrowDownCircle size={13} className="text-red-400" />}
                      <span className="text-xs" style={{ color: record.type === 'INCOME' ? '#10b981' : '#ef4444' }}>{record.type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge className={record.status === 'CLEARED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}>
                      {record.status || 'CLEARED'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-sm" style={{ color: record.type === 'INCOME' ? '#10b981' : '#ef4444' }}>
                    {record.type === 'INCOME' ? '+' : '-'}₹{Number(record.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleDelete(record.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:bg-red-500/10"
                      style={{ color: '#ef4444' }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
