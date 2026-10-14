import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { GAMES, GAME_TITLES, TEAMS, MAX_STRIKES } from '../lib/schema'
import { THEME } from '../lib/theme'
import { playCue, unlockAudio, isAudioUnlocked, isMuted, setMuted } from '../lib/sounds'
import { useGameSounds } from '../hooks/useGameSounds'
import { appUrl } from '../lib/mode'
import { OfflinePill } from '../components/ConnectionStatus'
import { ReactionLayer } from '../components/Reactions'
import BingoDisplay from '../components/BingoDisplay'
import NewlywedDisplay from '../components/NewlywedDisplay'
import WinnerDisplay from '../components/WinnerDisplay'
import { useWakeLock } from '../hooks/useWakeLock'

/**
 * The TV / projector view (16:9). Read-only — it just renders the shared
 * state large and loud.
 */
export default function DisplayView({ state, connected }) {
  useSoundCues(state?.soundCue)
  useGameSounds(state)
  useWakeLock()
  const [audioOn, setAudioOn] = useState(isAudioUnlocked)
  // Karaoke audio: filename -> object URL, picked from a local folder once.
  // Lives here (not in LyricScreen) so switching games doesn't drop it.
  const [audioFiles, setAudioFiles] = useState({})

  if (!state) return <Centered>Connecting…</Centered>

  // Browsers block audio until the page is clicked once.
  const enableAudio = () => !audioOn && unlockAudio().then(setAudioOn)

  // Feud/Noot: guests pick on their phones after buzzing, so the board must
  // stay visible — the buzz shows as a banner instead of a full takeover.
  const compactBuzz = [GAMES.FEUD, GAMES.NOOT].includes(state.currentGame)

  return (
    <div className="h-full flex flex-col p-8 gap-6 overflow-hidden" onClick={enableAudio}>
      <Scoreboard scores={state.scores} />
      <TimerBanner timer={state.timer} />

      <main className="flex-1 flex items-center justify-center relative">
        {state.currentGame === GAMES.LOBBY && <LobbyScreen players={state.players} />}
        {state.currentGame === GAMES.FEUD && <FeudBoard feudState={state.feudState} />}
        {state.currentGame === GAMES.POLL && <PollBoard pollState={state.pollState} />}
        {state.currentGame === GAMES.LYRIC && (
          <LyricScreen
            lyricState={state.lyricState}
            audioFiles={audioFiles}
            onLoadFiles={(files) => setAudioFiles((prev) => ({ ...prev, ...toUrlMap(files) }))}
          />
        )}
        {state.currentGame === GAMES.NOOT && (
          <NootScreen
            nootState={state.nootState}
            audioFiles={audioFiles}
            onLoadFiles={(files) => setAudioFiles((prev) => ({ ...prev, ...toUrlMap(files) }))}
          />
        )}

        {state.currentGame === GAMES.BINGO && <BingoDisplay bingoState={state.bingoState} />}
        {state.currentGame === GAMES.NEWLYWED && <NewlywedDisplay nw={state.newlywedState} />}

        {state.currentGame === GAMES.WINNER && <WinnerDisplay scores={state.scores} players={state.players} />}

        <BuzzOverlay buzzerState={state.buzzerState} compact={compactBuzz} />
      </main>

      {state.reactionsOn !== false && <ReactionLayer />}
      <GameSplash game={state.currentGame} />
      <SoundToggle audioOn={audioOn} />
      <OfflinePill connected={connected} label="TV offline" />
    </div>
  )
}

/** Big countdown under the scoreboard; flashes TIME'S UP, then disappears. */
function TimerBanner({ timer }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!timer?.endsAt) return
    const tick = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(tick)
  }, [timer?.endsAt])

  const remaining = timer?.endsAt ? Math.ceil((timer.endsAt - now) / 1000) : null
  useTimerSounds(timer?.endsAt, remaining)

  if (remaining === null || remaining <= -4) return null

  return (
    <div className="text-center">
      {remaining > 0 ? (
        <span
          className={`text-6xl font-extrabold tabular-nums ${
            remaining <= 5 ? 'text-red-400 animate-buzz-pulse inline-block' : ''
          }`}
        >
          ⏱ {remaining}
        </span>
      ) : (
        <span className="text-6xl font-extrabold text-red-400 animate-strike-flash inline-block">
          ⏰ TIME'S UP!
        </span>
      )}
    </div>
  )
}

