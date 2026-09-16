import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Badge({
  children,
  className,
  variant = 'neutral',
}: {
  children: ReactNode
  className?: string
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger'
}) {
  const variants = {
    neutral: 'bg-slate-100 text-slate-600 ring-slate-500/10',
    brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    danger: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function StatusPill({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        className,
      )}
    >
      {label}
    </span>
  )
}
