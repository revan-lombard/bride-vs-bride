import { useState } from 'react'
import { useSurvey } from '../hooks/useSurvey'
import { SURVEY_QUESTIONS } from '../lib/surveyQuestions'
import {
  setSurveyOpen,
  tallyQuestion,
  surveyToFeudAnswers,
} from '../lib/surveyActions'
import { loadFeudRound } from '../lib/gameActions'

/**
 * Host-only live tally of the pre-event survey, with a one-tap "Use as Feud
 * round" that turns any question's votes into the live Feud board.
 */
export default function SurveyResultsView() {
  const { loaded, isOpen, responses, connected } = useSurvey()
  const [loadedRound, setLoadedRound] = useState(null)

  if (!loaded) return <p className="p-8 text-center">Connecting…</p>

  const respondents = Object.values(responses)

  const useAsRound = (question) => {
    const answers = surveyToFeudAnswers(responses, question)
    if (!answers.length) return
    loadFeudRound(question.question, answers)
    setLoadedRound(question.id)
  }

  return (
    <div className="min-h-full max-w-2xl mx-auto p-4 space-y-6 pb-16">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">📊 Survey Results</h1>
        <span className={`text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? '● live' : '● offline'}
        </span>
      </header>

      <div className="flex items-center justify-between bg-white/10 rounded-xl p-3">
        <div className="text-sm">
          <b>{respondents.length}</b> response{respondents.length === 1 ? '' : 's'}
          {respondents.length > 0 && (
            <span className="text-white/50">
              {' '}
              — {respondents.map((r) => r.name).join(', ')}
            </span>
          )}
        </div>
        <button
          onClick={() => setSurveyOpen(!isOpen)}
          className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${
            isOpen ? 'bg-green-700' : 'bg-red-900/70'
          }`}
        >
          {isOpen ? '🟢 Open — tap to close' : '🔒 Closed — tap to reopen'}
        </button>
      </div>

      {SURVEY_QUESTIONS.map((q, qi) => {
        const counts = tallyQuestion(responses, q)
        const total = counts.reduce((a, b) => a + b, 0)
        const max = Math.max(...counts, 1)
        return (
          <section key={q.id} className="space-y-2">
            <h2 className="font-bold">
              <span className="text-white/50 mr-2">{qi + 1}.</span>
              {q.question}
            </h2>
            <div className="space-y-1">
              {q.options.map((option, oi) => (
                <div key={oi} className="relative rounded-lg bg-white/10 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-white/20 transition-all"
                    style={{ width: `${(counts[oi] / max) * 100}%` }}
                  />
                  <div className="relative flex justify-between px-3 py-2 text-sm">
                    <span>{option}</span>
                    <span className="font-bold">{counts[oi]}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => useAsRound(q)}
              disabled={total === 0}
              className={`w-full rounded-lg py-2 text-sm font-bold disabled:opacity-30 ${
                loadedRound === q.id ? 'bg-green-800' : 'bg-white/15'
              }`}
            >
              {loadedRound === q.id
                ? '✅ Loaded — switch to FEUD on the host panel'
                : total === 0
                  ? 'No votes yet'
                  : '🎯 Use as Feud round'}
            </button>
          </section>
        )
      })}
    </div>
  )
}
