/**
 * Service worker: keeps the app shell (HTML, JS, CSS, icons) on the device
 * so the app still opens when the venue Wi-Fi blips. Game data itself goes
 * over Firebase's own connection, which reconnects and resyncs by itself —
 * this only makes sure there's an app to reconnect *from*.
 *
 *  - Page loads: network first (always get the latest deploy), cached copy
 *    when offline.
 *  - /assets/*: cache first — filenames are content-hashed, so a cached
 *    file is never stale.
 *  - Anything not on this origin (Firebase, fonts…) is left alone.
 */
const CACHE = 'bvb-shell-v1'
const SHELL = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await cache.addAll(SHELL)
      // Pre-cache the hashed bundles the current index.html points at, so
      // the very first visit is already offline-ready.
      const html = await (await fetch('./', { cache: 'no-store' })).text()
      const assets = [...html.matchAll(/(?:src|href)="([^"]*assets\/[^"]+)"/g)].map((m) => m[1])
      await cache.addAll(assets)
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('./', copy))
          return res
        })
        .catch(async () => (await caches.match('./')) || Response.error())
    )
    return
  }

  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(CACHE).then((c) => c.put(request, copy))
            }
            return res
          })
      )
    )
    return
  }

  // Icons, manifest, etc.: cached copy if we have one, refreshed in the background.
  event.respondWith(
    caches.match(request).then((hit) => {
      const fresh = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
        .catch(() => hit)
      return hit || fresh
    })
  )
})
