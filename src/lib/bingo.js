/**
 * Bridal Bingo — 75-ball bingo with the columns spelled B-R-I-D-E instead of
 * B-I-N-G-O. Every guest's card is generated deterministically from their
 * player id + the round's seed, so cards never need to be stored: the host
 * and TV can regenerate any card to check a claim, and "New game" (new seed)
 * deals everyone a fresh card.
 */

export const BINGO_LETTERS = ['B', 'R', 'I', 'D', 'E']
export const BINGO_MAX = 75
export const FREE = 0 // centre square value

/** Ball colours per column (classic bingo-hall rainbow, softened). */
export const BALL_COLORS = {
  B: '#f472b6', // pink
  R: '#a78bfa', // violet
  I: '#38bdf8', // sky
  D: '#34d399', // green
  E: '#fbbf24', // amber
}

export const PATTERNS = {
  line: { id: 'line', label: 'One line', points: 20 },
  twoLines: { id: 'twoLines', label: 'Two lines', points: 30 },
  corners: { id: 'corners', label: 'Four corners', points: 20 },
  full: { id: 'full', label: 'Full house', points: 50 },
}

/** Fun calls read out on the TV under the ball. */
const CALLS = {
  1: 'Kelly’s eye', 2: 'One little duck', 7: 'Lucky seven', 8: 'Garden gate',
  11: 'Legs eleven', 13: 'Unlucky for some', 21: 'Key of the door',
  22: 'Two little ducks', 26: 'Pick and mix', 28: 'In a state',
  30: 'Dirty Gertie', 44: 'Droopy drawers', 45: 'Halfway there',
  52: 'Danny La Rue', 59: 'Brighton line', 64: 'Almost retired',
  66: 'Clickety click', 69: 'Either way up', 72: 'Six dozen',
  75: 'Strive and strive',
}

export const letterFor = (n) => BINGO_LETTERS[Math.min(Math.floor((n - 1) / 15), 4)]
export const ballLabel = (n) => `${letterFor(n)}-${n}`
export const callFor = (n) => CALLS[n] || ''

/* Tiny seeded PRNG (mulberry32) + string hash, so cards are reproducible. */
function hash(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function rng(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A 5x5 card as a flat array of 25 numbers, row-major. Column c holds 5
 * distinct numbers from c*15+1 … c*15+15; the centre is FREE.
 */
export function makeCard(playerId, seed) {
  const rand = rng(hash(`${playerId}:${seed}`))
  const cols = BINGO_LETTERS.map((_, c) => {
    const pool = Array.from({ length: 15 }, (_, i) => c * 15 + i + 1)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return pool.slice(0, 5)
  })
  const card = []
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) card.push(cols[c][r])
  card[12] = FREE
  return card
}

const LINES = [
  ...[0, 1, 2, 3, 4].map((r) => [0, 1, 2, 3, 4].map((c) => r * 5 + c)), // rows
  ...[0, 1, 2, 3, 4].map((c) => [0, 1, 2, 3, 4].map((r) => r * 5 + c)), // cols
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
]

/**
 * Which cells complete the pattern, given a set of "good" cell indexes
 * (marked AND actually drawn). Returns the winning cell indexes, or null.
 */
export function winningCells(pattern, good) {
  const has = (i) => good.has(i)
  if (pattern === 'full') {
    return good.size === 25 ? [...good] : null
  }
  if (pattern === 'corners') {
    const corners = [0, 4, 20, 24]
    return corners.every(has) ? corners : null
  }
  const done = LINES.filter((line) => line.every(has))
  const need = pattern === 'twoLines' ? 2 : 1
  return done.length >= need ? [...new Set(done.slice(0, need).flat())] : null
}

/**
 * Cell indexes the player has marked that really were called. Marks on
 * un-called numbers don't count — no cheating your way to a bingo.
 */
export function goodCells(card, marks, drawn) {
  const called = new Set(drawn || [])
  const good = new Set([12])
  ;(marks || []).forEach((i) => {
    if (card[i] === FREE || called.has(card[i])) good.add(i)
  })
  return good
}

/** Pick a random ball that hasn't been drawn yet (null when the cage is empty). */
export function nextBall(drawn) {
  const taken = new Set(drawn || [])
  const left = Array.from({ length: BINGO_MAX }, (_, i) => i + 1).filter((n) => !taken.has(n))
  if (!left.length) return null
  return left[Math.floor(Math.random() * left.length)]
}

/** Remember marks per device + round, so a phone refresh keeps the card. */
export function loadMarks(seed) {
  try {
    return JSON.parse(localStorage.getItem(`bvb-bingo-${seed}`)) || []
  } catch {
    return []
  }
}

export function saveMarks(seed, marks) {
  try {
    localStorage.setItem(`bvb-bingo-${seed}`, JSON.stringify(marks))
  } catch {
    // Private mode / storage full — marks just won't survive a refresh.
  }
}

/** How long the TV tumbler spins before the ball pops out (ms). Phones wait this long too. */
export const TUMBLE_MS = 2600
