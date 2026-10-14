import { useEffect, useRef, useState } from 'react'
import { onValue } from 'firebase/database'
import { TEAMS } from '../lib/schema'
import { serverNow } from '../lib/serverTime'
import {
  CHEER_POINTS,
  CHEER_SECONDS,
  CHEER_TOP_POINTS,
  MAX_TAPS_PER_SEC,
  SETTLE_MS,
  cheerPhase,
  ropePosition,
  tallyCheer,
} from '../lib/cheer'
import { cheerTapsRef, finishCheer, resetCheer, sendCheerTaps, startCheer } from '../lib/gameActions'
import { playCue, vibrate } from '../lib/sounds'

/** Re-render every `ms` and return the shared server "now". */
function useServerClock(ms = 100) {
  const [now, setNow] = useState(serverNow)
  useEffect(() => {
    const t = setInterval(() => setNow(serverNow()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

/** Live tap slots for a round (TV + host). */
function useCheerTaps(roundId) {
  const [taps, setTaps] = useState({})
  useEffect(() => {
    if (!roundId) return
    return onValue(cheerTapsRef(roundId), (snap) => setTaps(snap.val() || {}))
  }, [roundId])
  return roundId ? taps : {}
}

/** Host or TV: score the round once the clock (plus a grace period) runs out. */
function useAutoFinish(cheerState, now) {
  const fired = useRef('')
  useEffect(() => {
    const { phase, roundId, endsAt } = cheerState || {}
    if (phase !== 'running' || !endsAt || now < endsAt + SETTLE_MS || fired.current === roundId) return
    fired.current = roundId
    finishCheer(roundId)
  }, [cheerState, now])
}

const secondsLeft = (until, now) => Math.max(Math.ceil((until - now) / 1000), 0)

/* ------------------------------------------------------------------ */
/* Phone                                                               */
/* ------------------------------------------------------------------ */

export function CheerPad({ player, cheerState }) {
  const now = useServerClock(100)
  const phase = cheerPhase(cheerState, now)
  const roundId = cheerState?.roundId
  const [round, setRound] = useState({ id: roundId, taps: 0 }) // taps reset per round
  const taps = round.id === roundId ? round.taps : 0
  const recent = useRef([]) // tap times in the last second, for the rate cap
  const count = useRef({ id: '', taps: 0 }) // source of truth, read by the flusher
  const sent = useRef({ id: '', taps: -1 })
  const sending = phase === 'live' || phase === 'counting'

  // Batch: send the count 4×/second while live (and through the grace
  // period), not on every tap — 40 phones × 15 taps/s would be a lot.
  useEffect(() => {
    if (!roundId || !sending) return
    const flush = () => {
      const n = count.current.id === roundId ? count.current.taps : 0
      if (sent.current.id === roundId && sent.current.taps === n) return
      sent.current = { id: roundId, taps: n }
      sendCheerTaps(player, roundId, n)
    }
    const t = setInterval(flush, 250)
    return () => {
      clearInterval(t)
      flush()
    }
  }, [sending, roundId, player])

  const tap = (e) => {
    e.preventDefault()
    if (phase !== 'live') return
    const t = performance.now()
    recent.current = recent.current.filter((x) => t - x < 1000)
    if (recent.current.length >= MAX_TAPS_PER_SEC) return
    recent.current.push(t)
    vibrate(8)
    const n = (count.current.id === roundId ? count.current.taps : 0) + 1
    count.current = { id: roundId, taps: n }
    setRound({ id: roundId, taps: n })
  }

  const color = player.team === 'teamA' ? 'bg-bride-a' : 'bg-bride-b'
  const result = cheerState?.result

  if (phase === 'idle') {
    return (
      <div className="text-center space-y-4">
        <div className="text-7xl">🪢</div>
        <h2 className="text-3xl font-extrabold">Cheer-off!</h2>
        <p className="text-white/70">When it starts, tap as fast as you can for {CHEER_SECONDS} seconds.</p>
        <p className="text-white/70">Pull the rope to {TEAMS[player.team].label}! 💪</p>
      </div>
    )
  }

  if (phase === 'countdown') {
    const n = secondsLeft(cheerState.startsAt, now)
    return (
      <div className="text-center space-y-4">
        <p className="text-xl text-white/70">Get your thumbs ready…</p>
        <div key={n} className="text-9xl font-extrabold animate-strike-flash">{n || 'GO'}</div>
      </div>
    )
  }

  if (phase === 'live') {
    return (
      <button
        onPointerDown={tap}
        onContextMenu={(e) => e.preventDefault()}
        className={`${color} w-full flex-1 min-h-[60vh] rounded-3xl flex flex-col items-center justify-center gap-2 select-none touch-manipulation active:brightness-125`}
      >
        <span key={taps} className="text-8xl font-extrabold tabular-nums animate-react-tap">{taps}</span>
        <span className="text-3xl font-extrabold">TAP! TAP! TAP!</span>
        <span className="text-lg text-white/80">{secondsLeft(cheerState.endsAt, now)}s left</span>
      </button>
    )
  }

  // counting / done
  const won = result && result.winner === player.team
  return (
    <div className="text-center space-y-4">
      <div className="text-7xl">{!result ? '⏱' : result.winner === 'tie' ? '🤝' : won ? '🏆' : '😤'}</div>
      <h2 className="text-3xl font-extrabold">
        {!result ? "Time! Counting…" : result.winner === 'tie' ? "It's a tie!" : won ? 'Your team won!' : 'So close!'}
      </h2>
      <p className="text-xl">You tapped <b>{taps}</b> times</p>
      {result?.top?.playerId === player.id && (
        <p className="text-yellow-300 font-bold">🔥 Top tapper in the room! +{CHEER_TOP_POINTS} MVP points</p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* TV                                                                  */
/* ------------------------------------------------------------------ */

export function CheerDisplay({ cheerState }) {
  const now = useServerClock(100)
  const phase = cheerPhase(cheerState, now)
  const taps = useCheerTaps(cheerState?.roundId)
  useAutoFinish(cheerState, now)
  const live = tallyCheer(taps)
  const shown = cheerState?.result || live
  const pos = phase === 'idle' ? 50 : ropePosition(shown)

  // Sounds: tick on each countdown second, horn at GO and at the buzzer,
  // a quiet blip as the tap totals climb.
  const last = useRef({ phase, n: null, blipAt: 0 })
  const total = live.teamA.taps + live.teamB.taps
  const n = phase === 'countdown' ? secondsLeft(cheerState.startsAt, now) : null
  useEffect(() => {
    const prev = last.current
    if (n !== null && prev.n !== null && n !== prev.n) playCue('tick')
    if (phase !== prev.phase && (phase === 'live' || (phase === 'counting' && prev.phase === 'live'))) playCue('timesUp')
    let blipAt = phase === 'live' ? prev.blipAt : total
    if (phase === 'live' && total >= prev.blipAt + 5) {
      playCue('react')
      blipAt = total
    }
    last.current = { phase, n, blipAt }
  }, [phase, n, total])

  const result = cheerState?.result
  const winnerTeam = result && result.winner !== 'tie' ? TEAMS[result.winner] : null

  return (
    <div className="w-full max-w-6xl text-center space-y-10">
      <h2 className="text-5xl font-extrabold">🪢 Cheer-off!</h2>

      <div className="h-28 flex items-center justify-center">
        {phase === 'idle' && <p className="text-3xl text-white/70">Tap your phone as fast as you can — pull the rope to your side!</p>}
        {phase === 'countdown' && (
          <span key={secondsLeft(cheerState.startsAt, now)} className="text-9xl font-extrabold animate-strike-flash">
            {secondsLeft(cheerState.startsAt, now) || 'CHEER!'}
          </span>
        )}
        {phase === 'live' && (
          <span className="text-8xl font-extrabold tabular-nums animate-text-pulse">⏱ {secondsLeft(cheerState.endsAt, now)}</span>
        )}
        {phase === 'counting' && <span className="text-6xl font-extrabold">⏰ Time! Counting…</span>}
        {phase === 'done' && (
          <span className="text-6xl font-extrabold animate-card-reveal">
            {winnerTeam ? `🏆 ${winnerTeam.label} wins! +${CHEER_POINTS}` : `🤝 Tie! +${CHEER_POINTS / 2} each`}
          </span>
        )}
      </div>

      {/* The rope */}
      <div className="relative h-24">
        <div className="absolute inset-y-8 left-0 right-0 rounded-full overflow-hidden flex">
          <div className="bg-bride-a h-full transition-all duration-300 ease-out" style={{ width: `${pos}%` }} />
          <div className="bg-bride-b h-full flex-1" />
        </div>
        <div className="absolute inset-y-0 left-1/2 w-1 bg-white/40 -translate-x-1/2" />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl transition-all duration-300 ease-out drop-shadow-lg"
          style={{ left: `${pos}%` }}
        >
          💍
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10 text-3xl">
        {['teamA', 'teamB'].map((t) => (
          <div key={t} className={`rounded-2xl py-4 ${t === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'}`}>
            <div className="font-bold">{TEAMS[t].label}</div>
            <div className="text-6xl font-extrabold tabular-nums">{shown[t].taps}</div>
            <div className="text-xl text-white/70">
              taps · {shown[t].avg} per player ({shown[t].tappers})
            </div>
          </div>
        ))}
      </div>

      {phase === 'done' && result?.top && (
        <p className="text-4xl font-bold text-yellow-300 animate-card-reveal">
          🔥 Top tapper: {result.top.userName} — {result.top.taps} taps!
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Host                                                                */
/* ------------------------------------------------------------------ */

export function CheerControls({ cheerState }) {
  const now = useServerClock(250)
  const phase = cheerPhase(cheerState, now)
  const taps = useCheerTaps(cheerState?.roundId)
  useAutoFinish(cheerState, now)
  const live = cheerState?.result || tallyCheer(taps)
  const busy = phase === 'countdown' || phase === 'live' || phase === 'counting'

  return (
    <div className="space-y-2">
      <button
        onClick={startCheer}
        disabled={busy}
        className="w-full rounded-lg bg-green-700 py-4 text-lg font-bold disabled:opacity-40"
      >
        {phase === 'done' ? '🔁 Go again' : busy ? '🪢 In progress…' : `🪢 Start (${CHEER_SECONDS}s, winner +${CHEER_POINTS})`}
      </button>
      <div className="bg-white/10 rounded-lg p-3 text-sm space-y-1">
        <p>
          {phase === 'idle' && 'Phones show the rules. Tap Start for a 3-second countdown.'}
          {phase === 'countdown' && `Starting in ${secondsLeft(cheerState.startsAt, now)}…`}
          {phase === 'live' && `LIVE — ${secondsLeft(cheerState.endsAt, now)}s left`}
          {phase === 'counting' && 'Counting the last taps…'}
          {phase === 'done' &&
            (cheerState.result?.winner === 'tie'
              ? 'Tie — points split.'
              : `${TEAMS[cheerState.result?.winner]?.label} won — points added automatically.`)}
        </p>
        {phase !== 'idle' && (
          <p className="text-white/60">
            {TEAMS.teamA.label} {live.teamA.taps} taps ({live.teamA.avg}/player) · {TEAMS.teamB.label}{' '}
            {live.teamB.taps} ({live.teamB.avg}/player)
          </p>
        )}
      </div>
      {phase === 'counting' && now > cheerState.endsAt + SETTLE_MS * 3 && (
        <button onClick={() => finishCheer(cheerState.roundId)} className="w-full rounded-lg bg-white/15 py-2 text-sm font-bold">
          Finish now
        </button>
      )}
      {phase === 'done' && (
        <button onClick={resetCheer} className="w-full rounded-lg bg-white/15 py-2 text-sm">
          Back to the rules screen
        </button>
      )}
    </div>
  )
}
