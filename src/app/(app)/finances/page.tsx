'use client'
// src/app/(app)/finances/page.tsx
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui'
import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

function formatDate(val: any) {
  if (!val) return '—'
  try { return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return '—' }
}

const CATEGORIES = {
  INCOME: ['Client Payment', 'Project Revenue', 'Consulting', 'Maintenance Contract', 'Other Income'],
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
      body: JSON.stringify({ ...form, amount: Number(form.amount) })
    })
    setLoading(false)
    if (res.ok) { toast.success('Transaction added!'); onAdded() } else { toast.error('Failed to add transaction') }
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
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--txt3)' }}>Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }}>
              {cats.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--txt3)' }}>Amount (₹)</label>
            <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required
              placeholder="0.00" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }} />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--txt3)' }}>Client / Party Name</label>
            <input type="text" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
              placeholder="e.g. Vexor Client" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }} />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--txt3)' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              placeholder="Optional notes..." className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }} />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--txt3)' }}>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }}>
              <option value="CLEARED">Cleared</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-semibold mt-2"
            style={{ background: 'var(--accent)', color: '#fff', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Adding...' : 'Add Transaction'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function FinancesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [records, setRecords] = useState<any[]>([])
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0, incomeGrowth: null as string | null, expenseGrowth: null as string | null })
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')

  useEffect(() => {
    if (status === 'authenticated' && !session?.user?.permissions?.can_view_finance) {
      router.push('/dashboard')
    }
  }, [session, status])

  const fetchData = () => {
    setLoading(true)
    fetch('/api/finances').then(r => r.json()).then(data => {
      setRecords(data.records || [])
      setSummary(data.summary || { totalIncome: 0, totalExpense: 0, balance: 0, incomeGrowth: null, expenseGrowth: null })
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction? This cannot be undone.')) return
    const res = await fetch(`/api/finances?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Transaction deleted')
      setRecords(prev => prev.filter(r => r.id !== id))
      fetchData()
    } else { toast.error('Failed to delete') }
  }

  const filtered = filter === 'ALL' ? records : records.filter(r => r.type === filter)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); fetchData() }} />}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: 'var(--txt0)' }}>
            <Wallet size={20} style={{ color: 'var(--accent)' }} /> Financial Overview
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--txt3)' }}>Strictly confidential · Authorized access only</p>
        </div>
        <div className="flex gap-2 items-center">
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">{session?.user?.name}</Badge>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            <Plus size={14} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: 'Total Revenue', value: summary.totalIncome, color: '#10b981',
            icon: <TrendingUp size={40} />, growth: summary.incomeGrowth,
            bg: 'var(--bg1)'
          },
          {
            label: 'Total Expenses', value: summary.totalExpense, color: '#ef4444',
            icon: <ArrowDownCircle size={40} />, growth: summary.expenseGrowth,
            bg: 'var(--bg1)'
          },
          {
            label: 'Net Balance', value: summary.balance, color: '#fff',
            icon: <Wallet size={40} color="#fff" />, growth: null,
            bg: 'var(--accent)', isAccent: true
          },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-5 relative overflow-hidden"
            style={{ background: stat.bg, border: stat.isAccent ? 'none' : '1px solid var(--border)' }}>
            <div className="absolute top-0 right-0 p-4 opacity-10">{stat.icon}</div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: stat.isAccent ? 'rgba(255,255,255,0.7)' : 'var(--txt3)' }}>{stat.label}</div>
            <div className="text-2xl font-bold" style={{ color: stat.isAccent ? '#fff' : 'var(--txt0)' }}>
              ₹{stat.value.toLocaleString('en-IN')}
            </div>
            {stat.growth !== null && stat.growth !== undefined && (
              <div className="text-xs mt-1" style={{ color: Number(stat.growth) >= 0 ? '#10b981' : '#ef4444' }}>
                {Number(stat.growth) >= 0 ? '↑' : '↓'} {Math.abs(Number(stat.growth))}% vs last month
              </div>
            )}
            {stat.isAccent && (
              <div className="text-xs mt-1 text-white/70">Available for reinvestment</div>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['ALL', 'INCOME', 'EXPENSE'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: filter === f ? 'var(--accent)' : 'var(--bg2)',
              color: filter === f ? '#fff' : 'var(--txt2)',
              border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border2)'}`,
            }}>{f}</button>
        ))}
        <span className="ml-auto text-xs self-center" style={{ color: 'var(--txt3)' }}>{filtered.length} transactions</span>
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
                <tr><td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--txt3)' }}>No transactions found</td></tr>
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
