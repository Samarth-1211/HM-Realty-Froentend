import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link, type LinkComponentProps } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'brand',
  trend,
  delay = 0,
  link,
}: {
  label: string
  value: ReactNode
  icon: LucideIcon
  tone?: 'brand' | 'amber' | 'violet' | 'rose' | 'sky' | 'emerald'
  trend?: string
  delay?: number
  /** Makes the whole card a link to the page behind the number. */
  link?: LinkComponentProps
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }

  const content = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        {trend && <p className="mt-1 text-xs text-slate-400">{trend}</p>}
      </div>
      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
        <Icon className="size-5" />
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn(
        'rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/50',
        link ? 'transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md' : 'p-5',
      )}
    >
      {link ? (
        <Link
          {...link}
          className="block rounded-2xl p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </motion.div>
  )
}
