import { notificationsApi } from '@/api/notifications.api'

/**
 * Device notifications (Web Push): with these on, every in-app notification
 * also lands in the phone's notification bar / the desktop's notification
 * centre — even with the CRM closed. public/sw.js shows them.
 */

const SW_URL = '/sw.js'
/** Set when the user turns device alerts off, so the app doesn't quietly turn them back on. */
const OPTED_OUT_KEY = 'crm-push-opted-out'

export type PushState =
  /** This browser can't do Web Push (or, on iPhone, the CRM isn't installed to the Home Screen yet). */
  | 'unsupported'
  /** The server has no VAPID keys configured. */
  | 'unavailable'
  /** The user blocked notifications for this site. */
  | 'denied'
  | 'off'
  | 'on'

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** iPhone/iPad Safari only offers push to a site installed to the Home Screen. */
export function needsHomeScreenInstall(): boolean {
  if (typeof window === 'undefined') return false
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone
  return ios && !standalone
}

function readOptOut(): boolean {
  try {
    return localStorage.getItem(OPTED_OUT_KEY) === '1'
  } catch {
    return false
  }
}

function writeOptOut(optedOut: boolean) {
  try {
    if (optedOut) localStorage.setItem(OPTED_OUT_KEY, '1')
    else localStorage.removeItem(OPTED_OUT_KEY)
  } catch {
    // Storage blocked — the preference just won't be remembered.
  }
}

function base64UrlToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

function sameKey(current: ArrayBuffer | null, publicKey: string): boolean {
  if (!current) return false
  const a = new Uint8Array(current)
  const b = base64UrlToBytes(publicKey)
  return a.length === b.length && a.every((v, i) => v === b[i])
}

async function registration(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register(SW_URL)
  return navigator.serviceWorker.ready
}

async function existingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration(SW_URL)
  return (await reg?.pushManager.getSubscription()) ?? null
}

export async function getPushState(): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission === 'granted' && !readOptOut() && (await existingSubscription())) return 'on'
  return 'off'
}

/**
 * Subscribes this browser and registers it to the signed-in user.
 * `prompt: false` only proceeds when permission was already granted (for the
 * silent re-sync on app load); otherwise it asks for permission, so call it
 * from a click.
 */
export async function enablePush({ prompt }: { prompt: boolean }): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported'

  const { publicKey } = await notificationsApi.pushPublicKey()
  if (!publicKey) return 'unavailable'

  const permission = prompt ? await Notification.requestPermission() : Notification.permission
  if (permission === 'denied') return 'denied'
  if (permission !== 'granted') return 'off'

  const reg = await registration()
  let subscription = await reg.pushManager.getSubscription()
  // Subscribed with an older server key — those pushes would be rejected.
  if (subscription && !sameKey(subscription.options.applicationServerKey, publicKey)) {
    await subscription.unsubscribe()
    subscription = null
  }
  subscription ??= await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToBytes(publicKey),
  })

  const json = subscription.toJSON()
  await notificationsApi.pushSubscribe({
    endpoint: subscription.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' },
  })
  writeOptOut(false)
  return 'on'
}

/** Turns device alerts off for this browser — and remembers that, so they stay off. */
export async function disablePush(): Promise<PushState> {
  writeOptOut(true)
  await detachDevice()
  return 'off'
}

/**
 * On app load: keeps this device registered to whoever is signed in, if
 * they've allowed notifications and haven't turned device alerts off.
 */
export async function resyncPush(): Promise<void> {
  if (!isPushSupported() || Notification.permission !== 'granted' || readOptOut()) return
  await enablePush({ prompt: false })
}

/**
 * On logout: stops this device receiving the user's notifications. Needs the
 * session still valid, so call it before clearing it. Device alerts come
 * back on automatically at the next sign-in (permission is kept).
 */
export async function detachDevice(): Promise<void> {
  const subscription = await existingSubscription()
  if (!subscription) return
  await notificationsApi.pushUnsubscribe(subscription.endpoint).catch(() => undefined)
  await subscription.unsubscribe().catch(() => undefined)
}

/** Whether the user hasn't decided yet — used to offer device alerts once. */
export function shouldOfferPush(): boolean {
  return isPushSupported() && Notification.permission === 'default' && !readOptOut()
}
