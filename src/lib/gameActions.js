import {
  ref,
  set,
  update,
  runTransaction,
  get,
  serverTimestamp,
  increment,
  onDisconnect,
} from 'firebase/database'
import { db } from './firebase'
import { GAME_ROOT } from './mode'
import { DEFAULT_STATE, GAMES } from './schema'
import { nextBall, PATTERNS } from './bingo'
import { serverNow } from './serverTime'
import { CHEER_SECONDS, CHEER_POINTS, CHEER_TOP_POINTS, COUNTDOWN_MS, tallyCheer } from './cheer'

const game = (path = '') => ref(db, path ? `${GAME_ROOT}/${path}` : GAME_ROOT)

/**
 * Personal points (for the MVP reveal) ride along in the same multi-path
 * update as the team score, so the two can never drift apart.
 */
const credit = (updates, playerId, points) => {
  if (playerId && points) updates[`players/${playerId}/points`] = increment(points)
}

/* ------------------------------------------------------------------ */
/* Host actions                                                        */
/* ------------------------------------------------------------------ */

export const resetGame = () => set(game(), DEFAULT_STATE)

const personalPoints = (players) =>
  Object.fromEntries(
    Object.entries(players || {})
      .filter(([, p]) => p?.userName && !p.kicked)
      .map(([id, p]) => [id, p.points || 0])
  )

/**
 * What a round was worth: team gains since `start` (null = no round, just a
 * standings check), the star of the round (biggest personal gain), and the
 * MVP so far. Everything the TV and phones need, so they don't recompute.
 */
function buildRecap(state, start, fromGame, toGame) {
  const scores = { teamA: state.scores?.teamA ?? 0, teamB: state.scores?.teamB ?? 0 }
  const now = personalPoints(state.players)
  const people = state.players || {}
  const gains = {}
  if (start) {
    for (const [id, pts] of Object.entries(now)) {
      const g = pts - (start.points?.[id] || 0)
      if (g > 0) gains[id] = g
    }
  }
  const pick = (map) => {
    const [id, n] = Object.entries(map).sort((a, b) => b[1] - a[1])[0] || []
    return id && n > 0 ? { playerId: id, userName: people[id]?.userName, team: people[id]?.team, points: n } : null
  }
  return {
    id: Math.random().toString(36).slice(2, 10),
    fromGame: fromGame || null,
    toGame,
    gained: start
      ? { teamA: scores.teamA - (start.scores?.teamA ?? 0), teamB: scores.teamB - (start.scores?.teamB ?? 0) }
      : null,
    scores,
    gains,
    star: pick(gains),
    mvp: pick(now),
  }
}

/**
 * Switch games from the host panel. Leaving a game where points changed
 * puts a recap on the TV first (not before the WINNER screen — that has its
 * own reveal). Also snapshots scores so the next switch can recap this one.
 */
export function switchGame(name, state) {
  if (name === state.currentGame) return
  const from = state.currentGame
  const start = state.gameStart
  const updates = {
    currentGame: name,
    gameStart: { game: name, scores: state.scores || {}, points: personalPoints(state.players) },
  }
  const quiet = [GAMES.LOBBY, GAMES.WINNER]
  if (start?.game === from && !quiet.includes(from) && name !== GAMES.WINNER) {
    const recap = buildRecap(state, start, from, name)
    if (recap.gained.teamA || recap.gained.teamB) updates.recap = recap
  }
  return update(game(), updates)
}

export const setRunStep = (index) => set(game('runStep'), index)

/** "📊 Scoreboard check" on demand: standings + MVP, no round gains. */
export const showRecap = (state) => set(game('recap'), buildRecap(state, null, null, state.currentGame))

export const adjustScore = (team, delta) =>
  runTransaction(game(`scores/${team}`), (current) => (current || 0) + delta)

export const setScore = (team, value) => set(game(`scores/${team}`), value)

/** Arm the buzzers: clears the previous winner and unlocks. */
export const unlockBuzzers = () =>
  set(game('buzzerState'), { isUnlocked: true, firstBuzzed: null })

export const lockBuzzers = () => set(game('buzzerState/isUnlocked'), false)

/**
 * Host judges a buzz answer correct (games without phone picking, e.g.
 * Finish the Lyric): points to the team AND the person, buzzers reset.
 */
export function awardBuzzWinner(firstBuzzed, points) {
  const updates = {
    [`scores/${firstBuzzed.team}`]: increment(points),
    buzzerState: { isUnlocked: false, firstBuzzed: null },
  }
  credit(updates, firstBuzzed.playerId, points)
  return update(game(), updates)
}

export const openPoll = (question, options) =>
  set(game('pollState'), {
    question,
    options,
    isOpen: true,
    votes: null,
    showResults: false,
  })

