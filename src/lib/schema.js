/**
 * Canonical shape of the shared real-time game state, stored at /game in the
 * Realtime Database. Matches the technical brief's global data schema.
 */

import { THEME } from './theme'

export const GAMES = {
  LOBBY: 'LOBBY',
  FEUD: 'FEUD',
  POLL: 'POLL',
  LYRIC: 'LYRIC',
}

export const TEAMS = {
  teamA: { id: 'teamA', label: `Team ${THEME.brideA}`, color: 'bride-a' },
  teamB: { id: 'teamB', label: `Team ${THEME.brideB}`, color: 'bride-b' },
}

export const MAX_STRIKES = 3

export const DEFAULT_STATE = {
  currentGame: GAMES.LOBBY,
  scores: {
    teamA: 0,
    teamB: 0,
  },
  buzzerState: {
    isUnlocked: false,
    // firstBuzzed: { userName, team, timestamp } — set by the winning guest,
    // cleared (null) when the host re-arms the buzzers.
    firstBuzzed: null,
  },
  pollState: {
    question: '',
    isOpen: false,
    // votes: { [playerId]: { userName, team, choice } }
    votes: null,
    // options: ["Bride A", "Bride B"] by default; host can customise
    options: ['Bride A', 'Bride B'],
    showResults: false,
  },
  feudState: {
    question: '',
    answers: [
      // { text, points, revealed }
    ],
    strikes: 0,
  },
  lyricState: {
    // snippet shows on the TV; answer stays hidden until the host reveals it
    snippet: '',
    answer: '',
    showAnswer: false,
    // Karaoke rounds: audio filename (loaded from a local folder on the
    // display laptop, never bundled) and the second the vocals cut out.
    audio: '',
    cutAt: 0,
    // One-shot play/stop cue, same pattern as soundCue. { action, ts }
    playback: null,
  },
  // Host-triggered one-shot audio cue. Display view plays it when the
  // timestamp changes. { name: 'buzz'|'correct'|'strike'|'fanfare', ts }
  soundCue: null,
}

/** Guest identity is kept in localStorage so refreshes don't lose the player. */
export function loadPlayer() {
  try {
    return JSON.parse(localStorage.getItem('bvb-player')) || null
  } catch {
    return null
  }
}

export function savePlayer(player) {
  localStorage.setItem('bvb-player', JSON.stringify(player))
}
