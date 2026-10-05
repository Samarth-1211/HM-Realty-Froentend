import { AlertTriangle, CheckCircle2, CircleDashed, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DebugStatus = 'pass' | 'warn' | 'fail' | 'skipped'

export function StatusIcon({ status, className }: { status: DebugStatus; className?: string }) {
  const Icon = status === 'pass' ? CheckCircle2 : status === 'warn' ? AlertTriangle : status === 'fail' ? XCircle : CircleDashed
  return (
    <Icon
      className={cn(
        'size-4 shrink-0',
        status === 'pass' && 'text-emerald-500',
        status === 'warn' && 'text-amber-500',
        status === 'fail' && 'text-rose-500',
        status === 'skipped' && 'text-slate-300',
        className,
      )}
    />
  )
}
