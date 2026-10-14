import { useEffect, useState } from 'react'
import { TUMBLE_MS } from '../lib/bingo'

/**
 * Holds a freshly drawn ball back for TUMBLE_MS so the TV can spin the
 * tumbler first — phones use the same delay so nobody sees the number
 * before the ball pops out on screen. Balls already drawn when the view
 * mounts show immediately.
 */
export function useBingoDraw(bingoState) {
  const seed = bingoState?.seed || ''
  const drawn = bingoState?.drawn || []
  const key = `${seed}:${drawn.length}`
  const [settled, setSettled] = useState(key)

  useEffect(() => {
    if (key === settled) return
    const t = setTimeout(() => setSettled(key), drawn.length > 0 ? TUMBLE_MS : 0)
    return () => clearTimeout(t)
  }, [key, settled, drawn.length])

  const spinning = key !== settled && drawn.length > 0
  const visible = spinning ? drawn.slice(0, -1) : drawn
  return {
    spinning,
    visible, // balls the audience has seen come out
    current: visible[visible.length - 1] ?? null,
  }
}
