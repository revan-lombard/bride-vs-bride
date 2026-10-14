import {
  ref,
  set,
  update,
  runTransaction,
  serverTimestamp,
  increment,
  onDisconnect,
} from 'firebase/database'
import { db } from './firebase'
import { GAME_ROOT } from './mode'
import { DEFAULT_STATE } from './schema'
import { nextBall, PATTERNS } from './bingo'

const game = (path = '') => ref(db, path ? `${GAME_ROOT}/${path}` : GAME_ROOT)

/* ------------------------------------------------------------------ */
/* Host actions                                                        */
/* ------------------------------------------------------------------ */

export const resetGame = () => set(game(), DEFAULT_STATE)

export const setCurrentGame = (name) => set(game('currentGame'), name)

export const adjustScore = (team, delta) =>
  runTransaction(game(`scores/${team}`), (current) => (current || 0) + delta)

export const setScore = (team, value) => set(game(`scores/${team}`), value)

/** Arm the buzzers: clears the previous winner and unlocks. */
export const unlockBuzzers = () =>
  set(game('buzzerState'), { isUnlocked: true, firstBuzzed: null })

export const lockBuzzers = () => set(game('buzzerState/isUnlocked'), false)

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

export const loadFeudRound = (question, answers, options = null) =>
  set(game('feudState'), {
    question,
    answers: answers.map((a) => ({ ...a, revealed: false })),
    options: options || shuffle(answers.map((a) => a.text)),
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

/** Sends the guest back to the join screen (they can rejoin fresh). */
export const removePlayer = (id) => update(game(`players/${id}`), { kicked: true, online: false })

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
export const newBingoGame = (pattern = 'line') =>
  set(game('bingoState'), {
    seed: Math.random().toString(36).slice(2, 10),
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
    await update(game(), { [`scores/${player.team}`]: increment(points) })
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
