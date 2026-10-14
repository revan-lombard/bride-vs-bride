import { useEffect, useRef } from 'react'
import { playCue } from '../lib/sounds'

/**
 * Turns state changes into sound on the TV, so every game event is heard
 * without the host pressing anything: game switches, buzzes, reveals,
 * strikes, score changes, poll results and bingo wins. The first snapshot
 * after loading is only recorded, never played.
 */
export function useGameSounds(state) {
  const prev = useRef(null)

  useEffect(() => {
    if (!state) return
    const p = prev.current
    prev.current = snapshot(state)
    if (!p) return
    const n = prev.current
    const later = (name, ms) => setTimeout(() => playCue(name), ms)

    if (n.game !== p.game) playCue(n.game === 'WINNER' ? 'winner' : 'whoosh')
    if (n.buzzed && !p.buzzed) playCue('buzz')

    // Feud: a newly revealed card dings, a new strike buzzes
    if (n.feudQ === p.feudQ) {
      if (n.feudRevealed > p.feudRevealed) playCue('correct')
      if (n.strikes > p.strikes) playCue('strike')
    }
    // Noot vir Noot
    if (n.nootCorrect === p.nootCorrect) {
      if (n.nootRevealed && !p.nootRevealed) playCue('fanfare')
      if (n.nootWrong > p.nootWrong) playCue('strike')
    }
    if (n.lyricAnswer && !p.lyricAnswer) playCue('correct')
    if (n.pollResults && !p.pollResults) playCue('drumroll')
    if (n.bingoWinner && !p.bingoWinner) playCue('bingo')
    // Bride Knows Best: a pop as each bride locks in, fanfare on the reveal
    if (n.nwQ === p.nwQ) {
      if (n.nwLocked > p.nwLocked) playCue('pop')
      if (n.nwRevealed && !p.nwRevealed) playCue('fanfare')
    }

    // Scores: coin for points in, sad trombone-lite for points out. Delayed a
    // touch so it lands after the reveal ding rather than on top of it.
    const delta = n.scoreA - p.scoreA + (n.scoreB - p.scoreB)
    const reset = n.scoreA === 0 && n.scoreB === 0
    if (!reset && n.game !== 'WINNER') {
      if (delta > 0) later('score', 450)
      else if (delta < 0) later('scoreDown', 100)
    }
  }, [state])
}

function snapshot(s) {
  const answers = s.feudState?.answers || []
  return {
    game: s.currentGame,
    buzzed: Boolean(s.buzzerState?.firstBuzzed),
    feudQ: s.feudState?.question || '',
    feudRevealed: answers.filter((a) => a?.revealed).length,
    strikes: s.feudState?.strikes || 0,
    nootCorrect: s.nootState?.correct || '',
    nootRevealed: Boolean(s.nootState?.revealed),
    nootWrong: (s.nootState?.wrongGuesses || []).length,
    lyricAnswer: Boolean(s.lyricState?.showAnswer),
    pollResults: Boolean(s.pollState?.showResults),
    bingoWinner: Boolean(s.bingoState?.winner),
    nwQ: s.newlywedState?.question || '',
    nwLocked: Object.values(s.newlywedState?.brideAnswers || {}).filter(Boolean).length,
    nwRevealed: Boolean(s.newlywedState?.revealed),
    scoreA: s.scores?.teamA ?? 0,
    scoreB: s.scores?.teamB ?? 0,
  }
}
