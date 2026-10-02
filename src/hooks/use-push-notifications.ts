import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { notificationsApi } from '@/api/notifications.api'
import { extractErrorMessage } from '@/lib/api-client'
import { disablePush, enablePush, getPushState, resyncPush, shouldOfferPush, type PushState } from '@/lib/push'

const PUSH_STATE_KEY = ['push-state'] as const
const OFFERED_KEY = 'crm-push-offered'

const STATE_MESSAGES: Partial<Record<PushState, string>> = {
  unsupported: "This browser can't show device notifications.",
  unavailable: 'Device notifications are not set up on the server yet.',
  denied: 'Notifications are blocked for this site — allow them in your browser’s site settings, then try again.',
}

/** Whether this device gets the user's notifications in its notification bar, and the switches for it. */
export function usePushNotifications() {
  const qc = useQueryClient()
  const state = useQuery({ queryKey: PUSH_STATE_KEY, queryFn: getPushState, staleTime: Infinity })

  const enable = useMutation({
    mutationFn: () => enablePush({ prompt: true }),
    onSuccess: (next) => {
      qc.setQueryData(PUSH_STATE_KEY, next)
      if (next === 'on') toast.success('Device notifications turned on')
      else if (STATE_MESSAGES[next]) toast.error('Could not turn on device notifications', { description: STATE_MESSAGES[next] })
    },
    onError: (error) =>
      toast.error('Could not turn on device notifications', { description: extractErrorMessage(error) }),
  })

  const disable = useMutation({
    mutationFn: disablePush,
    onSuccess: (next) => {
      qc.setQueryData(PUSH_STATE_KEY, next)
      toast.success('Device notifications turned off')
    },
  })

  const test = useMutation({
    mutationFn: notificationsApi.pushTest,
    onSuccess: ({ devices }) =>
      devices > 0
        ? toast.success(`Test sent to ${devices} device${devices === 1 ? '' : 's'}`)
        : toast.error('No devices are signed up for notifications yet'),
    onError: (error) => toast.error('Could not send a test', { description: extractErrorMessage(error) }),
  })

  return { state: state.data, enable, disable, test }
}

/**
 * Mounted once inside the signed-in app: keeps this device registered to the
 * current user, refreshes the bell the moment a push arrives, follows taps
 * on a device notification to the right page, and offers device
 * notifications once to anyone who hasn't decided yet.
 */
export function usePushBridge() {
  const qc = useQueryClient()
  const router = useRouter()
  const { enable } = usePushNotifications()

  useEffect(() => {
    resyncPush()
      .catch(() => undefined)
      .finally(() => qc.invalidateQueries({ queryKey: PUSH_STATE_KEY }))
  }, [qc])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; path?: string } | null
      if (data?.type === 'push-received') {
        qc.invalidateQueries({ queryKey: ['notifications'] })
        qc.invalidateQueries({ queryKey: ['leads'] })
      } else if (data?.type === 'push-navigate' && data.path?.startsWith('/')) {
        router.history.push(data.path)
      }
    }
    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [qc, router])

  const { mutate: turnOn } = enable
  useEffect(() => {
    if (!shouldOfferPush()) return
    try {
      if (localStorage.getItem(OFFERED_KEY)) return
      localStorage.setItem(OFFERED_KEY, '1')
    } catch {
      return
    }
    const timer = setTimeout(() => {
      toast('Get new leads on this device?', {
        description: 'Turn on notifications to see new leads, assignments and reminders in your notification bar — even when the CRM is closed.',
        duration: 15_000,
        action: { label: 'Turn on', onClick: () => turnOn() },
      })
    }, 2500)
    return () => clearTimeout(timer)
  }, [turnOn])
}
