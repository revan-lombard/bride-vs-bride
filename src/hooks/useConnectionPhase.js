import { useEffect, useState } from 'react'

/**
 * 'ok' | 'down' (offline > 1.5s) | 'stuck' (offline > 12s) | 'back'
 * (just reconnected — shown briefly). The grace period hides blips and
 * the normal first connect.
 */
export function useConnectionPhase(connected) {
  const [phase, setPhase] = useState('ok')

  useEffect(() => {
    if (connected) {
      const t1 = setTimeout(() => setPhase((p) => (p === 'down' || p === 'stuck' ? 'back' : 'ok')), 0)
      const t2 = setTimeout(() => setPhase('ok'), 1800)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
    const t1 = setTimeout(() => setPhase('down'), 1500)
    const t2 = setTimeout(() => setPhase('stuck'), 12000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [connected])

  return phase
}
