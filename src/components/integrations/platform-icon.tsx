import { BRAND_ICONS } from '@/lib/brand-icons'
import type { PlatformMeta } from '@/lib/platform-catalog'
import { cn } from '@/lib/utils'

const sizes = { sm: 'size-8 text-xs', md: 'size-11 text-sm', lg: 'size-14 text-lg' }

export function PlatformIcon({
  platform,
  size = 'md',
  className,
}: {
  platform: PlatformMeta
  size?: keyof typeof sizes
  className?: string
}) {
  const brand = platform.brandIconKey ? BRAND_ICONS[platform.brandIconKey] : undefined

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm',
        sizes[size],
        className,
      )}
      style={{ backgroundColor: `#${platform.color}` }}
    >
      {brand ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-1/2 text-white">
          <path d={brand.path} />
        </svg>
      ) : (
        <span className="leading-none tracking-tight">{platform.monogram}</span>
      )}
    </div>
  )
}
