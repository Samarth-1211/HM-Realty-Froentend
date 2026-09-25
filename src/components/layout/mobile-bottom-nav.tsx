import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { navForRole } from '@/lib/nav-config'
import { useAuthStore } from '@/store/auth-store'
import { useNavDots } from '@/hooks/use-nav-dots'
import { cn } from '@/lib/utils'
import { MobileDrawer } from './mobile-drawer'
import { NavDot } from './nav-dot'

export function MobileBottomNav() {
  const user = useAuthStore((s) => s.user)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const hasDot = useNavDots()

  if (!user) return null
  const allItems = navForRole(user.role)
  const primary = allItems.filter((i) => i.mobilePrimary).slice(0, 4)
  const hasMore = allItems.length > primary.length
  const moreHasDot = allItems.some((i) => !primary.includes(i) && hasDot(i.to))

  return (
    <>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-100 bg-white/95 backdrop-blur lg:hidden">
        {primary.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`)
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              <span className="relative">
                <item.icon className={cn('size-5', active ? 'text-brand-600' : 'text-slate-400')} />
                {hasDot(item.to) && pathname !== item.to && (
                  <NavDot className="absolute -right-1 -top-0.5 ring-2 ring-white" />
                )}
              </span>
              <span className={cn('text-[11px] font-medium', active ? 'text-brand-700' : 'text-slate-400')}>
                {item.label}
              </span>
            </Link>
          )
        })}
        {hasMore && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-1 flex-col items-center gap-1 py-2.5"
          >
            <span className="relative">
              <Menu className="size-5 text-slate-400" />
              {moreHasDot && <NavDot className="absolute -right-1 -top-0.5 ring-2 ring-white" />}
            </span>
            <span className="text-[11px] font-medium text-slate-400">More</span>
          </button>
        )}
      </nav>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
