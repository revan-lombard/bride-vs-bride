import { useState } from 'react'
import { useSurvey } from '../hooks/useSurvey'
import { SURVEY_QUESTIONS } from '../lib/surveyQuestions'
import {
  loadRespondent,
  saveRespondent,
  submitSurveyResponse,
} from '../lib/surveyActions'

/**
 * Standalone pre-event survey — the URL sent out with the invites.
 * One response set per device; answers can be changed until submitted.
 * Deliberately shares no chrome with the game views.
 */
export default function SurveyView() {
  const { loaded, isOpen } = useSurvey()
  const [respondent, setRespondent] = useState(loadRespondent)
  const [answers, setAnswers] = useState(respondent?.answers || {})
  const [submitted, setSubmitted] = useState(respondent?.submitted || false)
  const [saving, setSaving] = useState(false)

  if (!loaded) return <Splash text="Loading…" />
  if (submitted) return <ThankYou name={respondent?.name} />
  if (!isOpen) return <Splash text="This survey has closed — see you at the kitchen tea! 💍" />
  if (!respondent) return <Welcome onStart={setRespondent} />

  const answeredCount = SURVEY_QUESTIONS.filter(
    (q) => answers[q.id] !== undefined
  ).length
  const allAnswered = answeredCount === SURVEY_QUESTIONS.length

  const pick = (questionId, optionIndex) => {
    const next = { ...answers, [questionId]: optionIndex }
    setAnswers(next)
    saveRespondent({ ...respondent, answers: next })
  }

  const submit = async () => {
    if (!allAnswered || saving) return
    setSaving(true)
    try {
      await submitSurveyResponse(respondent, answers)
      saveRespondent({ ...respondent, answers, submitted: true })
      setSubmitted(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-full max-w-lg mx-auto p-5 pb-28 space-y-8">
      <header className="text-center space-y-1 pt-4">
        <h1 className="text-2xl font-bold">💍 Bride vs. Bride</h1>
        <p className="text-white/70 text-sm">
          Help us build the game! Your answers become the Family Feud boards
          on the day — pick the answer <b>you</b> would give.
        </p>
      </header>

      {SURVEY_QUESTIONS.map((q, qi) => (
        <section key={q.id} className="space-y-2">
          <h2 className="font-bold">
            <span className="text-white/50 mr-2">{qi + 1}.</span>
            {q.question}
          </h2>
          <div className="space-y-2">
            {q.options.map((option, oi) => (
              <button
                key={oi}
                onClick={() => pick(q.id, oi)}
                className={`w-full text-left rounded-xl px-4 py-3 transition ${
                  answers[q.id] === oi
                    ? 'bg-white text-stage font-bold ring-4 ring-white/40'
                    : 'bg-white/10 active:bg-white/25'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>
      ))}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-stage via-stage/95 to-transparent">
        <button
          onClick={submit}
          disabled={!allAnswered || saving}
          className="w-full max-w-lg mx-auto block rounded-xl bg-white text-stage font-bold py-3 text-lg disabled:opacity-40"
        >
          {saving
            ? 'Sending…'
            : allAnswered
              ? 'Lock in my answers 🎉'
              : `Answered ${answeredCount} of ${SURVEY_QUESTIONS.length}`}
        </button>
      </div>
    </div>
  )
}

function Welcome({ onStart }) {
  const [name, setName] = useState('')

  const start = () =>
    onStart(
      saveAndReturn({
        id: crypto.randomUUID(),
        name: name.trim(),
        answers: {},
      })
    )

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 gap-6 text-center">
      <h1 className="text-3xl font-bold">💍 Bride vs. Bride</h1>
      <p className="text-white/70 max-w-xs">
        A few quick questions before the kitchen tea — your answers secretly
        build the game we'll play on the day. No wrong answers!
      </p>
      <input
        className="w-full max-w-xs rounded-xl bg-white/10 px-4 py-3 text-lg text-center outline-none focus:ring-2 ring-white/50"
        placeholder="Your name (optional)"
        value={name}
        maxLength={20}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        onClick={start}
        className="w-full max-w-xs rounded-xl bg-white text-stage font-bold py-3 text-lg"
      >
        Start the survey ✨
      </button>
    </div>
  )
}

function saveAndReturn(respondent) {
  saveRespondent(respondent)
  return respondent
}

function ThankYou({ name }) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 gap-4 text-center">
      <div className="text-6xl">🥂</div>
      <h1 className="text-2xl font-bold">
        Thank you{name ? `, ${name}` : ''}!
      </h1>
      <p className="text-white/70 max-w-xs">
        Your answers are locked in. See you at the kitchen tea — come ready to
        guess what everyone else said!
      </p>
    </div>
  )
}

function Splash({ text }) {
  return (
    <div className="min-h-full flex items-center justify-center p-6 text-center text-xl text-white/80">
      {text}
    </div>
  )
}