export const closePoll = () => set(game('pollState/isOpen'), false)

export const showPollResults = (show = true) =>
  set(game('pollState/showResults'), show)

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

/**
 * Phone options = board answers + decoys (shuffled). Decoys are what make a
 * strike possible — with only board answers on offer, every pick is a hit.
 */
export const loadFeudRound = (question, answers, options = null, decoys = []) =>
  set(game('feudState'), {
    question,
    answers: answers.map((a) => ({ ...a, revealed: false })),
    options: options || shuffle([...answers.map((a) => a.text), ...decoys]),
    strikes: 0,
  })

export const revealFeudAnswer = (index, revealed = true) =>
  set(game(`feudState/answers/${index}/revealed`), revealed)

export const setStrikes = (strikes) => set(game('feudState/strikes'), strikes)

export const loadLyric = (snippet, answer, audio = '', cutAt = 0) =>
  set(game('lyricState'), {
    snippet,
    answer,
    audio,
    cutAt,
    showAnswer: false,
    playback: null,
  })

export const showLyricAnswer = (show = true) =>
  set(game('lyricState/showAnswer'), show)

export const triggerLyricPlayback = (action) =>
  set(game('lyricState/playback'), { action, ts: serverTimestamp() })

export const triggerSound = (name) =>
  set(game('soundCue'), { name, ts: serverTimestamp() })

/** Roster fixes from the host panel. The guest's phone picks these up live. */
export const renamePlayer = (id, userName) => set(game(`players/${id}/userName`), userName)

export const movePlayer = (id, team) => set(game(`players/${id}/team`), team)

/** Mark a player as one of the brides (their phone gets the secret-answer pad). */
export const setPlayerRole = (id, role) => set(game(`players/${id}/role`), role || null)

/** Sends the guest back to the join screen (they can rejoin fresh). */
export const removePlayer = (id) => update(game(`players/${id}`), { kicked: true, online: false })

export const setReactionsOn = (on) => set(game('reactionsOn'), on)

/**
 * One slot per guest, overwritten each tap; the counter tells the TV it's a
 * new reaction even when the same emoji is tapped twice. Kept outside /game
 * so a flurry of taps doesn't resend the whole game state to every phone.
 */
export const sendReaction = (player, emoji) =>
  update(ref(db, `reactions/${GAME_ROOT}/${player.id}`), {
    emoji,
    team: player.team,
    userName: player.userName,
    n: increment(1),
  })

export const startTimer = (seconds) =>
  set(game('timer'), { duration: seconds, endsAt: Date.now() + seconds * 1000 })

export const clearTimer = () => set(game('timer'), null)

/* ------------------------------------------------------------------ */
/* Guest actions                                                       */
/* ------------------------------------------------------------------ */

/**
 * Race-safe buzz: a transaction on firstBuzzed means only the first write
 * lands; everyone else's transaction sees a non-null value and aborts.
 * Returns true if this guest won the buzz.
 */
export async function buzz(player) {
  const result = await runTransaction(
    game('buzzerState/firstBuzzed'),
    (current) => {
      if (current !== null) return undefined // someone beat us — abort
      return {
        playerId: player.id,
        userName: player.userName,
        team: player.team,
        timestamp: serverTimestamp(),
      }
    }
  )
  // Buzz wins feed the "fastest finger" award on the winner screen.
  if (result.committed) update(game(`players/${player.id}`), { buzzes: increment(1) })
  return result.committed
}

/**
 * Put this guest on the roster (or mark them back online). Called on
 * connect and whenever their entry is missing, e.g. after a host reset.
 * onDisconnect is re-armed each time because it fires only once.
 */
export async function registerPlayer(player, existing) {
  const entry = game(`players/${player.id}`)
  await onDisconnect(entry).update({ online: false })
  return update(
    entry,
    existing
      ? { online: true }
      : { userName: player.userName, team: player.team, online: true, joinedAt: serverTimestamp() }
  )
}

export const castVote = (player, choice) =>
  update(game(`pollState/votes/${player.id}`), {
    userName: player.userName,
    team: player.team,
    choice,
  })

/**
 * The buzz winner picks an answer on their phone. Auto-matched against the
 * board (options come from the same fixed list, so text match is exact):
 * a hit reveals the answer (the TV plays the ding) and adds its points straight to
 * the guesser's team; a miss adds a strike. Buzzers lock until the host
 * re-arms; a revealed answer picked again counts as a miss, Feud style.
 */
