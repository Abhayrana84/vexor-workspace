// src/app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg0)' }}>
      <div className="text-6xl font-black mb-4" style={{ color: 'var(--accent)', letterSpacing: '-3px' }}>404</div>
      <div className="text-xl font-semibold mb-2" style={{ color: 'var(--txt0)' }}>Page not found</div>
      <div className="text-sm mb-8" style={{ color: 'var(--txt3)' }}>
        The page you're looking for doesn't exist or was moved.
      </div>
      <Link
        href="/dashboard"
        className="px-5 py-2.5 rounded-lg text-sm font-semibold"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
