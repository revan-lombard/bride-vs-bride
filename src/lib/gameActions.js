import {
  ref,
  set,
  update,
  runTransaction,
  serverTimestamp,
} from 'firebase/database'
import { db } from './firebase'
import { DEFAULT_STATE } from './schema'

const game = (path = '') => ref(db, path ? `game/${path}` : 'game')

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
        userName: player.userName,
        team: player.team,
        timestamp: serverTimestamp(),
      }
    }
  )
  return result.committed
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
 * a hit reveals the answer + plays the ding, a miss adds a strike. Buzzers
 * lock until the host re-arms; a revealed answer picked again counts as a
 * miss, Feud style.
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
    soundCue: { name: correct ? 'correct' : 'strike', ts: serverTimestamp() },
  }
  if (correct) {
    updates[`feudState/answers/${idx}/revealed`] = true
  } else {
    updates['feudState/strikes'] = Math.min((feudState.strikes || 0) + 1, 3)
  }
  return update(game(), updates)
}
