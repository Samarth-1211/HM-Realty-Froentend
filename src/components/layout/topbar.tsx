import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import { Building2, Menu, RefreshCw } from 'lucide-react'
import { NAV_ITEMS } from '@/lib/nav-config'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { MobileDrawer } from './mobile-drawer'

export function Topbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [spinning, setSpinning] = useState(false)

  const current = NAV_ITEMS.find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`))

  const handleRefresh = () => {
    setSpinning(true)
    qc.invalidateQueries().finally(() => setTimeout(() => setSpinning(false), 500))
  }

  return (
    <>
      <header className="safe-top sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-100 bg-white/90 px-4 backdrop-blur sm:px-6">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="size-5" />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex size-7 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Building2 className="size-4" />
          </div>
        </div>

        <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
          {current?.label ?? 'Dashboard'}
        </h1>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 sm:inline-flex">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
          <button
            onClick={handleRefresh}
            title="Refresh data"
            className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <RefreshCw className={cn('size-4', spinning && 'animate-spin')} />
          </button>
          <NotificationBell />
        </div>
      </header>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
