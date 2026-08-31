import { ref, set, serverTimestamp } from 'firebase/database'
import { db } from './firebase'

/**
 * Pre-event survey data lives at its own /survey root (never touched by
 * game resets):
 *
 *   survey/
 *     config/open            false blocks new/changed responses
 *     responses/{id}         { name, answers: { [questionId]: optionIndex }, submittedAt }
 */

const survey = (path = '') => ref(db, path ? `survey/${path}` : 'survey')

/* ------------------------------------------------------------------ */
/* Respondent identity — same localStorage pattern as the game player  */
/* ------------------------------------------------------------------ */

export function loadRespondent() {
  try {
    return JSON.parse(localStorage.getItem('bvb-respondent')) || null
  } catch {
    return null
  }
}

export function saveRespondent(respondent) {
  localStorage.setItem('bvb-respondent', JSON.stringify(respondent))
}

/* ------------------------------------------------------------------ */
/* Invitee actions                                                     */
/* ------------------------------------------------------------------ */

export const submitSurveyResponse = (respondent, answers) =>
  set(survey(`responses/${respondent.id}`), {
    name: respondent.name || 'Anonymous',
    answers,
    submittedAt: serverTimestamp(),
  })

/* ------------------------------------------------------------------ */
/* Host actions                                                        */
/* ------------------------------------------------------------------ */

export const setSurveyOpen = (open) => set(survey('config/open'), open)

/** Vote counts per option index for one question. */
export function tallyQuestion(responses, question) {
  const counts = question.options.map(() => 0)
  Object.values(responses || {}).forEach((r) => {
    const choice = r.answers?.[question.id]
    if (Number.isInteger(choice) && choice >= 0 && choice < counts.length) {
      counts[choice] += 1
    }
  })
  return counts
}

/**
 * Convert one question's tallies into a Feud board: options with at least
 * one vote, best first, points = vote counts ("we asked the guests…").
 */
export function surveyToFeudAnswers(responses, question) {
  const counts = tallyQuestion(responses, question)
  return question.options
    .map((text, i) => ({ text, points: counts[i] }))
    .filter((a) => a.points > 0)
    .sort((a, b) => b.points - a.points)
}
