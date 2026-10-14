import { useEffect, useRef, useState } from 'react'
import { MAX_STRIKES, TEAMS } from '../lib/schema'

/**
 * Family Feud on the TV, game-show style: a gold-framed blue board with
 * numbered tiles that flip to answer + points, a running round total, the
 * strike tally — and the giant red ✕ across the whole screen on a miss.
 */
export default function FeudDisplay({ feudState }) {
  const { question, answers = [], strikes = 0, lastGuess, options = [] } = feudState || {}
  const total = answers.filter((a) => a.revealed).reduce((s, a) => s + (a.points || 0), 0)
  const bigStrike = useBigStrike(strikes, question)
  // Two columns, filled down then across like the real board.
  const rows = Math.ceil(answers.length / 2)
  const columns = [answers.slice(0, rows), answers.slice(rows)]

  if (!question) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-7xl font-extrabold">📋 Family Feud</h2>
        <p className="text-3xl text-white/70">Survey says…</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl flex flex-col items-center gap-6">
      <div className="w-full rounded-2xl bg-gradient-to-b from-blue-600 to-blue-800 border-4 border-yellow-400 px-10 py-5 text-center shadow-2xl">
        <h2 className="text-5xl font-extrabold leading-tight">{question}</h2>
      </div>

      <div className="w-full rounded-3xl border-8 border-yellow-400 bg-blue-950 p-5 shadow-2xl grid grid-cols-2 gap-4">
        {columns.map((col, c) => (
          <div key={c} className="space-y-4">
            {col.map((a, i) => {
              const n = c * rows + i + 1
              return a.revealed ? (
                <div
                  key={n}
                  className="h-24 flex items-stretch rounded-xl overflow-hidden animate-card-reveal shadow-lg bg-gradient-to-b from-blue-500 to-blue-700 border-2 border-blue-300"
                >
                  <span className="flex-1 flex items-center px-6 text-4xl font-extrabold uppercase tracking-wide truncate">
                    {a.text}
                  </span>
                  <span className="w-28 flex items-center justify-center bg-blue-900 text-5xl font-extrabold tabular-nums border-l-2 border-blue-300">
                    {a.points}
                  </span>
                </div>
              ) : (
                <div
                  key={n}
                  className="h-24 rounded-xl bg-gradient-to-b from-blue-800 to-blue-900 border-2 border-blue-700 flex items-center justify-center"
                >
                  <span className="h-16 w-16 rounded-full bg-blue-600 border-4 border-blue-400 flex items-center justify-center text-4xl font-extrabold shadow-inner">
                    {n}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="w-full flex items-center justify-between">
        <div className="flex gap-3">
          {Array.from({ length: MAX_STRIKES }, (_, i) => (
            <span
              key={i}
              className={`h-20 w-20 rounded-xl border-4 flex items-center justify-center text-6xl font-extrabold ${
                strikes > i ? 'border-red-500 bg-red-600 text-white animate-strike-flash' : 'border-white/15 text-white/15'
              }`}
            >
              ✕
            </span>
          ))}
        </div>
        <div className="text-center">
          {lastGuess ? (
            <p className="text-3xl">
              <b>{lastGuess.userName}</b> ({TEAMS[lastGuess.team]?.label}): “{lastGuess.choice}”{' '}
              {lastGuess.correct ? '✅' : '❌'}
            </p>
          ) : (
            <p className="text-2xl text-white/60">📱 Buzz in, then pick from {options.length} answers on your phone</p>
          )}
        </div>
        <div className="rounded-xl border-4 border-yellow-400 bg-blue-900 px-6 py-2 text-center">
          <div className="text-sm uppercase tracking-widest text-yellow-300">Round total</div>
          <div className="text-5xl font-extrabold tabular-nums">{total}</div>
        </div>
      </div>

      {bigStrike > 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center gap-8 pointer-events-none bg-black/30">
          {Array.from({ length: bigStrike }, (_, i) => (
            <span
              key={i}
              className="text-[22rem] leading-none font-extrabold text-red-600 animate-strike-flash drop-shadow-[0_0_40px_rgba(220,38,38,0.8)]"
              style={{ WebkitTextStroke: '8px white' }}
            >
              ✕
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Shows N giant ✕ for 1.4s whenever the strike count goes up (same question). */
function useBigStrike(strikes, question) {
  const [show, setShow] = useState(0)
  const prev = useRef({ strikes, question })
  useEffect(() => {
    const p = prev.current
    prev.current = { strikes, question }
    if (question !== p.question || strikes <= p.strikes) {
      // New question (or strikes cleared): drop any ✕ still on screen.
      const t = setTimeout(() => setShow(0), 0)
      return () => clearTimeout(t)
    }
    const on = setTimeout(() => setShow(strikes), 0)
    const off = setTimeout(() => setShow(0), 1400)
    return () => {
      clearTimeout(on)
      clearTimeout(off)
    }
  }, [strikes, question])
  return show
}
