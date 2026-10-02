/*
 * Service worker for device notifications (Web Push). The backend pushes a
 * small JSON payload — { title, body, url, tag, notificationId, unreadCount }
 * — for every in-app notification; this shows it in the phone's
 * notification bar / the desktop's notification centre, even when no CRM
 * tab is open, and opens the related page when it's tapped.
 *
 * It deliberately does no caching: the app is always loaded from the network.
 */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'New notification'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/badge-96.png',
    tag: data.tag,
    renotify: Boolean(data.tag),
    timestamp: Date.now(),
    data: { url: data.url || '/dashboard' },
  }

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, options)
      if (typeof data.unreadCount === 'number' && 'setAppBadge' in self.navigator) {
        try {
          await self.navigator.setAppBadge(data.unreadCount)
        } catch {
          // Badging isn't available everywhere — the notification itself is what matters.
        }
      }
      // Any open CRM tab refreshes its bell and lists straight away.
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of windows) client.postMessage({ type: 'push-received', notificationId: data.notificationId })
    })(),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/dashboard', self.location.origin)

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const open = windows.find((client) => new URL(client.url).origin === url.origin)
      if (open) {
        await open.focus()
        open.postMessage({ type: 'push-navigate', path: url.pathname + url.search })
        return
      }
      await self.clients.openWindow(url.href)
    })(),
  )
})
