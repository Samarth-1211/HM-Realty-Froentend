import { Link, useRouterState } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { navForRole } from '@/lib/nav-config'
import { APP_NAME, APP_TAGLINE, ROLE_LABELS } from '@/lib/constants'
import { useAuthStore } from '@/store/auth-store'
import { useLogout } from '@/hooks/use-auth'
import { useNavDots } from '@/hooks/use-nav-dots'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import hmRealtyLogo from '@/assets/hm-realty-logo.jpg'
import { NavDot } from './nav-dot'

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const logout = useLogout()
  const hasDot = useNavDots()

  if (!user) return null
  const items = navForRole(user.role)

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-white lg:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
        <div className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-brand-950">
          <img src={hmRealtyLogo} alt={APP_NAME} className="size-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900">{APP_NAME}</p>
          <p className="text-[11px] leading-tight text-slate-400">{APP_TAGLINE}</p>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`)
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                  )}
                >
                  <item.icon className={cn('size-[18px]', active && 'text-brand-600')} />
                  {item.label}
                  {/* Opening the page itself clears the dot. */}
                  {hasDot(item.to) && pathname !== item.to && <NavDot className="ml-auto" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar firstName={user.firstName} lastName={user.lastName} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-slate-400">{ROLE_LABELS[user.role]}</p>
          </div>
          <button
            onClick={() => logout.mutate()}
            title="Sign out"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
