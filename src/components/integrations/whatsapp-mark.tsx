import { BRAND_ICONS } from '@/lib/brand-icons'
import { cn } from '@/lib/utils'

const sizes = { sm: 'size-8 text-xs', md: 'size-11 text-sm', lg: 'size-14 text-lg' }

export function WhatsAppMark({ size = 'md', className }: { size?: keyof typeof sizes; className?: string }) {
  const brand = BRAND_ICONS.whatsapp
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-xl text-white shadow-sm', sizes[size], className)}
      style={{ backgroundColor: `#${brand.hex}` }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-1/2 text-white">
        <path d={brand.path} />
      </svg>
    </div>
  )
}
