'use client'
// src/app/error.tsx
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg0)' }}>
      <div className="text-4xl mb-4">⚠️</div>
      <div className="text-lg font-semibold mb-2" style={{ color: 'var(--txt0)' }}>Something went wrong</div>
      <div className="text-sm mb-8 max-w-md text-center" style={{ color: 'var(--txt3)' }}>
        {error.message || 'An unexpected error occurred. Please try again.'}
      </div>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-lg text-sm font-semibold"
        style={{ background: 'var(--accent)', color: '#fff' }}
      >
        Try Again
      </button>
    </div>
  )
}