/** Tick for the last five seconds, air horn at zero. Skips whatever was on screen at load. */
function useTimerSounds(endsAt, remaining) {
  const last = useRef({ endsAt: undefined, remaining: null })
  useEffect(() => {
    const prev = last.current
    last.current = { endsAt, remaining }
    if (prev.endsAt === undefined || prev.endsAt !== endsAt || remaining === prev.remaining) return
    if (remaining > 0 && remaining <= 5) playCue('tick')
    if (remaining === 0) playCue('timesUp')
  }, [endsAt, remaining])
}

const toUrlMap = (files) =>
  Object.fromEntries([...files].map((f) => [f.name, URL.createObjectURL(f)]))

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
          <ScoreValue value={scores?.[t.id] ?? 0} />
        </div>
      ))}
    </div>
  )
}

/** Score that counts up/down to its new value, with a floating "+N". */
function ScoreValue({ value }) {
  const [shown, setShown] = useState(value)
  const [pop, setPop] = useState(null) // { delta, id }
  const shownRef = useRef(value)

  useEffect(() => {
    const from = shownRef.current
    if (from === value) return
    const t0 = performance.now()
    let first = true
    let raf = requestAnimationFrame(function step(now) {
      if (first) setPop({ delta: value - from, id: t0 })
      first = false
      const k = Math.min(Math.max(now - t0, 0) / 800, 1)
      const v = Math.round(from + (value - from) * (1 - (1 - k) ** 3))
      shownRef.current = v
      setShown(v)
      if (k < 1) raf = requestAnimationFrame(step)
    })
    const clear = setTimeout(() => setPop(null), 1700)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(clear)
    }
  }, [value])

  return (
    <div className="relative">
      <div key={pop?.id} className={`text-7xl font-extrabold tabular-nums ${pop ? 'animate-bump' : ''}`}>
        {shown}
      </div>
      {pop && (
        <span
          key={`p${pop.id}`}
          className={`absolute left-1/2 top-0 text-5xl font-extrabold animate-float-up ${
            pop.delta > 0 ? 'text-yellow-300' : 'text-red-300'
          }`}
        >
          {pop.delta > 0 ? `+${pop.delta}` : pop.delta}
        </span>
      )}
    </div>
  )
}

/** Big animated title when the host switches games. */
function GameSplash({ game }) {
  const [splash, setSplash] = useState(null)
  const prev = useRef(game)

  useEffect(() => {
    if (prev.current === game) return
    prev.current = game
    const show = setTimeout(() => setSplash({ game, id: Date.now() }), 0)
    const hide = setTimeout(() => setSplash(null), 2200)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [game])

  if (!splash || game === GAMES.LOBBY) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stage/85 backdrop-blur-sm pointer-events-none">
      <h1 key={splash.id} className="text-9xl font-extrabold text-center animate-splash">
        {GAME_TITLES[splash.game] || splash.game}
      </h1>
    </div>
  )
}