export function submitFeudGuess(player, choice, feudState) {
  const idx = (feudState.answers || []).findIndex(
    (a) => a.text === choice && !a.revealed
  )
  const correct = idx >= 0
  const updates = {
    'feudState/lastGuess': {
      userName: player.userName,
      team: player.team,
      choice,
      correct,
    },
    buzzerState: { isUnlocked: false, firstBuzzed: null },
  }
  if (correct) {
    updates[`feudState/answers/${idx}/revealed`] = true
    updates[`scores/${player.team}`] = increment(
      feudState.answers[idx].points || 0
    )
    credit(updates, player.id, feudState.answers[idx].points || 0)
  } else {
    updates['feudState/strikes'] = Math.min((feudState.strikes || 0) + 1, 3)
  }
  return update(game(), updates)
}

/* ------------------------------------------------------------------ */
/* Noot vir Noot                                                       */
/* ------------------------------------------------------------------ */

export const loadNootRound = (round) =>
  set(game('nootState'), {
    prompt: round.prompt || 'Raai die liedjie! 🎶',
    options: shuffle(round.options),
    correct: round.correct,
    audio: round.audio || '',
    clipStart: round.clipStart || 0,
    clipEnd: round.clipEnd || 0,
    points: round.points || 10,
    revealed: false,
    wrongGuesses: [],
    playback: null,
    lastGuess: null,
  })

export const triggerNootPlayback = (action) =>
  set(game('nootState/playback'), { action, ts: serverTimestamp() })

export const revealNootAnswer = (revealed = true) =>
  set(game('nootState/revealed'), revealed)

/**
 * Same phone-pick flow as Feud: a hit reveals the song (fanfare on the TV)
 * and auto-awards the round's points; a miss greys that option out for the
 * next buzz winner. Buzzers relock either way until the host re-arms.
 */
export function submitNootGuess(player, choice, nootState) {
  const correct = choice === nootState.correct
  const updates = {
    'nootState/lastGuess': {
      userName: player.userName,
      team: player.team,
      choice,
      correct,
    },
    buzzerState: { isUnlocked: false, firstBuzzed: null },
  }
  if (correct) {
    updates['nootState/revealed'] = true
    updates[`scores/${player.team}`] = increment(nootState.points || 10)
    credit(updates, player.id, nootState.points || 10)
  } else {
    updates['nootState/wrongGuesses'] = [
      ...(nootState.wrongGuesses || []),
      choice,
    ]
  }
  return update(game(), updates)
}

/* ------------------------------------------------------------------ */
/* Bridal Bingo                                                        */
/* ------------------------------------------------------------------ */

/** Deal everyone a fresh card (new seed) and empty the tumbler. */
export const newBingoGame = (pattern = 'line', mode = 'numbers') =>
  set(game('bingoState'), {
    seed: Math.random().toString(36).slice(2, 10),
    mode,
    drawn: [],
    pattern,
    winner: null,
    winners: [],
  })

export const setBingoPattern = (pattern) => set(game('bingoState/pattern'), pattern)

/**
 * Draw one ball. A transaction so a double-tap (or auto-draw racing a
 * manual tap) can never draw the same ball twice. Paused while a bingo
 * claim is on screen — the host continues or deals a new game first.
 */
export const drawBingoBall = () =>
  runTransaction(game('bingoState'), (current) => {
    if (!current?.seed || current.winner) return undefined
    const drawn = current.drawn || []
    const n = nextBall(drawn)
    if (n === null) return undefined
    return { ...current, drawn: [...drawn, n] }
  })

/**
 * Gift Bingo: the host taps a gift as it's opened (tap again to undo a
 * mis-tap). Unlike the tumbler this keeps working while a win is on screen —
 * the gifts don't stop coming.
 */
export const toggleGift = (n) =>
  runTransaction(game('bingoState/drawn'), (current) => {
    const drawn = current || []
    return drawn.includes(n) ? drawn.filter((d) => d !== n) : [...drawn, n]
  })

/**
 * Guest shouts BINGO. The phone only offers the button once its marked
 * (and genuinely called) squares complete the pattern, so the claim is
 * already verified; the transaction makes sure only the first one counts.
 * Points for the pattern go straight to the claimer's team.
 */
export async function claimBingo(player, cells, bingoState) {
  const pattern = bingoState.pattern || 'line'
  const points = PATTERNS[pattern]?.points || 0
  const result = await runTransaction(game('bingoState/winner'), (current) => {
    if (current) return undefined
    return {
      playerId: player.id,
      userName: player.userName,
      team: player.team,
      pattern,
      cells,
      points,
      seed: bingoState.seed,
    }
  })
  if (result.committed && points) {
    const updates = { [`scores/${player.team}`]: increment(points) }
    credit(updates, player.id, points)
    await update(game(), updates)
  }
  return result.committed
}

