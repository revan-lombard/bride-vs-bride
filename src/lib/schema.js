/**
 * Canonical shape of the shared real-time game state, stored at /game in the
 * Realtime Database. Matches the technical brief's global data schema.
 */

export const GAMES = {
  LOBBY: 'LOBBY',
  FEUD: 'FEUD',
  POLL: 'POLL',
  LYRIC: 'LYRIC',
}

export const TEAMS = {
  teamA: { id: 'teamA', label: 'Team Bride A', color: 'bride-a' },
  teamB: { id: 'teamB', label: 'Team Bride B', color: 'bride-b' },
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