/** "Click to enable sound" until audio is unlocked, then a small mute button. */
function SoundToggle({ audioOn }) {
  const [muted, setMutedState] = useState(isMuted)
  if (!audioOn) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-yellow-400 text-stage font-bold rounded-full px-5 py-3 text-xl animate-buzz-pulse cursor-pointer">
        🔇 Click anywhere to turn on sound
      </div>
    )
  }
  return (
    <button
      onClick={() => {
        setMuted(!muted)
        setMutedState(!muted)
      }}
      className="fixed bottom-4 right-4 z-50 rounded-full bg-white/10 px-3 py-2 text-xl opacity-40 hover:opacity-100"
      title={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}

function LobbyScreen({ players }) {
  const guestUrl = appUrl('/')
  const joined = Object.values(players || {}).filter((p) => p?.userName && !p.kicked)
  return (
    <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-10">
      <TeamList team="teamA" players={joined} />
      <div className="text-center space-y-8">
        <h1 className="text-7xl font-extrabold">{THEME.title}</h1>
        <p className="text-2xl text-white/80">
          Scan to join a team{joined.length > 0 && ` · ${joined.length} joined`}
        </p>
        <div className="inline-block bg-white p-6 rounded-3xl">
          <QRCodeSVG value={guestUrl} size={280} />
        </div>
      </div>
      <TeamList team="teamB" players={joined} />
    </div>
  )
}

/** Name chips for one team, newest at the end so arrivals pop in. */
function TeamList({ team, players }) {
  const names = players
    .filter((p) => p.team === team)
    .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))
  const color = team === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'
  return (
    <div className="self-stretch flex flex-col gap-3 overflow-hidden">
      <h3 className={`text-2xl font-bold text-center ${team === 'teamA' ? 'text-bride-a' : 'text-bride-b'}`}>
        {TEAMS[team].label} ({names.length})
      </h3>
      <div className="flex flex-wrap justify-center content-start gap-2">
        {names.slice(-40).map((p, i) => (
          <span key={`${p.userName}-${i}`} className={`${color} rounded-full px-4 py-1.5 text-xl font-bold animate-card-reveal`}>
            {p.userName}
          </span>
        ))}
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

function LyricScreen({ lyricState, audioFiles, onLoadFiles }) {
  const { snippet, answer, showAnswer, audio, cutAt, playback } = lyricState || {}
  const audioRef = useRef(null)
  const lastPlayTs = useRef(null)
  // Karaoke phase: while the vocals are still singing we show "sing along";
  // once playback passes cutAt the round is live and the blanks appear.
  const [vocalsCut, setVocalsCut] = useState(false)

  const audioUrl = audio ? audioFiles[audio] : null
  const hasKaraoke = Boolean(audio)

  // New snippet = new round: reset the phase.
  useEffect(() => setVocalsCut(false), [snippet, audio])

  // One-shot play/stop cue from the host (same skip-initial pattern as sounds).
  useEffect(() => {
    if (!playback?.ts || playback.ts === lastPlayTs.current) return
    const isInitial = lastPlayTs.current === null
    lastPlayTs.current = playback.ts
    if (isInitial) return
    const el = audioRef.current
    if (!el) return
    if (playback.action === 'play') {
      el.currentTime = 0
      setVocalsCut(false)
      el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [playback])

  if (!snippet) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-6xl font-extrabold">🎵 Finish the Lyric</h2>
        <p className="text-2xl text-white/70">Buzz in when you know it!</p>
      </div>
    )
  }

  // Word-shaped blanks: keeps the rhythm of the missing line visible.
  const blanks = (answer || '')
    .split(' ')
    .map((w) => '＿'.repeat(Math.max(Math.round(w.length / 2), 1)))
    .join('  ')

  const awaiting = !hasKaraoke || vocalsCut

  return (
    <div className="w-full max-w-5xl text-center space-y-10">
      <h2 className="text-3xl font-bold text-white/60">🎵 Finish the Lyric</h2>
      <p className="text-5xl font-extrabold leading-snug">“{snippet}”</p>

      {showAnswer ? (
        <p className="text-5xl font-extrabold text-green-400 animate-card-reveal">
          {answer}
        </p>
      ) : awaiting ? (
        <div className="space-y-6">
          <p className="text-5xl font-extrabold text-white/40 tracking-widest">{blanks}</p>
          <p className="text-2xl text-white/50 animate-buzz-pulse">Buzz in when you know it!</p>
        </div>
      ) : (
        <p className="text-2xl text-white/50">🎶 Sing along…</p>
      )}

      {hasKaraoke && (
        <>
          <audio
            ref={audioRef}
            src={audioUrl || undefined}
            onTimeUpdate={(e) => {
              if (cutAt > 0 && e.target.currentTime >= cutAt) setVocalsCut(true)
            }}
            onEnded={() => setVocalsCut(true)}
          />
          {!audioUrl && (
            <label className="inline-block bg-white/10 rounded-xl px-4 py-3 text-lg cursor-pointer">
              📂 Click to load the music folder (looking for <b>{audio}</b>)
              <input
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                onChange={(e) => onLoadFiles(e.target.files)}
              />
            </label>
          )}
        </>
      )}
    </div>
  )
}

function NootScreen({ nootState, audioFiles, onLoadFiles }) {
  const {
    prompt, options = [], correct, revealed, wrongGuesses = [],
    audio, clipStart, clipEnd, playback, lastGuess, points,
  } = nootState || {}
  const audioRef = useRef(null)
  const lastPlayTs = useRef(null)
  const [playing, setPlaying] = useState(false)

  const audioUrl = audio ? audioFiles[audio] : null

  // One-shot play/stop cue from the host (skip the cue already in state on load).
  useEffect(() => {
    if (!playback?.ts || playback.ts === lastPlayTs.current) return
    const isInitial = lastPlayTs.current === null
    lastPlayTs.current = playback.ts
    if (isInitial) return
    const el = audioRef.current
    if (!el) return
    if (playback.action === 'play') {
      el.currentTime = clipStart || 0
      el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [playback, clipStart])

  if (!options.length) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-6xl font-extrabold">🎶 Noot vir Noot</h2>
        <p className="text-2xl text-white/70">Luister mooi…</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl text-center space-y-8">
      <h2 className="text-3xl font-bold text-white/60">🎶 Noot vir Noot</h2>
      {playing ? (
        <p className="text-5xl font-extrabold animate-buzz-pulse">🎵 Luister… 🎵</p>
      ) : (
        <p className="text-4xl font-extrabold">{prompt}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {options.map((option) => {
          const isWrong = wrongGuesses.includes(option)
          const isCorrectRevealed = revealed && option === correct
          return (
            <div
              key={option}
              className={`rounded-xl px-6 py-5 text-2xl font-bold ${
                isCorrectRevealed
                  ? 'bg-green-700 ring-4 ring-green-400 animate-card-reveal'
                  : isWrong
                    ? 'bg-white/5 text-white/25 line-through'
                    : 'bg-white/10'
              }`}
            >
              {option}
            </div>
          )
        })}
      </div>

      {revealed && lastGuess?.correct && (
        <p className="text-3xl font-bold text-green-400 animate-card-reveal">
          🏆 {lastGuess.userName} kry {points} punte vir {TEAMS[lastGuess.team]?.label}!
        </p>
      )}

      {audio && (
        <>
          <audio
            ref={audioRef}
            src={audioUrl || undefined}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onTimeUpdate={(e) => {
              if (clipEnd > 0 && e.target.currentTime >= clipEnd) e.target.pause()
            }}
          />
          {!audioUrl && (
            <label className="inline-block bg-white/10 rounded-xl px-4 py-3 text-lg cursor-pointer">
              📂 Click to load the music folder (looking for <b>{audio}</b>)
              <input
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                onChange={(e) => onLoadFiles(e.target.files)}
              />
            </label>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Buzz-winner display: full-screen takeover normally, or a slim banner in
 * games where the board must stay visible while the winner picks.
 */
function BuzzOverlay({ buzzerState, compact = false }) {
  const winner = buzzerState?.firstBuzzed
  if (!winner) return null
  const teamColor = winner.team === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'

  if (compact) {
    return (
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 ${teamColor} rounded-2xl px-8 py-3 flex items-center gap-4 animate-card-reveal shadow-2xl`}
      >
        <span className="text-4xl">🔔</span>
        <span className="text-3xl font-extrabold">{winner.userName}</span>
        <span className="text-xl text-white/80">is answering…</span>
      </div>
    )
  }

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
