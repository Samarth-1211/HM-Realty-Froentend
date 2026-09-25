import { cn } from '@/lib/utils'

/** Pulsing "something new here" marker on a nav item. */
export function NavDot({ className }: { className?: string }) {
  return (
    <span className={cn('relative flex size-2 shrink-0 rounded-full', className)}>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
      <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
      <span className="sr-only">New</span>
    </span>
  )
}
