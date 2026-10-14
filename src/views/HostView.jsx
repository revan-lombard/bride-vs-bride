import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { GAMES, TEAMS, MAX_STRIKES, BUZZER_GAMES, brideName, brideTeamOf } from '../lib/schema'
import { THEME } from '../lib/theme'
import { FEUD_ROUNDS, POLL_PRESETS, LYRIC_ROUNDS, NOOT_ROUNDS, NEWLYWED_ROUNDS } from '../lib/rounds'
import {
  setCurrentGame,
  adjustScore,
  unlockBuzzers,
  lockBuzzers,
  awardBuzzWinner,
  openPoll,
  closePoll,
  showPollResults,
  loadFeudRound,
  revealFeudAnswer,
  setStrikes,
  loadLyric,
  showLyricAnswer,
  triggerLyricPlayback,
  loadNootRound,
  triggerNootPlayback,
  revealNootAnswer,
  newBingoGame,
  setBingoPattern,
  drawBingoBall,
  toggleGift,
  continueBingo,
  renamePlayer,
  movePlayer,
  removePlayer,
  setPlayerRole,
  loadNewlywedRound,
  setBrideAnswer,
  revealNewlywed,
  startTimer,
  clearTimer,
  triggerSound,
  setReactionsOn,
  resetGame,
} from '../lib/gameActions'
import { PATTERNS, BINGO_MAX, MODES, GIFT_COUNT, ballLabel, giftWord, isGiftMode } from '../lib/bingo'
import { useBingoDraw } from '../hooks/useBingoDraw'
import { CUE_NAMES } from '../lib/sounds'
import BingoBall from '../components/BingoBall'
import { appUrl, IS_REHEARSAL, switchMode } from '../lib/mode'
import { OfflinePill } from '../components/ConnectionStatus'
import InstallButton from '../components/InstallButton'
import { useWakeLock } from '../hooks/useWakeLock'

/**
 * Host control panel — phone/laptop friendly. Everything is a direct write
 * to the shared state; guests and the display react instantly.
 */
