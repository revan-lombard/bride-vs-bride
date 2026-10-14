/**
 * Tiny WebAudio synth cues — no audio files needed, works offline.
 * Browsers require a user gesture before audio plays: the display shows a
 * "click to enable sound" prompt, and phones unlock on their first tap.
 */
let ctx = null
let master = null
let noiseBuf = null
let muted = (() => {
  try {
    return localStorage.getItem('bvb-muted') === '1'
  } catch {
    return false
  }
})()

function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 1
    master.connect(ctx.destination)
  }
  return ctx
}

/** Call from a click/tap handler. Resolves true once audio can play. */
export async function unlockAudio() {
  try {
    const ac = audio()
    if (ac.state !== 'running') await ac.resume()
    return ac.state === 'running'
  } catch {
    return false
  }
}

export const isAudioUnlocked = () => ctx?.state === 'running'

export const isMuted = () => muted

export function setMuted(value) {
  muted = value
  try {
    localStorage.setItem('bvb-muted', value ? '1' : '0')
  } catch {
    // ignore — mute just won't be remembered
  }
  if (master) master.gain.value = value ? 0 : 1
}

function tone(freq, start, duration, type = 'square', gain = 0.15, toFreq = null) {
  const ac = audio()
  const t0 = ac.currentTime + start
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (toFreq) osc.frequency.exponentialRampToValueAtTime(toFreq, t0 + duration)
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
  osc.connect(g).connect(master)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

/** Filtered white-noise burst — rattles, whooshes, drums and applause. */
function noise(start, duration, { gain = 0.2, freq = 1000, q = 1, type = 'bandpass', toFreq = null, attack = 0.005 } = {}) {
  const ac = audio()
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const t0 = ac.currentTime + start
  const src = ac.createBufferSource()
  src.buffer = noiseBuf
  const filter = ac.createBiquadFilter()
  filter.type = type
  filter.Q.value = q
  filter.frequency.setValueAtTime(freq, t0)
  if (toFreq) filter.frequency.exponentialRampToValueAtTime(toFreq, t0 + duration)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack)
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
  src.connect(filter).connect(g).connect(master)
  src.start(t0, Math.random())
  src.stop(t0 + duration + 0.02)
}

const arpeggio = (notes, step, dur, type = 'triangle', gain = 0.2, start = 0) =>
  notes.forEach((f, i) => tone(f, start + i * step, dur, type, gain))

function applause(start = 0, duration = 2.5) {
  // Lots of tiny random claps, thinning out at the end.
  for (let i = 0; i < duration * 45; i++) {
    const t = start + Math.random() * duration
    const fade = 1 - (t - start) / duration
    noise(t, 0.04, { gain: 0.12 * fade + 0.02, freq: 1200 + Math.random() * 1800, q: 1.5 })
  }
}

