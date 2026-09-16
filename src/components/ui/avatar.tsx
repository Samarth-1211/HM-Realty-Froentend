import { cn } from '@/lib/utils'
import { initials } from '@/lib/utils'

const palette = [
  'bg-brand-100 text-brand-700',
  'bg-amber-100 text-amber-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
]

function hashColor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}

export function Avatar({
  firstName,
  lastName,
  size = 'md',
  className,
}: {
  firstName: string
  lastName: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = { sm: 'size-7 text-xs', md: 'size-9 text-sm', lg: 'size-12 text-base' }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        sizes[size],
        hashColor(`${firstName}${lastName}`),
        className,
      )}
    >
      {initials(firstName, lastName)}
    </div>
  )
}
