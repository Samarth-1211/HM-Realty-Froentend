import { cn } from '@/lib/utils'
import { maskPhones } from './mask-phones'

export function JsonView({ value, mask = false, className }: { value: unknown; mask?: boolean; className?: string }) {
  return (
    <pre
      className={cn(
        'max-h-96 overflow-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] leading-relaxed text-emerald-200',
        className,
      )}
    >
      {JSON.stringify(mask ? maskPhones(value) : value, null, 2)}
    </pre>
  )
}