/** Keep playing the same cards for a bigger pattern (line → full house). */
export const continueBingo = (bingoState, nextPattern) =>
  update(game('bingoState'), {
    winners: [...(bingoState.winners || []), bingoState.winner].filter(Boolean),
    winner: null,
    pattern: nextPattern,
  })

/* ------------------------------------------------------------------ */
/* Bride Knows Best (Newlywed / Who said it?)                          */
/* ------------------------------------------------------------------ */

/** Points each correct guesser earns towards MVP. */
export const NEWLYWED_PERSONAL_POINTS = 5

export const loadNewlywedRound = (round) =>
  set(game('newlywedState'), {
    kind: round.kind || 'bride',
    question: round.question,
    options: round.kind === 'whosaid' ? [] : round.options || [],
    answer: round.answer === 'A' ? 'teamA' : round.answer === 'B' ? 'teamB' : null,
    brideAnswers: null,
    guesses: null,
    points: round.points || 10,
    revealed: false,
    results: null,
  })

/** A bride locks in her secret answer (changeable until the reveal). */
export const setBrideAnswer = (team, choice) => set(game(`newlywedState/brideAnswers/${team}`), choice)

export const castNewlywedGuess = (player, choice) =>
  set(game(`newlywedState/guesses/${player.id}`), {
    userName: player.userName,
    team: player.team,
    choice,
  })

/**
 * Reveal and score in one go. Each team earns up to `points` scaled by the
 * share of its guessers who were right (so a big team can't out-vote a
 * small one); every correct guesser gets personal MVP points. Bride
 * rounds: a team guesses its own bride. Who-said-it: everyone guesses the
 * same answer. A transaction on `revealed` stops a double-tap scoring twice.
 */
export async function revealNewlywed(nw, answerOverride = null) {
  const answer = answerOverride || nw.answer
  const lock = await runTransaction(game('newlywedState/revealed'), (r) => (r ? undefined : true))
  if (!lock.committed) return
  const guesses = Object.entries(nw.guesses || {})
  const updates = { 'newlywedState/answer': answer || null }
  const results = {}
  for (const team of ['teamA', 'teamB']) {
    const target = nw.kind === 'whosaid' ? answer : nw.brideAnswers?.[team]
    const voters = guesses.filter(([, g]) => g.team === team)
    const right = voters.filter(([, g]) => target && g.choice === target)
    const points = voters.length ? Math.round(((nw.points || 10) * right.length) / voters.length) : 0
    results[team] = { correct: right.length, voters: voters.length, points }
    if (points) updates[`scores/${team}`] = increment(points)
    right.forEach(([id]) => credit(updates, id, NEWLYWED_PERSONAL_POINTS))
  }
  updates['newlywedState/results'] = results
  return update(game(), updates)
}

/* ------------------------------------------------------------------ */
/* Cheer-off                                                           */
/* ------------------------------------------------------------------ */

/**
 * Tap counts: one slot per phone per round, written a few times a second.
 * Kept under /reactions (already open in the rules, and outside /game) so
 * a room full of tapping doesn't resend the whole game state to everyone.
 */
export const cheerTapsRef = (roundId, playerId = '') =>
  ref(db, `reactions/${GAME_ROOT}-cheer/${roundId}${playerId ? `/${playerId}` : ''}`)

export const sendCheerTaps = (player, roundId, taps) =>
  set(cheerTapsRef(roundId, player.id), { team: player.team, userName: player.userName, taps })

export function startCheer() {
  const startsAt = serverNow() + COUNTDOWN_MS
  return set(game('cheerState'), {
    phase: 'running',
    roundId: Math.random().toString(36).slice(2, 10),
    startsAt,
    endsAt: startsAt + CHEER_SECONDS * 1000,
    result: null,
  })
}

export const resetCheer = () =>
  set(game('cheerState'), { phase: 'idle', roundId: '', startsAt: 0, endsAt: 0, result: null })

/**
 * Score a finished round. Both the host panel and the TV call this when the
 * clock runs out (whichever is awake); the transaction on the phase makes
 * sure only one of them actually scores it.
 */
export async function finishCheer(roundId) {
  const lock = await runTransaction(game('cheerState/phase'), (phase) => (phase === 'running' ? 'done' : undefined))
  if (!lock.committed) return
  const result = tallyCheer((await get(cheerTapsRef(roundId))).val())
  const updates = { 'cheerState/result': result }
  if (result.winner === 'tie') {
    if (result.top) {
      updates['scores/teamA'] = increment(CHEER_POINTS / 2)
      updates['scores/teamB'] = increment(CHEER_POINTS / 2)
    }
  } else {
    updates[`scores/${result.winner}`] = increment(CHEER_POINTS)
  }
  if (result.top) credit(updates, result.top.playerId, CHEER_TOP_POINTS)
  return update(game(), updates)
}
