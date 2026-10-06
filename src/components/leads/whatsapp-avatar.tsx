import { cn } from '@/lib/utils'

/**
 * WhatsApp's "no profile photo" picture. The Cloud API never gives a business
 * its customers' real photos, so every lead gets this stand-in.
 */
export function WhatsAppAvatar({ className }: { className?: string }) {
  return (
    <span className={cn('block size-12 shrink-0 overflow-hidden rounded-full bg-wa-avatar', className)}>
      <svg viewBox="0 0 212 212" className="size-full" aria-hidden="true">
        <g fill="#fff">
          <circle cx="106" cy="88" r="38" />
          <ellipse cx="106" cy="200" rx="76" ry="62" />
        </g>
      </svg>
    </span>
  )
}
