// src/app/forgot-password/page.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    
    try {
      await sendPasswordResetEmail(auth, email)
      setSent(true)
      toast.success('Password reset instructions sent to your email')
    } catch (error: any) {
      console.error('Forgot password error:', error)
      toast.error(error.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg0)' }}>
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            <span style={{ color: 'var(--accent)' }}>VEX</span>OR Reset
          </h1>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--txt3)' }}>
            Internal OS · Vexor IT Solutions
          </p>
        </div>

        <div className="rounded-xl p-8" style={{ background: 'var(--bg1)', border: '1px solid var(--border2)' }}>
          <h2 className="text-sm font-semibold mb-6" style={{ color: 'var(--txt2)' }}>
            Reset your password
          </h2>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs mb-4" style={{ color: 'var(--txt3)' }}>
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--txt3)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@vexorit.com"
                  required
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border2)',
                    color: 'var(--txt0)',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity"
                style={{ background: 'var(--accent)', color: '#fff', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="text-sm mb-4" style={{ color: 'var(--txt1)' }}>
                If an account exists for <b>{email}</b>, you will receive a reset link shortly.
              </div>
              <p className="text-xs" style={{ color: 'var(--txt3)' }}>
                Didn't receive it? Check your spam folder or try again.
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 text-center border-t border-dashed" style={{ borderColor: 'var(--border2)' }}>
            <Link href="/login" className="text-xs font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
