import { useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { GAMES, TEAMS, MAX_STRIKES } from '../lib/schema'
import { THEME } from '../lib/theme'
import { playCue } from '../lib/sounds'

/**
 * The TV / projector view (16:9). Read-only — it just renders the shared
 * state large and loud.
 */
export default function DisplayView({ state }) {
  useSoundCues(state?.soundCue)

  if (!state) return <Centered>Connecting…</Centered>

  return (
    <div className="h-full flex flex-col p-8 gap-6 overflow-hidden">
      <Scoreboard scores={state.scores} />

      <main className="flex-1 flex items-center justify-center relative">
        {state.currentGame === GAMES.LOBBY && <LobbyScreen />}
        {state.currentGame === GAMES.FEUD && <FeudBoard feudState={state.feudState} />}
        {state.currentGame === GAMES.POLL && <PollBoard pollState={state.pollState} />}
        {state.currentGame === GAMES.LYRIC && <LyricScreen lyricState={state.lyricState} />}

        <BuzzOverlay buzzerState={state.buzzerState} />
      </main>
    </div>
  )
}

/** Plays a synth cue whenever the host fires one (needs one click to unlock audio). */
function useSoundCues(soundCue) {
  const lastTs = useRef(null)
  useEffect(() => {
    if (!soundCue?.ts || soundCue.ts === lastTs.current) return
    // Skip the cue that's already in state when the display first loads
    if (lastTs.current !== null) playCue(soundCue.name)
    lastTs.current = soundCue.ts
  }, [soundCue])
}

function Scoreboard({ scores }) {
  return (
    <div className="grid grid-cols-2 gap-8">
      {Object.values(TEAMS).map((t) => (
        <div
          key={t.id}
          className={`rounded-2xl py-4 text-center ${
            t.id === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'
          }`}
        >
          <div className="text-lg tracking-widest uppercase text-white/80">{t.label}</div>
          <div className="text-7xl font-extrabold tabular-nums">{scores?.[t.id] ?? 0}</div>
        </div>
      ))}
    </div>
  )
}

function LobbyScreen() {
  const guestUrl = `${location.origin}${import.meta.env.BASE_URL}#/`
  return (
    <div className="text-center space-y-8">
      <h1 className="text-7xl font-extrabold">{THEME.title}</h1>
      <p className="text-2xl text-white/80">Scan to join a team</p>
      <div className="inline-block bg-white p-6 rounded-3xl">
        <QRCodeSVG value={guestUrl} size={280} />
      </div>
    </div>
  )
}

function FeudBoard({ feudState }) {
  const answers = feudState?.answers || []
  return (
    <div className="w-full max-w-5xl space-y-6">
      <h2 className="text-4xl font-bold text-center">{feudState?.question}</h2>
      <div className="grid grid-cols-2 gap-4">
        {answers.map((a, i) => (
          <div
            key={i}
            className={`rounded-xl px-6 py-5 flex justify-between text-3xl font-bold ${
              a.revealed ? 'bg-blue-700 animate-card-reveal' : 'bg-white/10'
            }`}
          >
            {a.revealed ? (
              <>
                <span>{a.text}</span>
                <span className="bg-blue-900 rounded-lg px-3">{a.points}</span>
              </>
            ) : (
              <span className="w-full text-center text-white/50">{i + 1}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4">
        {Array.from({ length: MAX_STRIKES }, (_, i) => (
          <span
            key={i}
            className={`text-7xl font-extrabold ${
              (feudState?.strikes || 0) > i
                ? 'text-red-500 animate-strike-flash'
                : 'text-white/10'
            }`}
          >
            ✕
          </span>
        ))}
      </div>
    </div>
  )
}

function PollBoard({ pollState }) {
  const { question, options = [], votes, isOpen, showResults } = pollState || {}
  const voteList = Object.values(votes || {})
  const counts = options.map(
    (o) => voteList.filter((v) => v.choice === o).length
  )
  const total = voteList.length || 1

  return (
    <div className="w-full max-w-4xl space-y-8">
      <h2 className="text-5xl font-bold text-center">{question || 'Live Poll'}</h2>
      {showResults ? (
        <div className="space-y-4">
          {options.map((o, i) => (
            <div key={o} className="space-y-1">
              <div className="flex justify-between text-2xl font-bold">
                <span>{o}</span>
                <span>{counts[i]}</span>
              </div>
              <div className="h-8 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    i % 2 === 0 ? 'bg-bride-a' : 'bg-bride-b'
                  }`}
                  style={{ width: `${(counts[i] / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-3xl text-white/70">
          {isOpen ? `🗳️ Voting open — ${voteList.length} votes in…` : 'Voting closed'}
        </p>
      )}
    </div>
  )
}

function LyricScreen({ lyricState }) {
  const { snippet, answer, showAnswer } = lyricState || {}

  if (!snippet) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-6xl font-extrabold">🎵 Finish the Lyric</h2>
        <p className="text-2xl text-white/70">Buzz in when you know it!</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl text-center space-y-10">
      <h2 className="text-3xl font-bold text-white/60">🎵 Finish the Lyric</h2>
      <p className="text-5xl font-extrabold leading-snug">“{snippet}”</p>
      {showAnswer ? (
        <p className="text-5xl font-extrabold text-green-400 animate-card-reveal">
          {answer}
        </p>
      ) : (
        <p className="text-2xl text-white/50">Buzz in when you know it!</p>
      )}
    </div>
  )
}

/** Full-screen takeover when somebody wins the buzz. */
function BuzzOverlay({ buzzerState }) {
  const winner = buzzerState?.firstBuzzed
  if (!winner) return null
  const teamColor = winner.team === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'
  return (
    <div
      className={`absolute inset-0 ${teamColor} rounded-3xl flex flex-col items-center justify-center animate-card-reveal`}
    >
      <div className="text-9xl">🔔</div>
      <div className="text-7xl font-extrabold">{winner.userName}</div>
      <div className="text-3xl text-white/80 mt-2">{TEAMS[winner.team]?.label}</div>
    </div>
  )
}

function Centered({ children }) {
  return (
    <div className="h-full flex items-center justify-center text-3xl">{children}</div>
  )
}
