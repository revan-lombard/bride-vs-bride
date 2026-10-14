import { useConnectionPhase } from '../hooks/useConnectionPhase'

/**
 * Phones: blocks the pad while the connection is down so nobody hammers a
 * dead buzzer. Firebase reconnects (and resyncs) on its own.
 */
export function ReconnectOverlay({ connected }) {
  const phase = useConnectionPhase(connected)

  if (phase === 'back') {
    return (
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 rounded-full bg-green-600 px-4 py-2 font-bold shadow-xl animate-card-reveal">
        ✅ Back online
      </div>
    )
  }
  if (phase === 'ok') return null

  return (
    <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-6xl animate-buzz-pulse rounded-full">📶</div>
      <h2 className="text-2xl font-bold">Reconnecting…</h2>
      {phase === 'stuck' ? (
        <>
          <p className="text-white/70">Still trying. Check you're on the Wi-Fi (or mobile data is on).</p>
          <button
            onClick={() => location.reload()}
            className="rounded-xl bg-white text-stage font-bold px-6 py-3"
          >
            🔄 Refresh
          </button>
          <p className="text-xs text-white/50">You won't lose your team or your bingo card.</p>
        </>
      ) : (
        <p className="text-white/70">Hold tight — you'll be back in a moment.</p>
      )}
    </div>
  )
}

/** TV and host: a small, non-blocking warning pill. */
export function OfflinePill({ connected, label = 'Offline' }) {
  const phase = useConnectionPhase(connected)
  if (phase === 'ok') return null
  if (phase === 'back') {
    return (
      <div className="fixed bottom-4 left-4 z-50 rounded-full bg-green-600 px-4 py-2 font-bold">✅ Back online</div>
    )
  }
  return (
    <div className="fixed bottom-4 left-4 z-50 rounded-full bg-red-600 px-4 py-2 font-bold animate-buzz-pulse">
      ⚠️ {label} — reconnecting…
    </div>
  )
}
