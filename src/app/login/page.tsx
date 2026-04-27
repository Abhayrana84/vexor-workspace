'use client'
// src/app/login/page.tsx
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      toast.error('Invalid email or password')
    } else {
      toast.success('Welcome back!')
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg0)' }}>
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            <span style={{ color: 'var(--accent)' }}>VEX</span>OR Workspace
          </h1>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--txt3)' }}>
            Internal OS · Vexor IT Solutions
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8"
          style={{ background: 'var(--bg1)', border: '1px solid var(--border2)' }}
        >
          <h2 className="text-sm font-semibold mb-6" style={{ color: 'var(--txt2)' }}>
            Sign in to your workspace
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
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
                  fontFamily: 'Sora, sans-serif',
                }}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--txt3)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{
                  background: 'var(--bg2)',
                  border: '1px solid var(--border2)',
                  color: 'var(--txt0)',
                  fontFamily: 'Sora, sans-serif',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity"
              style={{ background: 'var(--accent)', color: '#fff', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <Link href="/forgot-password" title="Forgot Password" id="forgot-password-link" className="text-xs hover:underline" style={{ color: 'var(--txt3)' }}>
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
