'use client'
// src/app/(app)/clients/new/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, FormField, Input } from '@/components/ui'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const EMOJIS = ['🏢', '🔬', '🌿', '🍔', '💳', '🚀', '🎨', '📱', '🏗️', '⚡']

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', contactName: '', email: '', phone: '', emoji: '🏢' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return toast.error('Name and email are required')
    setLoading(true)
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) { toast.success('Client added!'); router.push('/clients') }
    else toast.error('Failed to add client')
  }

  return (
    <div className="p-6 max-w-lg">
      <Link href="/clients" className="flex items-center gap-1 text-xs mb-5 hover:opacity-70" style={{ color: 'var(--txt3)' }}>
        <ChevronLeft size={12} /> Back to Clients
      </Link>
      <h1 className="text-xl font-bold tracking-tight mb-6" style={{ color: 'var(--txt0)' }}>Add Client</h1>

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl p-6" style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}>
          <FormField label="Emoji / Logo">
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(e => (
                <button
                  key={e} type="button"
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors"
                  style={{
                    background: form.emoji === e ? 'var(--accentbg)' : 'var(--bg2)',
                    border: `1px solid ${form.emoji === e ? 'var(--accentborder)' : 'var(--border2)'}`,
                  }}
                >{e}</button>
              ))}
            </div>
          </FormField>
          <FormField label="Company Name *">
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Acme Corp" required />
          </FormField>
          <FormField label="Contact Person">
            <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Full name" />
          </FormField>
          <FormField label="Email *">
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@company.com" required />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
          </FormField>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <Link href="/clients"><Button variant="ghost">Cancel</Button></Link>
          <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add Client'}</Button>
        </div>
      </form>
    </div>
  )
}
