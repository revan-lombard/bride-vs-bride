import { useEffect, useRef } from 'react'
import { TEAMS } from '../lib/schema'
import {
  BINGO_LETTERS,
  BINGO_MAX,
  BALL_COLORS,
  PATTERNS,
  FREE,
  ballLabel,
  callFor,
  makeCard,
  isGiftMode,
  giftWord,
  GIFT_COUNT,
} from '../lib/bingo'
import { useBingoDraw } from '../hooks/useBingoDraw'
import { playCue } from '../lib/sounds'
import BingoBall from './BingoBall'
import Confetti from './Confetti'

/**
 * Bridal Bingo on the TV: a tumbler that spins and drops each ball, the
 * big current ball with its call, the called-numbers board, and a full
 * celebration when a phone claims BINGO.
 */
export default function BingoDisplay({ bingoState }) {
  return isGiftMode(bingoState) ? (
    <GiftBingoScreen bingoState={bingoState} />
  ) : (
    <NumberBingoScreen bingoState={bingoState} />
  )
}

function NumberBingoScreen({ bingoState }) {
  const { seed, drawn = [], pattern = 'line', winner } = bingoState || {}
  const { spinning, visible, current } = useBingoDraw(bingoState)
  const wasSpinning = useRef(false)

  // Rattle while the cage spins, pop when the ball comes out.
  useEffect(() => {
    if (spinning && !wasSpinning.current) playCue('tumble')
    if (!spinning && wasSpinning.current) playCue('pop')
    wasSpinning.current = spinning
  }, [spinning])

  const called = new Set(visible)
  const recent = visible.slice(-6, -1).reverse()
  const remaining = BINGO_MAX - drawn.length
  const pat = PATTERNS[pattern] || PATTERNS.line

  return (
    <div className="w-full h-full max-w-7xl flex flex-col gap-6">
      <div className="flex-1 min-h-0 grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,0.6fr)] items-center gap-8">
        <Tumbler spinning={spinning} ballsLeft={remaining + (spinning ? 1 : 0)} />

        <div className="text-center space-y-4">
          <h2 className="text-4xl font-extrabold">🎱 Bridal Bingo</h2>
          <p className="text-2xl text-white/70">
            Playing for <b className="text-white">{pat.label}</b> · {pat.points} pts
          </p>
          <div className="h-72 flex items-center justify-center">
            {!seed ? (
              <p className="text-3xl text-white/60">Dealing the cards… 🃏</p>
            ) : spinning ? (
              <p className="text-5xl font-extrabold animate-text-pulse">Mixing… 🌀</p>
            ) : current ? (
              <div key={current} className="animate-ball-pop">
                <BingoBall number={current} size={260} />
              </div>
            ) : (
              <p className="text-3xl text-white/60">Check your card on your phone 📱</p>
            )}
          </div>
          <p className="h-10 text-3xl font-bold text-white/80">
            {!spinning && current
              ? `${ballLabel(current)}${callFor(current) ? ` — “${callFor(current)}”` : ''}`
              : ''}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-lg uppercase tracking-widest text-white/50">Last balls</p>
          {recent.map((n, i) => (
            <BingoBall key={n} number={n} size={72 - i * 6} className={i ? 'opacity-70' : ''} />
          ))}
          <p className="text-xl text-white/60 tabular-nums pt-2">
            Ball {visible.length} / {BINGO_MAX}
          </p>
        </div>
      </div>

      <CalledBoard called={called} latest={spinning ? null : current} />

      {winner && <WinnerOverlay winner={winner} seed={winner.seed || seed} />}
    </div>
  )
}

const GIFT_SHADES = Object.values(BALL_COLORS)

/**
 * Gift Bingo on the TV: the gift just opened, big, and every gift word on
 * the board lighting up as the bride unwraps them.
 */
