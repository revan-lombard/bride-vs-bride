import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../lib/firebase'
import { GAME_ROOT } from '../lib/mode'
import { TEAMS } from '../lib/schema'
import { playCue } from '../lib/sounds'
import Confetti from './Confetti'

const MVP_TEASE_MS = 5000 // team result on its own first…
const MVP_REVEAL_MS = 7600 // …then "and your MVP is…", then the name

/**
 * End-of-show screen, revealed in three beats: the winning team, a
 * drumroll tease, then the MVP (most personal points) with the top three
 * and two fun awards — Fastest Finger (most buzz wins) and Hype Queen
 * (most emoji reactions sent).
 */
export default function WinnerDisplay({ scores, players }) {
  const [stage, setStage] = useState(0)
  const [reactionCounts, setReactionCounts] = useState({})

  const people = Object.entries(players || {})
    .map(([id, p]) => ({ id, ...p }))
    .filter((p) => p.userName && !p.kicked)
  const ranked = [...people].filter((p) => p.points > 0).sort((x, y) => y.points - x.points)
  const hasMvp = ranked.length > 0

  useEffect(() => {
    if (!hasMvp) return
    const t1 = setTimeout(() => {
      setStage(1)
      playCue('drumroll')
    }, MVP_TEASE_MS)
    const t2 = setTimeout(() => setStage(2), MVP_REVEAL_MS)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [hasMvp])

  useEffect(
    () =>
      onValue(ref(db, `reactions/${GAME_ROOT}`), (snap) => {
        const counts = {}
        Object.entries(snap.val() || {}).forEach(([id, r]) => (counts[id] = { n: r?.n || 0, name: r?.userName }))
        setReactionCounts(counts)
      }),
    []
  )

  const a = scores?.teamA ?? 0
  const b = scores?.teamB ?? 0
  const tie = a === b
  const winner = a >= b ? TEAMS.teamA : TEAMS.teamB

  const top = (list, key) => list.reduce((best, p) => ((p[key] || 0) > (best?.[key] || 0) ? p : best), null)
  const fastest = top(people, 'buzzes')
  const hypeId = Object.entries(reactionCounts).sort((x, y) => y[1].n - x[1].n)[0]
  const hype = hypeId && hypeId[1].n > 0 ? { name: people.find((p) => p.id === hypeId[0])?.userName || hypeId[1].name, n: hypeId[1].n } : null
  const mvp = ranked[0]

  return (
    <div className="w-full text-center space-y-8 relative">
      <Confetti />
      <div className={stage ? 'space-y-2' : 'space-y-6'}>
        <div className={stage ? 'text-5xl' : 'text-8xl'}>{tie ? '🤝' : '👑'}</div>
        <h1 className={`font-extrabold ${stage ? 'text-4xl' : 'text-6xl'}`}>{tie ? "It's a tie!" : `${winner.label} wins!`}</h1>
        <div className={`flex justify-center gap-12 font-bold ${stage ? 'text-xl' : 'text-3xl'}`}>
          {Object.values(TEAMS).map((t) => (
            <span key={t.id} className={t.id === 'teamA' ? 'text-bride-a' : 'text-bride-b'}>
              {t.label}: {scores?.[t.id] ?? 0}
            </span>
          ))}
        </div>
      </div>

      {stage === 1 && <p className="text-5xl font-extrabold animate-text-pulse">🥁 And your MVP is…</p>}

      {stage === 2 && mvp && (
        <div className="space-y-6">
          <div className="animate-splash-in space-y-2">
            <p className="text-2xl uppercase tracking-widest text-yellow-300">🌟 Most Valuable Guest 🌟</p>
            <p className="text-8xl font-extrabold">{mvp.userName}</p>
            <p className="text-3xl text-white/80">
              {TEAMS[mvp.team]?.label} · {mvp.points} points
            </p>
          </div>
          <div className="flex justify-center gap-6">
            {ranked.slice(1, 3).map((p, i) => (
              <span key={p.id} className="rounded-2xl bg-white/10 px-6 py-3 text-2xl animate-card-reveal">
                {i === 0 ? '🥈' : '🥉'} <b>{p.userName}</b> · {p.points}
              </span>
            ))}
          </div>
          <div className="flex justify-center gap-6 text-2xl">
            {fastest?.buzzes > 0 && (
              <span className="rounded-2xl bg-white/10 px-6 py-3 animate-card-reveal">
                ⚡ Fastest Finger: <b>{fastest.userName}</b> ({fastest.buzzes} buzz{fastest.buzzes === 1 ? '' : 'es'})
              </span>
            )}
            {hype && (
              <span className="rounded-2xl bg-white/10 px-6 py-3 animate-card-reveal">
                📣 Hype Queen: <b>{hype.name}</b> ({hype.n} reaction{hype.n === 1 ? '' : 's'})
              </span>
            )}
          </div>
        </div>
      )}

      {(!hasMvp || stage === 2) && <p className="text-2xl text-white/70">Thank you for playing! 🥂</p>}
    </div>
  )
}