export default function HostView({ state, connected }) {
  useWakeLock()
  if (!state) return <p className="p-8 text-center">Connecting…</p>

  const guestUrl = appUrl('/')

  return (
    <div className="min-h-full max-w-2xl mx-auto p-4 space-y-6 pb-24">
      <OfflinePill connected={connected} label="Host offline" />
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">🎛️ Host Panel{IS_REHEARSAL && ' 🧪'}</h1>
        <span className={`text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? '● live' : '● offline'}
        </span>
      </header>

      <Section title="Game">
        <div className="grid grid-cols-3 gap-2">
          {Object.values(GAMES).map((g) => (
            <button
              key={g}
              onClick={() => setCurrentGame(g)}
              className={`rounded-lg py-3 text-xs font-bold ${
                state.currentGame === g ? 'bg-white text-stage' : 'bg-white/15'
              }`}
            >
              {g === 'WINNER' ? '🏆 WINNER' : g}
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

      <Roster players={state.players} />

      {BUZZER_GAMES.includes(state.currentGame) && (
        <Section title="Buzzers">
          <BuzzerControls buzzerState={state.buzzerState} canAward={state.currentGame === GAMES.LYRIC} />
        </Section>
      )}

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

      {state.currentGame === GAMES.NOOT && (
        <Section title="Noot vir Noot">
          <NootControls nootState={state.nootState} />
        </Section>
      )}

      {state.currentGame === GAMES.NEWLYWED && (
        <Section title="Bride Knows Best">
          <NewlywedControls nw={state.newlywedState} players={state.players} />
        </Section>
      )}

      {state.currentGame === GAMES.BINGO && (
        <Section title="Bridal Bingo">
          <BingoControls bingoState={state.bingoState} />
        </Section>
      )}

      <Section title="Timer (on the TV)">
        <div className="grid grid-cols-4 gap-2">
          {[30, 60, 90].map((s) => (
            <button
              key={s}
              onClick={() => startTimer(s)}
              className="rounded-lg bg-white/15 py-3 text-sm font-bold"
            >
              ⏱ {s}s
            </button>
          ))}
          <button
            onClick={clearTimer}
            className="rounded-lg bg-white/15 py-3 text-sm font-bold"
          >
            Clear
          </button>
        </div>
      </Section>

      <Section title="Emoji reactions">
        <button
          onClick={() => setReactionsOn(state.reactionsOn === false)}
          className={`w-full rounded-lg py-3 text-sm font-bold ${
            state.reactionsOn === false ? 'bg-white/15' : 'bg-green-700'
          }`}
        >
          {state.reactionsOn === false
            ? '😶 Off — tap to let guests send 😂❤️🎉 to the TV'
            : '😂 On — guests’ emojis float up the TV (tap to turn off)'}
        </button>
      </Section>

      <Section title="Sounds">
        <div className="grid grid-cols-4 gap-2">
          {SOUNDBOARD.filter(([name]) => CUE_NAMES.includes(name)).map(([name, icon, label]) => (
            <button
              key={name}
              onClick={() => triggerSound(name)}
              className="bg-white/15 rounded-lg py-2 flex flex-col items-center"
              title={name}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-[10px] text-white/60">{label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-white/40">
          Buzzes, reveals, strikes, scores, timers and bingo play their sounds on the TV automatically —
          these are extras.
        </p>
      </Section>

      <details className="group">
        <summary className="text-xs uppercase tracking-widest text-white/50 cursor-pointer list-none">
          ⚙️ Setup &amp; guest link <span className="group-open:hidden">▸</span><span className="hidden group-open:inline">▾</span>
        </summary>
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-4 bg-white rounded-xl p-3">
            <QRCodeSVG value={guestUrl} size={96} />
            <code className="text-stage text-xs break-all">{guestUrl}</code>
          </div>
          <InstallButton className="w-full" />
          <div className="rounded-xl bg-amber-400/15 p-3 space-y-2 text-sm">
            <p>
              {IS_REHEARSAL
                ? '🧪 You are in rehearsal mode — a separate practice copy of the game. Live scores are untouched.'
                : 'Practise the show without touching the live game: rehearsal mode uses a separate copy of everything.'}
            </p>
            <button
              onClick={() => switchMode(!IS_REHEARSAL)}
              className="w-full rounded-lg bg-amber-400 text-stage py-2 font-bold"
            >
              {IS_REHEARSAL ? '🎬 Back to the live game' : '🧪 Switch to rehearsal'}
            </button>
            {IS_REHEARSAL && (
              <p className="text-xs text-white/60">
                Open the TV at <code className="break-all">{appUrl('/display')}</code> — the QR code above already
                points guests at the rehearsal.
              </p>
            )}
          </div>
          <button
            onClick={() => confirm(IS_REHEARSAL ? 'Reset the REHEARSAL game?' : 'Reset ALL scores and game state?') && resetGame()}
            className="w-full rounded-lg bg-red-900/60 py-3 text-sm font-bold"
          >
            ⚠️ Reset everything
          </button>
        </div>
      </details>
    </div>
  )
}

const SOUNDBOARD = [
  ['buzz', '🔔', 'buzz'],
  ['correct', '✅', 'ding'],
  ['strike', '❌', 'wrong'],
  ['fanfare', '🎺', 'fanfare'],
  ['drumroll', '🥁', 'drumroll'],
  ['winner', '👏', 'applause'],
  ['timesUp', '📯', 'horn'],
  ['whoosh', '💨', 'whoosh'],
]

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs uppercase tracking-widest text-white/50">{title}</h2>
      {children}
    </section>
  )
}

function BuzzerControls({ buzzerState, canAward }) {
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
      {canAward && firstBuzzed && (
        <div className="flex gap-2">
          {[5, 10].map((pts) => (
            <button
              key={pts}
              onClick={() => awardBuzzWinner(firstBuzzed, pts)}
              className="flex-1 rounded-lg bg-green-700 py-2 text-sm font-bold"
            >
              ✅ +{pts} to {firstBuzzed.userName}
            </button>
          ))}
          <button onClick={unlockBuzzers} className="flex-1 rounded-lg bg-red-900/70 py-2 text-sm font-bold">
            ❌ Wrong — re-arm
          </button>
        </div>
      )}
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
        onPick={(p) => openPoll(p.question, p.options)}
      />
      <ManualEntry>
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
        <button
          onClick={() =>
            openPoll(question, optionsText.split('\n').map((s) => s.trim()).filter(Boolean))
          }
          className="w-full rounded-lg bg-green-700 py-2 font-bold"
        >
          Open poll
        </button>
      </ManualEntry>
      <div className="flex gap-2">
        <button onClick={closePoll} className="flex-1 rounded-lg bg-white/15 py-2">
          Close voting
        </button>
        <button
          onClick={() => showPollResults(!pollState?.showResults)}
          className="flex-1 rounded-lg bg-green-700 py-2 font-bold"
        >
          {pollState?.showResults ? 'Hide results' : '📊 Show results'}
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

  return (
    <div className="space-y-2">
      <ContentBank
        items={FEUD_ROUNDS}
        label={(r) => r.question}
        onPick={(r) => loadFeudRound(r.question, r.answers)}
      />
      <p className="text-xs text-white/40">
        Survey boards load from the <a href="#/survey-results" className="underline">survey results</a> page.
        Correct picks score automatically.
      </p>
      <ManualEntry>
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
      </ManualEntry>

      {feudState?.question && (
        <div className="space-y-1">
          <p className="text-sm font-bold">{feudState.question}</p>
          {feudState.lastGuess && (
            <div
              className={`rounded-lg p-2 text-sm text-center ${
                feudState.lastGuess.correct ? 'bg-green-800' : 'bg-red-900/70'
              }`}
            >
              <b>{feudState.lastGuess.userName}</b> ({TEAMS[feudState.lastGuess.team]?.label}) picked
              “{feudState.lastGuess.choice}” —{' '}
              {feudState.lastGuess.correct ? '✅ on the board!' : '❌ strike'}
            </div>
          )}
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
        label={(l) => `${l.audio ? '🎵 ' : ''}${l.song || l.snippet}`}
        onPick={(l) => loadLyric(l.snippet, l.answer, l.audio || '', l.cutAt || 0)}
      />
      <ManualEntry>
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
      </ManualEntry>

      {lyricState?.snippet && (
        <div className="bg-white/10 rounded-lg p-3 space-y-2 text-sm">
          <p>🎵 “{lyricState.snippet}”</p>
          <p className={lyricState.showAnswer ? 'text-green-400' : 'text-white/40'}>
            → {lyricState.answer || '(no answer set)'}
          </p>
          {lyricState.audio && (
            <div className="flex gap-2">
              <button
                onClick={() => triggerLyricPlayback('play')}
                className="flex-1 rounded-lg bg-green-700 py-2 font-bold"
              >
                ▶️ Play on TV
              </button>
              <button
                onClick={() => triggerLyricPlayback('stop')}
                className="flex-1 rounded-lg bg-white/15 py-2 font-bold"
              >
                ⏹ Stop
              </button>
            </div>
          )}
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

function NootControls({ nootState }) {
  const loaded = (nootState?.options || []).length > 0
  return (
    <div className="space-y-2">
      <ContentBank
        items={NOOT_ROUNDS}
        label={(r) => `${r.audio ? '🎵 ' : ''}${r.song}`}
        onPick={(r) => loadNootRound(r)}
      />
      <p className="text-xs text-white/40">
        Play the clip, arm the buzzers — the winner picks the song on their phone.
        Correct picks score {nootState?.points || 10} points automatically.
      </p>

      {loaded && (
        <div className="bg-white/10 rounded-lg p-3 space-y-2 text-sm">
          <p>
            Answer: <b className={nootState.revealed ? 'text-green-400' : ''}>{nootState.correct}</b>
          </p>
          {nootState.lastGuess && (
            <div
              className={`rounded-lg p-2 text-center ${
                nootState.lastGuess.correct ? 'bg-green-800' : 'bg-red-900/70'
              }`}
            >
              <b>{nootState.lastGuess.userName}</b> ({TEAMS[nootState.lastGuess.team]?.label}) picked
              “{nootState.lastGuess.choice}” —{' '}
              {nootState.lastGuess.correct ? `✅ +${nootState.points} points!` : '❌ wrong'}
            </div>
          )}
          {nootState.audio && (
            <div className="flex gap-2">
              <button
                onClick={() => triggerNootPlayback('play')}
                className="flex-1 rounded-lg bg-green-700 py-2 font-bold"
              >
                ▶️ Play clip on TV
              </button>
              <button
                onClick={() => triggerNootPlayback('stop')}
                className="flex-1 rounded-lg bg-white/15 py-2 font-bold"
              >
                ⏹ Stop
              </button>
            </div>
          )}
          <button
            onClick={() => revealNootAnswer(!nootState.revealed)}
            className={`w-full rounded-lg py-2 font-bold ${
              nootState.revealed ? 'bg-white/15' : 'bg-green-700'
            }`}
          >
            {nootState.revealed ? 'Hide answer' : '✨ Reveal answer'}
          </button>
        </div>
      )}
    </div>
  )
}

function BingoControls({ bingoState }) {
  const { seed, drawn = [], pattern = 'line', winner, winners = [] } = bingoState || {}
  const gifts = isGiftMode(bingoState)
  const { spinning } = useBingoDraw(bingoState)
  const [auto, setAuto] = useState(false)
  const [dealMode, setDealMode] = useState(bingoState?.mode || 'numbers')
  const done = drawn.length >= BINGO_MAX
  const autoOn = auto && Boolean(seed) && !gifts && !winner && !done

  // Auto-draw: a new ball every 12s (spin + time to mark) until someone
  // claims. Runs on this device, so keep the host screen awake.
  useEffect(() => {
    if (!autoOn) return
    const t = setInterval(drawBingoBall, 12000)
    return () => clearInterval(t)
  }, [autoOn])

  const deal = () => {
    if (seed && drawn.length && !winner && !confirm('Deal new cards? Everyone gets a fresh card.')) return
    setAuto(false)
    newBingoGame(pattern, dealMode)
  }

  const pastPatterns = new Set([...winners.map((w) => w?.pattern), winner?.pattern])
  const nextPatterns = Object.values(PATTERNS).filter((p) => !pastPatterns.has(p.id))

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-white/50">{seed ? 'Next deal:' : 'Play with:'}</span>
        {Object.values(MODES).map((m) => (
          <button
            key={m.id}
            onClick={() => setDealMode(m.id)}
            className={`rounded-lg px-3 py-1.5 font-bold ${dealMode === m.id ? 'bg-white text-stage' : 'bg-white/15'}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Object.values(PATTERNS).map((p) => (
          <button
            key={p.id}
            onClick={() => setBingoPattern(p.id)}
            className={`rounded-lg py-2 text-xs font-bold ${
              pattern === p.id ? 'bg-white text-stage' : 'bg-white/15'
            }`}
          >
            {p.label}
            <div className="font-normal opacity-70">{p.points} pts</div>
          </button>
        ))}
      </div>

      {!seed ? (
        <button onClick={deal} className="w-full rounded-lg bg-green-700 py-4 text-lg font-bold">
          🃏 Deal cards &amp; start
        </button>
      ) : (
        <>
          {winner ? (
            <div className="rounded-xl bg-yellow-300 text-stage p-3 space-y-2">
              <p className="text-center font-bold">
                🎉 {winner.userName} ({TEAMS[winner.team]?.label}) — {PATTERNS[winner.pattern]?.label}!
                <br />
                <span className="text-sm font-normal">+{winner.points} points added automatically</span>
              </p>
              {nextPatterns.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {nextPatterns.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => continueBingo(bingoState, p.id)}
                      className="rounded-lg bg-stage text-white px-3 py-2 text-sm font-bold"
                    >
                      ▶️ Continue for {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : gifts ? null : (
            <div className="flex gap-2">
              <button
                onClick={drawBingoBall}
                disabled={spinning || done}
                className="flex-[2] rounded-lg bg-green-700 py-4 text-lg font-bold disabled:opacity-40"
              >
                {done ? 'All balls drawn' : spinning ? '🌀 Spinning…' : '🎱 Draw ball'}
              </button>
              <button
                onClick={() => setAuto(!auto)}
                className={`flex-1 rounded-lg py-4 text-sm font-bold ${autoOn ? 'bg-yellow-300 text-stage' : 'bg-white/15'}`}
              >
                {autoOn ? '⏸ Auto on' : '⏩ Auto-draw'}
              </button>
            </div>
          )}

          {gifts ? (
            <GiftPicker drawn={drawn} onDeal={deal} />
          ) : (
          <div className="bg-white/10 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                Ball {drawn.length} / {BINGO_MAX}
                {drawn.length > 0 && ` · last: ${ballLabel(drawn[drawn.length - 1])}`}
              </span>
              <button onClick={deal} className="rounded bg-white/15 px-2 py-1 text-xs font-bold">
                🃏 New cards
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {[...drawn].reverse().map((n) => (
                <BingoBall key={n} number={n} size={34} />
              ))}
            </div>
          </div>
          )}
        </>
      )}
      <p className="text-xs text-white/40">
        Guests tap the called {gifts ? 'gifts' : 'numbers'} on their own card; the BINGO button only lights up for a real win,
        and the first claim scores automatically.
      </p>
    </div>
  )
}

/** 👰 button cycles: guest → bride A → bride B → guest. */
const ROLE_CYCLE = { '': 'brideA', brideA: 'brideB', brideB: null }

/** Live list of who has joined, with fix-ups: rename, switch team, remove. */
function Roster({ players }) {
  const list = Object.entries(players || {})
    .map(([id, p]) => ({ id, ...p }))
    .filter((p) => p.userName && !p.kicked)
    .sort((a, b) => Number(b.online === true) - Number(a.online === true) || (a.joinedAt || 0) - (b.joinedAt || 0))
  const online = list.filter((p) => p.online === true)
  const nameCount = list.reduce((m, p) => {
    const k = p.userName.trim().toLowerCase()
    m[k] = (m[k] || 0) + 1
    return m
  }, {})
  const teamCount = (team) => online.filter((p) => p.team === team).length

  const rename = (p) => {
    const name = prompt(`Rename ${p.userName} to:`, p.userName)?.trim()
    if (name && name !== p.userName) renamePlayer(p.id, name.slice(0, 20))
  }

  return (
    <details className="group rounded-xl bg-white/5 p-3">
      <summary className="cursor-pointer list-none flex items-center justify-between text-sm">
        <span>
          👥 <b>{online.length}</b> online
          <span className="text-white/50">
            {' '}
            · {TEAMS.teamA.label} {teamCount('teamA')} · {TEAMS.teamB.label} {teamCount('teamB')}
          </span>
        </span>
        <span className="text-white/50 group-open:hidden">▸</span>
        <span className="text-white/50 hidden group-open:inline">▾</span>
      </summary>
      <div className="pt-3 space-y-1">
        {!list.length && <p className="text-sm text-white/50">Nobody has joined yet.</p>}
        {list.map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5 text-sm">
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${p.online === true ? 'bg-green-400' : 'bg-white/20'}`}
              title={p.online === true ? 'Online' : 'Offline (phone asleep or left)'}
            />
            <span className={`flex-1 truncate ${p.online === true ? '' : 'text-white/40'}`}>
              {p.userName}
              {p.points > 0 && <span className="ml-1 text-xs text-yellow-300">⭐{p.points}</span>}
              {nameCount[p.userName.trim().toLowerCase()] > 1 && (
                <span className="ml-1 text-xs text-yellow-300" title="Two players share this name">⚠️ same name</span>
              )}
            </span>
            <span
              className={`rounded px-1.5 text-xs ${p.team === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'}`}
            >
              {TEAMS[p.team]?.label.replace('Team ', '')}
            </span>
            <button
              onClick={() => setPlayerRole(p.id, ROLE_CYCLE[p.role || ''])}
              className={`rounded px-2 py-1 ${p.role ? 'bg-yellow-300 text-stage' : 'bg-white/10'}`}
              title="Mark as bride (tap to cycle)"
            >
              👰{p.role && <span className="text-[10px] font-bold ml-0.5">{brideName(brideTeamOf(p.role)).slice(0, 3)}</span>}
            </button>
            <button onClick={() => rename(p)} className="rounded bg-white/10 px-2 py-1" title="Rename">
              ✏️
            </button>
            <button
              onClick={() => movePlayer(p.id, p.team === 'teamA' ? 'teamB' : 'teamA')}
              className="rounded bg-white/10 px-2 py-1"
              title="Switch team"
            >
              ⇄
            </button>
            <button
              onClick={() => confirm(`Remove ${p.userName}? Their phone goes back to the join screen.`) && removePlayer(p.id)}
              className="rounded bg-white/10 px-2 py-1"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </details>
  )
}

/**
 * Gift Bingo: every gift word as a button — tap it as the bride opens that
 * gift (tap again to undo). Opened ones stay lit; the latest is outlined.
 */
function GiftPicker({ drawn, onDeal }) {
  const opened = new Set(drawn)
  const last = drawn[drawn.length - 1]
  return (
    <div className="bg-white/10 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>
          🎁 Opened {drawn.length} / {GIFT_COUNT}
          {last && ` · last: ${giftWord(last)}`}
        </span>
        <button onClick={onDeal} className="rounded bg-white/15 px-2 py-1 text-xs font-bold">
          🃏 New cards
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: GIFT_COUNT }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => toggleGift(n)}
            className={`rounded-lg px-1 py-2 text-xs font-bold leading-tight ${
              opened.has(n) ? 'bg-green-700' : 'bg-white/10'
            } ${n === last ? 'ring-2 ring-yellow-300' : ''}`}
          >
            {opened.has(n) && '✓ '}
            {giftWord(n)}
          </button>
        ))}
      </div>
      <p className="text-xs text-white/40">
        Gift not on the list? Nothing to tap — the words live in <code>GIFT_WORDS</code> in rounds.js.
      </p>
    </div>
  )
}

