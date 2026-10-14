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
  NOOT: 'NOOT',
  BINGO: 'BINGO',
  NEWLYWED: 'NEWLYWED',
  CHEER: 'CHEER',
  WINNER: 'WINNER',
}

/** TV splash titles shown when the host switches games. */
export const GAME_TITLES = {
  LOBBY: '🥂 Welcome!',
  FEUD: '📋 Family Feud',
  POLL: '🗳️ Live Poll',
  LYRIC: '🎵 Finish the Lyric',
  NOOT: '🎶 Noot vir Noot',
  BINGO: '🎱 Bridal Bingo',
  NEWLYWED: '💑 Bride Knows Best',
  CHEER: '🪢 Cheer-off!',
  WINNER: '🏆 And the winner is…',
}

/** Which games use the buzzers (drives the host panel's buzzer section). */
export const BUZZER_GAMES = [GAMES.FEUD, GAMES.LYRIC, GAMES.NOOT]

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
    // What guests see on their phones as pickable choices — board answer
    // texts (shuffled) plus any decoys, e.g. zero-vote survey options.
    options: [],
    strikes: 0,
    // Last phone-submitted guess: { userName, team, choice, correct }
    lastGuess: null,
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
  // Noot vir Noot: guess-the-song round. Audio clip plays on the TV,
  // buzz winner picks the title on their phone, auto-scored.
  nootState: {
    prompt: '',
    options: [],
    correct: '',
    audio: '',
    clipStart: 0,
    clipEnd: 0,
    points: 10,
    revealed: false,
    wrongGuesses: [],
    playback: null,
    lastGuess: null,
  },
  // Bridal Bingo: 75 balls under B-R-I-D-E. Cards are derived from
  // (playerId, seed) so nothing per-player is stored; marks live on phones.
  bingoState: {
    seed: '', // empty = no game dealt yet
    mode: 'numbers', // 'numbers' (tumbler) | 'gifts' (gift words, host taps as opened)
    drawn: [], // ball numbers in draw order
    pattern: 'line', // key of PATTERNS in lib/bingo.js
    // First valid claim: { playerId, userName, team, pattern, cells, points }
    winner: null,
    // Earlier winners this game (line → two lines → full house…)
    winners: [],
  },
  // Emoji reactions bar on phones (the reactions themselves live outside
  // /game at /reactions/{root}/{playerId} so they don't resync everything).
  reactionsOn: true,
  // Who has joined: { [playerId]: { userName, team, online, joinedAt, kicked?,
  //   points (personal, for the MVP), buzzes (buzz wins), role? ('brideA'|'brideB') } }
  // Guests write their own entry (online flips false on disconnect); the
  // host can rename, move or remove (kicked) players from the roster.
  players: null,
  // Bride Knows Best (Newlywed / Who said it?). See NEWLYWED_ROUNDS.
  newlywedState: {
    kind: 'bride', // 'bride' | 'whosaid'
    question: '',
    options: [], // 'bride' rounds only; 'whosaid' choices are the two brides
    answer: null, // 'whosaid': 'teamA' | 'teamB'
    brideAnswers: null, // 'bride': { teamA: option, teamB: option } — secret until reveal
    guesses: null, // { [playerId]: { userName, team, choice } }
    points: 10, // max per team, scaled by the share who got it right
    revealed: false,
    results: null, // { teamA: { correct, voters, points }, teamB: {…} }
  },
  // Cheer-off tug-of-war. Taps live outside /game (see cheerTapsRef).
  // phase 'running' → clients derive countdown/live/counting from the
  // server clock; 'done' once scored. result = tallyCheer() output.
  cheerState: { phase: 'idle', roundId: '', startsAt: 0, endsAt: 0, result: null },
  // Snapshot taken whenever the host switches game, so the next switch can
  // say what that game was worth: { game, scores, points: { [playerId]: n } }
  gameStart: null,
  // Between-games recap on the TV (and a toast on phones). See buildRecap.
  recap: null,
  // Countdown shown big on the TV. { duration, endsAt } — visual only,
  // the host still locks buzzers / closes polls themselves.
  timer: null,
  // Host-triggered one-shot audio cue (the soundboard). Display view plays
  // it when the timestamp changes. { name, ts } — any cue in lib/sounds.js.
  // Game events (buzzes, reveals, scores…) get their sounds automatically
  // from state changes on the display, so they don't go through here.
  soundCue: null,
}

/** Which bride a roster role belongs to: 'brideA' → 'teamA'. */
export const brideTeamOf = (role) => (role === 'brideA' ? 'teamA' : role === 'brideB' ? 'teamB' : null)

/** The bride's display name for a team key. */
export const brideName = (team) => (team === 'teamA' ? THEME.brideA : THEME.brideB)

/** Who-said-it text: quotes get quote marks, "Who is more likely…?" questions don't. */
export const whoSaidText = (q = '') => (q.trim().endsWith('?') ? q : `“${q}”`)

/** Did this player win the buzz? (By id; name fallback for old buzz records.) */
export const isMe = (who, player) =>
  Boolean(who) && (who.playerId ? who.playerId === player.id : who.userName === player.userName)

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

export function clearPlayer() {
  localStorage.removeItem('bvb-player')
}
