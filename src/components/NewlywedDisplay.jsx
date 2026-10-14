import { TEAMS, brideName, whoSaidText } from '../lib/schema'

/**
 * Bride Knows Best on the TV. Bride rounds: one panel per bride — locked-in
 * status while guessing, then her secret answer and how her team did.
 * Who-said-it rounds: the quote, then the bride's name and the vote split.
 */
export default function NewlywedDisplay({ nw }) {
  const { kind, question, brideAnswers, guesses, revealed, answer, results } = nw || {}
  const whosaid = kind === 'whosaid'
  const guessList = Object.values(guesses || {})

  if (!question) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-6xl font-extrabold">💑 Bride Knows Best</h2>
        <p className="text-2xl text-white/70">How well do you know your bride?</p>
      </div>
    )
  }

  if (whosaid) {
    const votes = (t) => guessList.filter((g) => g.choice === t).length
    const total = guessList.length || 1
    return (
      <div className="w-full max-w-5xl text-center space-y-10">
        <h2 className="text-3xl font-bold text-white/60">🗨️ Who said it?</h2>
        <p className="text-6xl font-extrabold leading-tight">{whoSaidText(question)}</p>
        {revealed ? (
          <div className="space-y-6 animate-card-reveal">
            <p className={`text-7xl font-extrabold ${answer === 'teamA' ? 'text-bride-a' : 'text-bride-b'}`}>
              👰 {brideName(answer)}!
            </p>
            <div className="flex h-12 rounded-full overflow-hidden text-xl font-bold">
              {['teamA', 'teamB'].map((t) => (
                <div
                  key={t}
                  className={`${t === 'teamA' ? 'bg-bride-a' : 'bg-bride-b'} flex items-center justify-center transition-all duration-700`}
                  style={{ width: `${(votes(t) / total) * 100}%` }}
                >
                  {votes(t) > 0 && `${brideName(t)} ${votes(t)}`}
                </div>
              ))}
            </div>
            <TeamResults results={results} />
          </div>
        ) : (
          <p className="text-3xl text-white/70 animate-buzz-pulse">
            📱 Vote on your phone — {guessList.length} guesses in…
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl text-center space-y-10">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white/60">🤫 The brides answered secretly…</h2>
        <p className="text-6xl font-extrabold">{question}</p>
      </div>
      <div className="grid grid-cols-2 gap-10">
        {['teamA', 'teamB'].map((team) => {
          const locked = Boolean(brideAnswers?.[team])
          const teamGuesses = guessList.filter((g) => g.team === team).length
          const r = results?.[team]
          return (
            <div
              key={team}
              className={`rounded-3xl p-8 space-y-4 ${team === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'}`}
            >
              <p className="text-3xl font-bold">👰 {brideName(team)}</p>
              {revealed ? (
                <div className="space-y-3 animate-card-reveal">
                  <p className="text-5xl font-extrabold text-yellow-300">{brideAnswers?.[team]}</p>
                  <p className="text-2xl">
                    {r?.correct ?? 0} of {r?.voters ?? 0} guessed right · <b>+{r?.points ?? 0}</b>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-4xl">{locked ? '🔒 Locked in' : '⏳ Thinking…'}</p>
                  <p className="text-xl text-white/70">
                    {teamGuesses} guess{teamGuesses === 1 ? '' : 'es'} from {TEAMS[team].label}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {!revealed && <p className="text-2xl text-white/60">📱 What did YOUR bride pick? Guess on your phone!</p>}
    </div>
  )
}


function TeamResults({ results }) {
  return (
    <div className="flex justify-center gap-12 text-2xl">
      {['teamA', 'teamB'].map((t) => (
        <span key={t} className={t === 'teamA' ? 'text-bride-a' : 'text-bride-b'}>
          {TEAMS[t].label}: {results?.[t]?.correct ?? 0}/{results?.[t]?.voters ?? 0} right · +{results?.[t]?.points ?? 0}
        </span>
      ))}
    </div>
  )
}