function NewlywedControls({ nw, players }) {
  const [kind, setKind] = useState('bride')
  const [question, setQuestion] = useState('')
  const [optionsText, setOptionsText] = useState('')
  const [answer, setAnswer] = useState('')
  const { question: q, kind: k, options = [], brideAnswers, guesses, revealed, answer: known, results } = nw || {}
  const whosaid = k === 'whosaid'
  const brides = Object.values(players || {}).filter((p) => p?.role && !p.kicked)
  const guessList = Object.values(guesses || {})
  const count = (team) => guessList.filter((g) => g.team === team).length
  const bothAnswered = brideAnswers?.teamA && brideAnswers?.teamB

  const loadManual = () => {
    if (!question.trim()) return
    loadNewlywedRound({
      kind,
      question: question.trim(),
      options: optionsText.split('\n').map((s) => s.trim()).filter(Boolean),
      answer: answer || null,
    })
  }

  return (
    <div className="space-y-2">
      <ContentBank
        items={NEWLYWED_ROUNDS}
        label={(r) => `${r.kind === 'whosaid' ? '🗨️' : '💑'} ${r.question}`}
        onPick={loadNewlywedRound}
      />
      {brides.length < 2 && (
        <p className="text-xs text-yellow-300">
          Tip: open 👥 players and tap 👰 on each bride's phone so they can answer secretly. Or enter their answers below.
        </p>
      )}
      <ManualEntry>
        <div className="flex gap-2">
          {[
            ['bride', '💑 Brides answer'],
            ['whosaid', '🗨️ Who said it?'],
          ].map(([id, l]) => (
            <button
              key={id}
              onClick={() => setKind(id)}
              className={`flex-1 rounded-lg py-2 text-xs font-bold ${kind === id ? 'bg-white text-stage' : 'bg-white/15'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <input
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm"
          placeholder={kind === 'whosaid' ? 'The quote / "Who is more likely to…"' : 'Question, e.g. Dream honeymoon destination'}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        {kind === 'bride' ? (
          <textarea
            className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm"
            rows={4}
            placeholder="One option per line"
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
          />
        ) : (
          <div className="flex gap-2 text-xs">
            {[
              ['A', brideName('teamA')],
              ['B', brideName('teamB')],
              ['', 'Decide at reveal'],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setAnswer(v)}
                className={`flex-1 rounded-lg py-2 font-bold ${answer === v ? 'bg-white text-stage' : 'bg-white/15'}`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
        <button onClick={loadManual} className="w-full rounded-lg bg-green-700 py-2 font-bold">
          Load round
        </button>
      </ManualEntry>

      {q && (
        <div className="bg-white/10 rounded-lg p-3 space-y-3 text-sm">
          <p className="font-bold">
            {whosaid ? '🗨️' : '💑'} {q}
          </p>

          {!whosaid &&
            ['teamA', 'teamB'].map((team) => (
              <div key={team} className="space-y-1">
                <div className="flex justify-between">
                  <span>👰 {brideName(team)}</span>
                  <span className={brideAnswers?.[team] ? 'text-green-400' : 'text-white/50'}>
                    {brideAnswers?.[team] ? `🔒 ${brideAnswers[team]}` : '⏳ thinking…'}
                  </span>
                </div>
                {!revealed && (
                  <details>
                    <summary className="text-xs text-white/40 cursor-pointer">Enter her answer for her</summary>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {options.map((o) => (
                        <button
                          key={o}
                          onClick={() => setBrideAnswer(team, o)}
                          className={`rounded px-2 py-1 text-xs ${brideAnswers?.[team] === o ? 'bg-white text-stage' : 'bg-white/15'}`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}

          <p className="text-white/60">
            Guesses: {TEAMS.teamA.label} {count('teamA')} · {TEAMS.teamB.label} {count('teamB')}
          </p>

          {revealed ? (
            <div className="rounded-lg bg-green-900/60 p-2 space-y-1">
              {whosaid && <p>It was <b>{brideName(known)}</b></p>}
              {['teamA', 'teamB'].map((t) => (
                <p key={t}>
                  {TEAMS[t].label}: {results?.[t]?.correct ?? 0}/{results?.[t]?.voters ?? 0} right → +{results?.[t]?.points ?? 0}
                </p>
              ))}
            </div>
          ) : whosaid && !known ? (
            <div className="flex gap-2">
              {['teamA', 'teamB'].map((t) => (
                <button
                  key={t}
                  onClick={() => revealNewlywed(nw, t)}
                  className={`flex-1 rounded-lg py-3 font-bold ${t === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'}`}
                >
                  ✨ It was {brideName(t)}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => revealNewlywed(nw)}
              disabled={!whosaid && !bothAnswered}
              className="w-full rounded-lg bg-green-700 py-3 font-bold disabled:opacity-40"
            >
              {!whosaid && !bothAnswered ? 'Waiting for both brides…' : '✨ Reveal & score'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Collapsible wrapper for type-it-yourself controls — keeps the panel clean. */
function ManualEntry({ children }) {
  return (
    <details>
      <summary className="text-xs text-white/40 cursor-pointer">✍️ Manual entry</summary>
      <div className="space-y-2 pt-2">{children}</div>
    </details>
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