const CUES = {
  // --- the original soundboard -----------------------------------------
  buzz: () => {
    tone(220, 0, 0.6, 'sawtooth', 0.22)
    tone(223, 0, 0.6, 'sawtooth', 0.12)
  },
  correct: () => {
    // Game-show "ding ding": bell partials
    ;[0, 0.18].forEach((s) => {
      tone(1319, s, 0.6, 'sine', 0.22)
      tone(2637, s, 0.35, 'sine', 0.06)
    })
  },
  strike: () => {
    tone(200, 0, 0.45, 'square', 0.2)
    tone(150, 0.05, 0.5, 'square', 0.2)
    noise(0, 0.3, { gain: 0.15, freq: 300, type: 'lowpass' })
  },
  fanfare: () => arpeggio([523, 523, 523, 659, 784, 1047], 0.14, 0.22, 'triangle', 0.2),

  // --- automatic game events ------------------------------------------
  /** New game on the TV */
  whoosh: () => {
    noise(0, 0.7, { gain: 0.3, freq: 300, toFreq: 4000, q: 2, attack: 0.25 })
    tone(392, 0.45, 0.2, 'triangle', 0.12)
    tone(587, 0.55, 0.3, 'triangle', 0.12)
  },
  /** Points added — coin pickup */
  score: () => {
    tone(988, 0, 0.08, 'square', 0.1)
    tone(1319, 0.08, 0.35, 'square', 0.1)
  },
  /** Points taken away */
  scoreDown: () => {
    tone(523, 0, 0.12, 'triangle', 0.18)
    tone(392, 0.12, 0.25, 'triangle', 0.18)
  },
  /** Timer's last five seconds */
  tick: () => {
    tone(1600, 0, 0.05, 'square', 0.12)
    noise(0, 0.04, { gain: 0.15, freq: 3000, q: 4 })
  },
  /** Timer hits zero — air horn */
  timesUp: () => {
    ;[440, 554, 659].forEach((f) => tone(f, 0, 1.1, 'sawtooth', 0.09))
    ;[440, 554, 659].forEach((f) => tone(f * 1.01, 0, 1.1, 'sawtooth', 0.06))
  },
  /** Before a big reveal (poll results) — snare roll + crash */
  drumroll: () => {
    for (let i = 0; i < 32; i++) {
      noise(i * 0.05, 0.05, { gain: 0.05 + (i / 32) * 0.2, freq: 1800, q: 0.8 })
    }
    noise(1.6, 1.4, { gain: 0.35, freq: 6000, type: 'highpass', q: 0.5 })
    tone(98, 1.6, 0.4, 'sine', 0.35)
  },
  /** Winner screen */
  winner: () => {
    arpeggio([523, 659, 784, 1047, 784, 1047], 0.15, 0.3, 'triangle', 0.22)
    ;[523, 659, 784, 1047].forEach((f) => tone(f, 0.95, 1.4, 'triangle', 0.12))
    applause(0.8, 3.5)
  },

  // --- bridal bingo ---------------------------------------------------
  /** The cage spinning: rumble + balls clacking (matches TUMBLE_MS) */
  tumble: () => {
    noise(0, 2.5, { gain: 0.12, freq: 180, type: 'lowpass', attack: 0.3 })
    for (let i = 0; i < 46; i++) {
      const t = i * 0.052 + Math.random() * 0.03
      noise(t, 0.03, { gain: 0.08 + Math.random() * 0.12, freq: 2000 + Math.random() * 2500, q: 8 })
    }
  },
  /** The ball drops out of the chute */
  pop: () => {
    tone(300, 0, 0.18, 'sine', 0.3, 900)
    noise(0, 0.05, { gain: 0.25, freq: 2500, q: 3 })
    tone(1047, 0.2, 0.25, 'sine', 0.15)
  },
  /** Somebody got BINGO! */
  bingo: () => {
    tone(880, 0, 0.15, 'square', 0.12)
    tone(880, 0.18, 0.15, 'square', 0.12)
    arpeggio([523, 659, 784, 1047, 1319, 1568], 0.09, 0.25, 'triangle', 0.2, 0.4)
    ;[784, 1047, 1319].forEach((f) => tone(f, 0.95, 1.2, 'triangle', 0.12))
    applause(0.9, 3)
  },

  // --- phone taps (quiet) --------------------------------------------------
  tap: () => tone(660, 0, 0.06, 'sine', 0.15),
  mark: () => {
    tone(880, 0, 0.08, 'sine', 0.18)
    tone(1320, 0.05, 0.12, 'sine', 0.1)
  },
  nope: () => tone(180, 0, 0.18, 'square', 0.1),
}

export const CUE_NAMES = Object.keys(CUES)

export function playCue(name) {
  try {
    const ac = audio()
    if (ac.state !== 'running') ac.resume().catch(() => {})
    CUES[name]?.()
  } catch {
    // Audio context blocked until user interacts with the page — ignore.
  }
}

/** Phone buzz feedback (Android; iOS ignores it). */
export function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // unsupported — fine
  }
}
