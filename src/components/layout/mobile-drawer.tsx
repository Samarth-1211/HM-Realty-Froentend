import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import { LogOut, X } from 'lucide-react'
import { navForRole } from '@/lib/nav-config'
import { ROLE_LABELS } from '@/lib/constants'
import { useAuthStore } from '@/store/auth-store'
import { useLogout } from '@/hooks/use-auth'
import { Avatar } from '@/components/ui/avatar'
import hmRealtyLogo from '@/assets/hm-realty-logo.jpg'

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  if (!user) return null
  const items = navForRole(user.role)

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="safe-top safe-bottom absolute right-0 top-0 flex h-full w-72 flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center overflow-hidden rounded-lg bg-brand-950">
                  <img src={hmRealtyLogo} alt="HM Realty" className="size-full object-cover" />
                </div>
                <span className="text-sm font-bold text-slate-900">HM Realty</span>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
              <Avatar firstName={user.firstName} lastName={user.lastName} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-slate-400">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>

            <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3">
              <ul className="flex flex-col gap-1">
                {items.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      activeProps={{ className: 'bg-brand-50 text-brand-700' }}
                    >
                      <item.icon className="size-[18px]" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-slate-100 p-3">
              <button
                onClick={() => logout.mutate()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="size-[18px]" />
                Sign out
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
