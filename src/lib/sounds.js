/**
 * Tiny WebAudio synth cues — no audio files needed, works offline.
 * Browsers require a user gesture before audio plays, so the display
 * operator should click the page once after opening it.
 */
let ctx = null
const audio = () => (ctx ??= new (window.AudioContext || window.webkitAudioContext)())

function tone(freq, start, duration, type = 'square', gain = 0.15) {
  const ac = audio()
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(gain, ac.currentTime + start)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + duration)
  osc.connect(g).connect(ac.destination)
  osc.start(ac.currentTime + start)
  osc.stop(ac.currentTime + start + duration)
}

const CUES = {
  buzz: () => tone(220, 0, 0.6, 'sawtooth', 0.25),
  correct: () => {
    tone(523, 0, 0.15, 'sine')
    tone(659, 0.12, 0.15, 'sine')
    tone(784, 0.24, 0.3, 'sine')
  },
  strike: () => {
    tone(200, 0, 0.35, 'square', 0.2)
    tone(150, 0.05, 0.4, 'square', 0.2)
  },
  fanfare: () => {
    ;[523, 523, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.2, 'triangle', 0.2))
  },
}

export function playCue(name) {
  try {
    CUES[name]?.()
  } catch {
    // Audio context blocked until user interacts with the page — ignore.
  }
}
