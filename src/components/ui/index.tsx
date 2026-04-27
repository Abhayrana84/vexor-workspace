// src/components/ui/index.tsx
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { ReactNode } from 'react'

// ── Avatar ──────────────────────────────────────────────────────────────────
export function Avatar({
  name, initials, color, size = 32, image
}: { name?: string; initials?: string; color?: string; size?: number; image?: string | null }) {
  const fs = size <= 24 ? 8 : size <= 32 ? 10 : 13
  return (
    <div
      title={name}
      className="rounded-full flex items-center justify-center font-semibold flex-shrink-0 overflow-hidden relative"
      style={{ width: size, height: size, fontSize: fs, background: `${color || '#6d6afe'}20`, color: color || '#6d6afe' }}
    >
      {image ? (
        <img src={image} alt={name || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        initials || name?.slice(0, 2).toUpperCase()
      )}
    </div>
  )
}

// ── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold', className)}>
      {children}
    </span>
  )
}

// ── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({ children, variant = 'ghost', size = 'md', className, ...props }: ButtonProps) {
  const variants = {
    primary: { background: 'var(--accent)', color: '#fff', border: 'none' },
    ghost: { background: 'var(--bg2)', color: 'var(--txt1)', border: '1px solid var(--border2)' },
    danger: { background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' },
  }
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }

  return (
    <button
      {...props}
      className={cn('inline-flex items-center gap-1.5 rounded-lg font-medium transition-opacity hover:opacity-80 disabled:opacity-50 cursor-pointer', sizes[size], className)}
      style={{ ...variants[variant], fontFamily: 'Sora, sans-serif' }}
    >
      {children}
    </button>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl animate-pop-in"
        style={{ background: 'var(--bg1)', border: '1px solid var(--border2)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--txt0)' }}>{title}</h2>
          <button onClick={onClose} className="text-txt3 hover:text-txt0 transition-colors">
            <X size={16} style={{ color: 'var(--txt3)' }} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── FormField ─────────────────────────────────────────────────────────────────
export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs uppercase tracking-wider font-semibold mb-1.5" style={{ color: 'var(--txt3)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
      style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
      style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }}
    />
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y min-h-20"
      style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt0)', fontFamily: 'Sora, sans-serif' }}
    />
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn('rounded-xl p-5', onClick && 'cursor-pointer hover:border-opacity-30 transition-all', className)}
      style={{ background: 'var(--bg1)', border: '1px solid var(--border)' }}
    >
      {children}
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-4xl mb-3 opacity-30">{icon}</div>
      <div className="text-sm font-medium mb-1" style={{ color: 'var(--txt2)' }}>{title}</div>
      {sub && <div className="text-xs" style={{ color: 'var(--txt3)' }}>{sub}</div>}
    </div>
  )
}

// ── Loading ───────────────────────────────────────────────────────────────────
export function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border2)', borderTopColor: 'var(--accent)' }}
      />
    </div>
  )
}
