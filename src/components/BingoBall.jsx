import { BALL_COLORS, letterFor } from '../lib/bingo'

/** A glossy bingo ball: column colour, white disc with letter + number. */
export default function BingoBall({ number, size = 64, className = '' }) {
  const color = BALL_COLORS[letterFor(number)]
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 32% 28%, #fff 0%, ${color} 28%, ${color} 60%, rgb(0 0 0 / 0.55) 100%)`,
        boxShadow: `0 ${size * 0.08}px ${size * 0.2}px rgb(0 0 0 / 0.45)`,
      }}
    >
      <div
        className="rounded-full bg-white text-stage flex flex-col items-center justify-center leading-none font-extrabold"
        style={{ width: size * 0.6, height: size * 0.6 }}
      >
        <span style={{ fontSize: size * 0.12 }}>{letterFor(number)}</span>
        <span style={{ fontSize: size * 0.26 }} className="tabular-nums">
          {number}
        </span>
      </div>
    </div>
  )
}
