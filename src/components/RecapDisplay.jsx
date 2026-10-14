import { useEffect, useRef, useState } from 'react'
import { GAMES, GAME_TITLES, TEAMS } from '../lib/schema'
import { playCue } from '../lib/sounds'

export const RECAP_MS = 7000
const SPLASH_MS = 2200

/**
 * Everything that plays between games on the TV. A switch that carries a
 * fresh recap shows the recap first (what the round was worth, who leads,
 * star of the round, MVP so far, what's next) and then the next game's
 * title splash; a plain switch just shows the splash. A manual scoreboard
 * check shows the recap on its own. Nothing replays on page load.
 */
export default function GameTransition({ game, recap }) {
  const [view, setView] = useState(null) // { kind: 'recap'|'splash', recap?, game, id }
  const prevGame = useRef(game)
  const prevRecap = useRef(recap?.id)

  useEffect(() => {
    const gameChanged = prevGame.current !== game
    const freshRecap = recap?.id && recap.id !== prevRecap.current
    prevGame.current = game
    prevRecap.current = recap?.id
    if (!gameChanged && !freshRecap) return

    const timers = []
    const at = (ms, fn) => timers.push(setTimeout(fn, ms))
    if (freshRecap) {
      at(0, () => {
        setView({ kind: 'recap', recap, game, id: recap.id })
        playCue('fanfare')
      })
      if (gameChanged) at(RECAP_MS, () => setView({ kind: 'splash', game, id: `${recap.id}-s` }))
      at(RECAP_MS + (gameChanged ? SPLASH_MS : 0), () => setView(null))
    } else {
      at(0, () => setView({ kind: 'splash', game, id: Date.now() }))
      at(SPLASH_MS, () => setView(null))
    }
    return () => timers.forEach(clearTimeout)
  }, [game, recap])

  if (!view) return null
  if (view.kind === 'splash') {
    if (view.game === GAMES.LOBBY) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stage/85 backdrop-blur-sm pointer-events-none">
        <h1 key={view.id} className="text-9xl font-extrabold text-center animate-splash">
          {GAME_TITLES[view.game] || view.game}
        </h1>
      </div>
    )
  }
  return <RecapCard recap={view.recap} />
}

function RecapCard({ recap }) {
  const { fromGame, toGame, gained, scores, star, mvp } = recap
  const a = scores.teamA
  const b = scores.teamB
  const lead = a === b ? null : a > b ? 'teamA' : 'teamB'
  const by = Math.abs(a - b)
  const title = fromGame ? `${GAME_TITLES[fromGame] || fromGame} — recap` : '📊 Scoreboard check'
  const next = fromGame && toGame && toGame !== GAMES.LOBBY ? GAME_TITLES[toGame] : null

  return (
    <div className="fixed inset-0 z-50 bg-stage/95 backdrop-blur flex flex-col items-center justify-center gap-10 p-12 pointer-events-none">
      <h1 className="text-6xl font-extrabold animate-card-reveal">{title}</h1>

      <div className="grid grid-cols-2 gap-10 w-full max-w-5xl">
        {['teamA', 'teamB'].map((t, i) => (
          <div
            key={t}
            className={`rounded-3xl py-8 text-center animate-card-reveal ${t === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'} ${
              lead === t ? 'ring-8 ring-yellow-300' : ''
            }`}
            style={{ animationDelay: `${0.3 + i * 0.2}s` }}
          >
            <div className="text-3xl font-bold">
              {lead === t && '👑 '}
              {TEAMS[t].label}
            </div>
            {gained && (
              <div className={`text-7xl font-extrabold ${gained[t] > 0 ? 'text-yellow-300' : 'text-white/50'}`}>
                {gained[t] > 0 ? `+${gained[t]}` : gained[t]}
                <span className="text-2xl font-bold text-white/70"> this round</span>
              </div>
            )}
            <div className={gained ? 'text-3xl text-white/80 mt-2' : 'text-8xl font-extrabold'}>
              {gained ? `Total: ${scores[t]}` : scores[t]}
            </div>
          </div>
        ))}
      </div>

      <p className="text-5xl font-extrabold animate-card-reveal" style={{ animationDelay: '0.9s' }}>
        {lead ? `${TEAMS[lead].label} leads by ${by}!` : `🤝 All square at ${a}!`}
      </p>

      <div className="flex gap-8 text-3xl animate-card-reveal" style={{ animationDelay: '1.4s' }}>
        {star && (
          <span className="rounded-2xl bg-white/10 px-6 py-3">
            ⭐ Star of the round: <b>{star.userName}</b> +{star.points}
          </span>
        )}
        {mvp && (
          <span className="rounded-2xl bg-white/10 px-6 py-3">
            🌟 MVP so far: <b>{mvp.userName}</b> ({mvp.points})
          </span>
        )}
      </div>

      {next && (
        <p className="text-3xl text-white/60 animate-card-reveal" style={{ animationDelay: '2s' }}>
          Up next: {next}
        </p>
      )}
    </div>
  )
}
