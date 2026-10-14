import { useEffect } from 'react'

/**
 * Keep the screen on while this view is open — a sleeping phone drops its
 * connection (and misses the buzz), and a sleeping host stops auto-draw.
 * The browser releases the lock whenever the tab is hidden, so it's
 * re-requested on return. Silently does nothing where unsupported.
 */
export function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let lock = null
    let cancelled = false
    const request = async () => {
      if (document.visibilityState !== 'visible' || lock) return
      try {
        lock = await navigator.wakeLock.request('screen')
        lock.addEventListener('release', () => (lock = null))
        if (cancelled) lock.release()
      } catch {
        // Not allowed right now (e.g. battery saver) — fine.
      }
    }
    request()
    document.addEventListener('visibilitychange', request)
    // Some browsers only grant it after a tap.
    document.addEventListener('pointerdown', request)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', request)
      document.removeEventListener('pointerdown', request)
      lock?.release()
    }
  }, [])
}
