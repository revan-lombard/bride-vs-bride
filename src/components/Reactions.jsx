import { useEffect, useRef, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '../lib/firebase'
import { GAME_ROOT } from '../lib/mode'
import { sendReaction } from '../lib/gameActions'
import { playCue, vibrate } from '../lib/sounds'

const REACTION_EMOJIS = ['😂', '❤️', '🎉', '👏', '😱', '🔥', '💍', '🥂']
const COOLDOWN_MS = 600
const MAX_ON_SCREEN = 50

/** Phone: a row of emoji buttons along the bottom. Lightly rate-limited. */
export function ReactionBar({ player }) {
  const last = useRef(0)
  const [tapped, setTapped] = useState(null) // { emoji, id } for the bounce

  const react = (emoji) => {
    const now = Date.now()
    if (now - last.current < COOLDOWN_MS) return
    last.current = now
    setTapped({ emoji, id: now })
    vibrate(10)
    sendReaction(player, emoji)
  }

  return (
    <div className="flex px-1 py-2 bg-black/20 border-t border-white/10">
      {REACTION_EMOJIS.map((e) => (
        <button
          key={tapped?.emoji === e ? `${e}-${tapped.id}` : e}
          onClick={() => react(e)}
          className={`flex-1 min-w-0 text-[clamp(1.25rem,7vw,1.875rem)] select-none ${tapped?.emoji === e ? 'animate-react-tap' : ''}`}
          aria-label={`React ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  )
}

/**
 * TV: watches every guest's reaction slot and floats each new one up the
 * screen — Team A's from the left half, Team B's from the right.
 */
export function ReactionLayer() {
  const [floaters, setFloaters] = useState([])
  const seen = useRef(null) // { [playerId]: n } — null until the first snapshot
  const lastSound = useRef(0)

  useEffect(() => {
    const unsub = onValue(ref(db, `reactions/${GAME_ROOT}`), (snap) => {
      const all = snap.val() || {}
      const first = seen.current === null
      const prev = seen.current || {}
      const fresh = []
      seen.current = {}
      for (const [id, r] of Object.entries(all)) {
        seen.current[id] = r?.n || 0
        if (!first && r?.emoji && (r.n || 0) > (prev[id] || 0)) fresh.push(r)
      }
      if (!fresh.length) return
      const now = Date.now()
      if (now - lastSound.current > 250) {
        lastSound.current = now
        playCue('react')
      }
      setFloaters((list) =>
        [
          ...list,
          ...fresh.map((r, i) => ({
            id: `${now}-${i}-${Math.random()}`,
            emoji: r.emoji,
            name: r.userName,
            left: (r.team === 'teamB' ? 55 : 5) + Math.random() * 40,
            born: now,
          })),
        ].slice(-MAX_ON_SCREEN)
      )
    })
    // Sweep out finished floaters.
    const sweep = setInterval(() => {
      const cutoff = Date.now() - 4200
      setFloaters((list) => (list.some((f) => f.born < cutoff) ? list.filter((f) => f.born >= cutoff) : list))
    }, 1000)
    return () => {
      unsub()
      clearInterval(sweep)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {floaters.map((f) => (
        <div
          key={f.id}
          className="absolute bottom-0 flex flex-col items-center animate-react-float"
          style={{ left: `${f.left}%` }}
        >
          <span className="text-7xl drop-shadow-lg">{f.emoji}</span>
          <span className="text-sm font-bold text-white/70 bg-black/30 rounded-full px-2">{f.name}</span>
        </div>
      ))}
    </div>
  )
}
