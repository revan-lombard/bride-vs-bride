import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { GAMES, TEAMS, MAX_STRIKES } from '../lib/schema'
import { THEME } from '../lib/theme'
import { FEUD_ROUNDS, POLL_PRESETS, LYRIC_ROUNDS } from '../lib/rounds'
import {
  setCurrentGame,
  adjustScore,
  unlockBuzzers,
  lockBuzzers,
  openPoll,
  closePoll,
  showPollResults,
  loadFeudRound,
  revealFeudAnswer,
  setStrikes,
  loadLyric,
  showLyricAnswer,
  triggerSound,
  resetGame,
} from '../lib/gameActions'

/**
 * Host control panel — phone/laptop friendly. Everything is a direct write
 * to the shared state; guests and the display react instantly.
 */
export default function HostView({ state, connected }) {
  if (!state) return <p className="p-8 text-center">Connecting…</p>

  const guestUrl = `${location.origin}${import.meta.env.BASE_URL}#/`

  return (
    <div className="min-h-full max-w-2xl mx-auto p-4 space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🎛️ Host Panel</h1>
        <span className={`text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? '● live' : '● offline'}
        </span>
      </header>

      <Section title="Game">
        <div className="grid grid-cols-4 gap-2">
          {Object.values(GAMES).map((g) => (
            <button
              key={g}
              onClick={() => setCurrentGame(g)}
              className={`rounded-lg py-3 text-sm font-bold ${
                state.currentGame === g ? 'bg-white text-stage' : 'bg-white/15'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Scores">
        <div className="grid grid-cols-2 gap-3">
          {Object.values(TEAMS).map((t) => (
            <div
              key={t.id}
              className={`rounded-xl p-3 text-center ${
                t.id === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'
              }`}
            >
              <div className="text-xs">{t.label}</div>
              <div className="text-3xl font-extrabold">{state.scores?.[t.id] ?? 0}</div>
              <div className="flex justify-center gap-2 mt-2">
                {[-10, -5, +5, +10].map((d) => (
                  <button
                    key={d}
                    onClick={() => adjustScore(t.id, d)}
                    className="bg-black/30 rounded px-2 py-1 text-sm font-bold"
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buzzers">
        <BuzzerControls buzzerState={state.buzzerState} />
      </Section>

      {state.currentGame === GAMES.POLL && (
        <Section title="Poll">
          <PollControls pollState={state.pollState} />
        </Section>
      )}

      {state.currentGame === GAMES.FEUD && (
        <Section title="Family Feud">
          <FeudControls feudState={state.feudState} />
        </Section>
      )}

      {state.currentGame === GAMES.LYRIC && (
        <Section title="Finish the Lyric">
          <LyricControls lyricState={state.lyricState} />
        </Section>
      )}

      <Section title="Sounds">
        <div className="grid grid-cols-4 gap-2">
          {[
            ['buzz', '🔔'],
            ['correct', '✅'],
            ['strike', '❌'],
            ['fanfare', '🎺'],
          ].map(([name, icon]) => (
            <button
              key={name}
              onClick={() => triggerSound(name)}
              className="bg-white/15 rounded-lg py-3 text-xl"
              title={name}
            >
              {icon}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Guest link">
        <div className="flex items-center gap-4 bg-white rounded-xl p-3">
          <QRCodeSVG value={guestUrl} size={96} />
          <code className="text-stage text-xs break-all">{guestUrl}</code>
        </div>
      </Section>

      <button
        onClick={() => confirm('Reset ALL scores and game state?') && resetGame()}
        className="w-full rounded-lg bg-red-900/60 py-3 text-sm font-bold"
      >
        ⚠️ Reset everything
      </button>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs uppercase tracking-widest text-white/50">{title}</h2>
      {children}
    </section>
  )
}

function BuzzerControls({ buzzerState }) {
  const { isUnlocked, firstBuzzed } = buzzerState || {}
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={unlockBuzzers}
          className="flex-1 rounded-lg bg-green-700 py-3 font-bold"
        >
          🔓 Arm buzzers
        </button>
        <button
          onClick={lockBuzzers}
          className="flex-1 rounded-lg bg-white/15 py-3 font-bold"
        >
          🔒 Lock
        </button>
      </div>
      <div className="bg-white/10 rounded-lg p-3 text-center text-sm">
        {firstBuzzed ? (
          <>
            <b>{firstBuzzed.userName}</b> ({TEAMS[firstBuzzed.team]?.label}) buzzed first
          </>
        ) : isUnlocked ? (
          'Buzzers armed — waiting…'
        ) : (
          'Buzzers locked'
        )}
      </div>
    </div>
  )
}

function PollControls({ pollState }) {
  const [question, setQuestion] = useState('')
  const [optionsText, setOptionsText] = useState(`${THEME.brideA}\n${THEME.brideB}`)
  const voteCount = Object.keys(pollState?.votes || {}).length

  return (
    <div className="space-y-2">
      <ContentBank
        items={POLL_PRESETS}
        label={(p) => p.question}
        onPick={(p) => {
          setQuestion(p.question)
          setOptionsText(p.options.join('\n'))
        }}
      />
      <input
        className="w-full rounded-lg bg-white/10 px-3 py-2"
        placeholder="Poll question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <textarea
        className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm"
        rows={3}
        placeholder="One option per line"
        value={optionsText}
        onChange={(e) => setOptionsText(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          onClick={() =>
            openPoll(question, optionsText.split('\n').map((s) => s.trim()).filter(Boolean))
          }
          className="flex-1 rounded-lg bg-green-700 py-2 font-bold"
        >
          Open poll
        </button>
        <button onClick={closePoll} className="flex-1 rounded-lg bg-white/15 py-2">
          Close
        </button>
        <button
          onClick={() => showPollResults(!pollState?.showResults)}
          className="flex-1 rounded-lg bg-white/15 py-2"
        >
          {pollState?.showResults ? 'Hide results' : 'Show results'}
        </button>
      </div>
      <p className="text-xs text-white/50 text-center">
        {pollState?.isOpen ? `Poll open — ${voteCount} votes` : 'Poll closed'}
      </p>
    </div>
  )
}

function FeudControls({ feudState }) {
  const [draft, setDraft] = useState('')
  const answers = feudState?.answers || []

  // Round format: first line = question, then "answer | points" per line
  const loadRound = () => {
    const [q, ...lines] = draft.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!q) return
    const parsed = lines.map((line) => {
      const [text, points] = line.split('|').map((s) => s.trim())
      return { text, points: Number(points) || 0 }
    })
    loadFeudRound(q, parsed)
  }

  const revealedPoints = answers
    .filter((a) => a.revealed)
    .reduce((sum, a) => sum + (a.points || 0), 0)

  return (
    <div className="space-y-2">
      <ContentBank
        items={FEUD_ROUNDS}
        label={(r) => r.question}
        onPick={(r) => loadFeudRound(r.question, r.answers)}
      />
      <p className="text-xs text-white/40">
        Survey boards load from the <a href="#/survey-results" className="underline">survey results</a> page.
      </p>
      <textarea
        className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm font-mono"
        rows={5}
        placeholder={'Question on first line\nTop answer | 40\nSecond answer | 25'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button onClick={loadRound} className="w-full rounded-lg bg-green-700 py-2 font-bold">
        Load round
      </button>

      {feudState?.question && (
        <div className="space-y-1">
          <p className="text-sm font-bold">{feudState.question}</p>
          {answers.map((a, i) => (
            <button
              key={i}
              onClick={() => revealFeudAnswer(i, !a.revealed)}
              className={`w-full flex justify-between rounded-lg px-3 py-2 text-sm ${
                a.revealed ? 'bg-green-800' : 'bg-white/15'
              }`}
            >
              <span>
                {i + 1}. {a.text}
              </span>
              <span className="font-bold">{a.points}</span>
            </button>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm">Strikes:</span>
            {Array.from({ length: MAX_STRIKES }, (_, i) => (
              <button
                key={i}
                onClick={() => setStrikes(feudState.strikes === i + 1 ? i : i + 1)}
                className={`h-9 w-9 rounded-lg font-extrabold ${
                  (feudState.strikes || 0) > i ? 'bg-red-600' : 'bg-white/15'
                }`}
              >
                ✕
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {Object.values(TEAMS).map((t) => (
              <button
                key={t.id}
                onClick={() => adjustScore(t.id, revealedPoints)}
                disabled={revealedPoints === 0}
                className={`rounded-lg py-2 text-sm font-bold disabled:opacity-30 ${
                  t.id === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'
                }`}
              >
                🏆 +{revealedPoints} → {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LyricControls({ lyricState }) {
  const [snippet, setSnippet] = useState('')
  const [answer, setAnswer] = useState('')

  return (
    <div className="space-y-2">
      <ContentBank
        items={LYRIC_ROUNDS}
        label={(l) => l.song || l.snippet}
        onPick={(l) => loadLyric(l.snippet, l.answer)}
      />
      <input
        className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm"
        placeholder="Lyric shown on the TV (stop where they must finish it…)"
        value={snippet}
        onChange={(e) => setSnippet(e.target.value)}
      />
      <input
        className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm"
        placeholder="The missing words (revealed by you)"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <button
        onClick={() => snippet.trim() && loadLyric(snippet.trim(), answer.trim())}
        className="w-full rounded-lg bg-green-700 py-2 font-bold"
      >
        Show on TV
      </button>

      {lyricState?.snippet && (
        <div className="bg-white/10 rounded-lg p-3 space-y-2 text-sm">
          <p>🎵 “{lyricState.snippet}”</p>
          <p className={lyricState.showAnswer ? 'text-green-400' : 'text-white/40'}>
            → {lyricState.answer || '(no answer set)'}
          </p>
          <button
            onClick={() => showLyricAnswer(!lyricState.showAnswer)}
            className={`w-full rounded-lg py-2 font-bold ${
              lyricState.showAnswer ? 'bg-white/15' : 'bg-green-700'
            }`}
          >
            {lyricState.showAnswer ? 'Hide answer' : '✨ Reveal answer'}
          </button>
        </div>
      )}
    </div>
  )
}

/** Numbered one-tap load buttons for pre-written content from rounds.js. */
function ContentBank({ items, label, onPick }) {
  if (!items.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => onPick(item)}
          title={label(item)}
          className="rounded-lg bg-white/15 px-3 py-2 text-xs font-bold max-w-full truncate"
        >
          {i + 1}. {label(item)}
        </button>
      ))}
    </div>
  )
}