function GiftBingoScreen({ bingoState }) {
  const { seed, drawn = [], pattern = 'line', winner } = bingoState || {}
  const opened = new Set(drawn)
  const current = drawn[drawn.length - 1]
  const pat = PATTERNS[pattern] || PATTERNS.line
  const count = useRef(drawn.length)

  // Chime for each newly opened gift (not for undos or the state at load).
  useEffect(() => {
    if (drawn.length > count.current) playCue('gift')
    count.current = drawn.length
  }, [drawn.length])

  return (
    <div className="w-full h-full max-w-7xl flex flex-col gap-6">
      <div className="flex items-center justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-5xl font-extrabold">🎁 Gift Bingo</h2>
          <p className="text-2xl text-white/70">
            Playing for <b className="text-white">{pat.label}</b> · {pat.points} pts
          </p>
          <p className="text-xl text-white/50">
            Opened {drawn.length} / {GIFT_COUNT}
          </p>
        </div>
        <div className="flex-1 h-56 flex items-center justify-center">
          {!seed ? (
            <p className="text-3xl text-white/60">Dealing the cards… 🃏</p>
          ) : current ? (
            <div key={current} className="flex items-center gap-6 animate-ball-pop">
              <span className="text-9xl">🎁</span>
              <div>
                <p className="text-2xl uppercase tracking-widest text-white/60">Just opened</p>
                <p className="text-7xl font-extrabold text-yellow-300">{giftWord(current)}</p>
              </div>
            </div>
          ) : (
            <p className="text-3xl text-white/60">Mark the gifts on your phone as they're opened 📱</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 content-start">
        {Array.from({ length: GIFT_COUNT }, (_, i) => {
          const n = i + 1
          const on = opened.has(n)
          return (
            <span
              key={n}
              className={`rounded-lg px-2 py-2 text-center text-xl font-bold truncate transition-colors duration-500 ${
                on ? 'text-stage' : 'bg-white/5 text-white/30'
              } ${n === current ? 'animate-glow' : ''}`}
              style={on ? { backgroundColor: GIFT_SHADES[i % 5] } : undefined}
            >
              {giftWord(n)}
            </span>
          )
        })}
      </div>

      {winner && <WinnerOverlay winner={winner} seed={winner.seed || seed} mode="gifts" />}
    </div>
  )
}

/** All 75 numbers in B-R-I-D-E rows; called ones light up in their colour. */
function CalledBoard({ called, latest }) {
  return (
    <div className="space-y-1.5">
      {BINGO_LETTERS.map((letter, row) => (
        <div key={letter} className="flex gap-1.5 items-center">
          <span
            className="w-10 text-center text-2xl font-extrabold"
            style={{ color: BALL_COLORS[letter] }}
          >
            {letter}
          </span>
          {Array.from({ length: 15 }, (_, i) => {
            const n = row * 15 + i + 1
            const on = called.has(n)
            return (
              <span
                key={n}
                className={`flex-1 rounded-md py-1 text-center text-xl font-bold tabular-nums transition-colors duration-500 ${
                  on ? 'text-stage' : 'bg-white/5 text-white/25'
                } ${n === latest ? 'animate-glow' : ''}`}
                style={on ? { backgroundColor: BALL_COLORS[letter] } : undefined}
              >
                {n}
              </span>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/* ---------------- The tumbler ---------------- */

const CX = 200
const CY = 170
const R = 140
const BALL_R = 13

// Scattered positions while spinning (sunflower spiral fills the drum)…
const SCATTER = Array.from({ length: 30 }, (_, i) => {
  const a = i * 2.39996
  const d = Math.sqrt((i + 0.5) / 30) * (R - 24)
  return [CX + Math.cos(a) * d, CY + Math.sin(a) * d]
})

// …and settled in a pile at the bottom while idle.
const PILE = (() => {
  const spots = []
  for (let row = 0; spots.length < 30; row++) {
    const y = CY + R - 20 - row * 23
    const half = Math.sqrt(R * R - (y - CY) ** 2) - 20
    for (let x = CX - half + (row % 2) * 12; x <= CX + half && spots.length < 30; x += 27) {
      spots.push([x, y])
    }
  }
  return spots
})()

const BALL_SHADES = Object.values(BALL_COLORS)

function Tumbler({ spinning, ballsLeft }) {
  const shown = Math.min(ballsLeft, 30)
  return (
    <svg viewBox="0 0 420 440" className="w-full max-h-[26rem]" aria-label="Bingo tumbler">
      <defs>
        <radialGradient id="drum" cx="40%" cy="35%">
          <stop offset="0%" stopColor="rgb(255 255 255 / 0.18)" />
          <stop offset="100%" stopColor="rgb(255 255 255 / 0.03)" />
        </radialGradient>
        <clipPath id="drum-clip">
          <circle cx={CX} cy={CY} r={R - 6} />
        </clipPath>
      </defs>

      {/* stand */}
      <path d={`M${CX} ${CY} L110 410 M${CX} ${CY} L290 410`} stroke="#b45309" strokeWidth="12" strokeLinecap="round" />
      <rect x="70" y="404" width="260" height="16" rx="8" fill="#92400e" />

      {/* chute out to the right */}
      <path
        d={`M${CX + R * 0.8} ${CY + R * 0.55} L 385 ${CY + R + 10} L 400 ${CY + R + 10}`}
        stroke="#fbbf24"
        strokeWidth="34"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d={`M${CX + R * 0.8} ${CY + R * 0.55} L 385 ${CY + R + 10} L 400 ${CY + R + 10}`}
        stroke="#1e1b4b"
        strokeWidth="22"
        fill="none"
        strokeLinecap="round"
      />

      {/* drum glass */}
      <circle cx={CX} cy={CY} r={R} fill="url(#drum)" />

      {/* balls */}
      <g clipPath="url(#drum-clip)">
        {Array.from({ length: shown }, (_, i) => {
          const [x, y] = (spinning ? SCATTER : PILE)[i]
          return (
            <g
              key={i}
              style={{ transform: `translate(${x}px, ${y}px)`, transition: 'transform 0.45s ease-out' }}
            >
              <g
                className={spinning ? 'animate-ball-jiggle' : ''}
                style={{ animationDelay: `${-(i % 7) * 0.05}s`, animationDuration: `${0.25 + (i % 5) * 0.05}s` }}
              >
                <circle r={BALL_R} fill={BALL_SHADES[i % 5]} />
                <circle r={BALL_R * 0.5} fill="white" opacity="0.9" />
                <circle cx={-4} cy={-5} r={3} fill="white" opacity="0.6" />
              </g>
            </g>
          )
        })}
      </g>

      {/* rotating wire cage + crank */}
      <g className={spinning ? 'animate-cage-spin' : 'animate-cage-idle'}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#fbbf24" strokeWidth="6" />
        {[0, 30, 60, 90, 120, 150].map((deg) => (
          <ellipse
            key={deg}
            cx={CX}
            cy={CY}
            rx={R}
            ry={R * 0.28}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity="0.55"
            transform={`rotate(${deg} ${CX} ${CY})`}
          />
        ))}
        <line x1={CX} y1={CY} x2={CX + 70} y2={CY - 70} stroke="#fde68a" strokeWidth="6" strokeLinecap="round" />
        <circle cx={CX + 70} cy={CY - 70} r="10" fill="#f472b6" />
      </g>
      <circle cx={CX} cy={CY} r="14" fill="#fde68a" stroke="#b45309" strokeWidth="4" />
    </svg>
  )
}

/* ---------------- BINGO! ---------------- */

function WinnerOverlay({ winner, seed, mode = 'numbers' }) {
  const gifts = mode === 'gifts'
  const card = makeCard(winner.playerId, seed, mode)
  const cell = gifts ? 'w-28 h-20 text-base leading-tight px-1' : 'w-16 h-16 text-2xl'
  const winCells = new Set(winner.cells || [])
  const teamColor = winner.team === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'

  return (
    <div className={`absolute inset-0 ${teamColor} rounded-3xl flex items-center justify-center gap-16 animate-card-reveal z-10`}>
      <Confetti />
      <div className="text-center space-y-4">
        <div className="text-9xl font-extrabold tracking-wider animate-text-pulse">BINGO!</div>
        <div className="text-7xl font-extrabold">{winner.userName}</div>
        <div className="text-3xl text-white/80">{TEAMS[winner.team]?.label}</div>
        <div className="text-4xl font-bold text-yellow-300">
          {PATTERNS[winner.pattern]?.label} · +{winner.points} points 🎉
        </div>
      </div>
      <div className="bg-white/10 rounded-2xl p-4">
        <div className="grid grid-cols-5 gap-2">
          {BINGO_LETTERS.map((l) => (
            <div key={l} className={`${gifts ? 'w-28' : 'w-16'} text-center text-3xl font-extrabold`} style={{ color: BALL_COLORS[l] }}>
              {l}
            </div>
          ))}
          {card.map((n, i) => (
            <div
              key={i}
              className={`${cell} rounded-lg flex items-center justify-center text-center font-extrabold ${
                winCells.has(i) ? 'bg-yellow-300 text-stage' : 'bg-white/10 text-white/60'
              }`}
            >
              {n === FREE ? '💍' : gifts ? giftWord(n) : n}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
