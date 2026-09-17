import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Bell, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/utils'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/queries/use-notifications'
import type { Notification } from '@/types'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data: unreadCount } = useUnreadNotificationCount()
  const { data: notifications, isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const handleClick = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.id)
    setOpen(false)
    if (n.task?.leadId) {
      navigate({ to: '/leads/$leadId', params: { leadId: n.task.leadId } })
    } else {
      navigate({ to: '/todo' })
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
      >
        <Bell className="size-4.5" />
        {!!unreadCount && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {!!unreadCount && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="px-3.5 py-6 text-center text-sm text-slate-400">Loading…</p>
            ) : !notifications || notifications.length === 0 ? (
              <p className="px-3.5 py-6 text-center text-sm text-slate-400">You're all caught up.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    'flex w-full flex-col gap-0.5 border-b border-slate-50 px-3.5 py-2.5 text-left last:border-0 hover:bg-slate-50',
                    !n.isRead && 'bg-brand-50/40',
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                    {!n.isRead && <span className="size-1.5 shrink-0 rounded-full bg-brand-500" />}
                    {n.title}
                  </span>
                  <span className="text-xs text-slate-500">{n.message}</span>
                  <span className="text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
