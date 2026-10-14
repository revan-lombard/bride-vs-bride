import { useEffect, useMemo, useRef, useState } from 'react'
import { GAMES, TEAMS, loadPlayer, savePlayer, clearPlayer, isMe } from '../lib/schema'
import { THEME } from '../lib/theme'
import {
  buzz as sendBuzz,
  castVote,
  submitFeudGuess,
  submitNootGuess,
  claimBingo,
  registerPlayer,
} from '../lib/gameActions'
import {
  BINGO_LETTERS,
  BALL_COLORS,
  PATTERNS,
  FREE,
  ballLabel,
  makeCard,
  goodCells,
  winningCells,
  loadMarks,
  saveMarks,
} from '../lib/bingo'
import { useBingoDraw } from '../hooks/useBingoDraw'
import { playCue, vibrate, isMuted, setMuted, unlockAudio } from '../lib/sounds'
import BingoBall from '../components/BingoBall'
import { ReconnectOverlay } from '../components/ConnectionStatus'

/** Buzz with feedback: a tap click, then a happy chirp + buzz if you won. */
async function buzz(player) {
  playCue('tap')
  vibrate(30)
  const won = await sendBuzz(player)
  if (won) {
    playCue('mark')
    vibrate([120, 60, 120])
  }
  return won
}

/**
 * The phone-in-hand view. Guests join once (name + team, persisted in
 * localStorage), then the pad follows whatever game the host has active.
 */
export default function GuestView({ state, connected }) {
  const [player, setPlayer] = useState(loadPlayer)
  const removed = useRosterSync(player, setPlayer, state, connected)

  if (!player) return <JoinScreen onJoin={setPlayer} removed={removed} />
  if (!state) return <Splash text="Connecting…" />

  const teamColor = player.team === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'

  return (
    <div className="min-h-full flex flex-col">
      <ReconnectOverlay connected={connected} />
      <header className={`${teamColor} px-4 py-3 flex items-center justify-between`}>
        <div>
          <div className="font-bold">{player.userName}</div>
          <div className="text-xs text-white/80">{TEAMS[player.team].label}</div>
        </div>
        <div className="flex items-center gap-3">
          <MuteButton />
          <span
            className={`h-3 w-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}
            title={connected ? 'Connected' : 'Reconnecting…'}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {state.currentGame === GAMES.LOBBY && (
          <Splash text="🥂 Waiting for the host to start a game…" />
        )}
        {state.currentGame === GAMES.FEUD && (
          <FeudPad
            player={player}
            feudState={state.feudState}
            buzzerState={state.buzzerState}
          />
        )}
        {state.currentGame === GAMES.LYRIC && (
          <BuzzerPad player={player} buzzerState={state.buzzerState} />
        )}
        {state.currentGame === GAMES.NOOT && (
          <NootPad
            player={player}
            nootState={state.nootState}
            buzzerState={state.buzzerState}
          />
        )}
        {state.currentGame === GAMES.BINGO && (
          <BingoPad player={player} bingoState={state.bingoState} />
        )}
        {state.currentGame === GAMES.WINNER && (
          <Splash text="🏆 Final scores are on the TV — thanks for playing! 🥂" />
        )}
        {state.currentGame === GAMES.POLL && (
          <VotePad player={player} pollState={state.pollState} />
        )}
      </main>
    </div>
  )
}

/**
 * Keeps this phone's roster entry in step: registers on connect (and after
 * a host reset), adopts host renames / team moves, and logs out if the host
 * removes the player. Returns true once the player has been removed.
 */
function useRosterSync(player, setPlayer, state, connected) {
  const [removed, setRemoved] = useState(false)
  const registering = useRef(false)
  const raw = player ? state?.players?.[player.id] : undefined
  // A leftover onDisconnect after a host reset can leave { online: false }
  // with no name — treat that as "not registered".
  const entry = raw?.kicked || raw?.userName ? raw : null

  useEffect(() => {
    if (!player || !state || !connected) return
    if (entry?.kicked) {
      clearPlayer()
      setPlayer(null)
      setRemoved(true)
      return
    }
    if (entry && (entry.userName !== player.userName || entry.team !== player.team)) {
      const updated = { ...player, userName: entry.userName, team: entry.team }
      savePlayer(updated)
      setPlayer(updated)
    }
    if ((!entry || entry.online !== true) && !registering.current) {
      registering.current = true
      registerPlayer(player, entry).finally(() => {
        registering.current = false
      })
    }
  }, [player, state, connected, entry, setPlayer])

  return removed
}

function JoinScreen({ onJoin, removed }) {
  const [name, setName] = useState('')
  const [team, setTeam] = useState(null)

  const join = () => {
    if (!name.trim() || !team) return
    const player = {
      id: crypto.randomUUID(),
      userName: name.trim(),
      team,
    }
    savePlayer(player)
    onJoin(player)
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 gap-6">
      <h1 className="text-3xl font-bold text-center">{THEME.title}</h1>
      {removed && (
        <p className="text-sm text-yellow-300 text-center">The host reset your spot — join again below.</p>
      )}
      <input
        className="w-full max-w-xs rounded-xl bg-white/10 px-4 py-3 text-lg text-center outline-none focus:ring-2 ring-white/50"
        placeholder="Your name"
        value={name}
        maxLength={20}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        {Object.values(TEAMS).map((t) => (
          <button
            key={t.id}
            onClick={() => setTeam(t.id)}
            className={`rounded-xl py-6 font-bold transition ${
              t.id === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'
            } ${team === t.id ? 'ring-4 ring-white scale-105' : 'opacity-70'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button
        onClick={join}
        disabled={!name.trim() || !team}
        className="w-full max-w-xs rounded-xl bg-white text-stage font-bold py-3 text-lg disabled:opacity-30"
      >
        Join the party 🎉
      </button>
    </div>
  )
}

function BuzzerPad({ player, buzzerState }) {
  const { isUnlocked, firstBuzzed } = buzzerState
  const iWon = isMe(firstBuzzed, player)

  if (firstBuzzed) {
    return (
      <div className="text-center space-y-3">
        <div className="text-6xl">{iWon ? '🎉' : '🔒'}</div>
        <div className="text-2xl font-bold">
          {iWon ? 'You buzzed first!' : `${firstBuzzed.userName} buzzed first`}
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => isUnlocked && buzz(player)}
      disabled={!isUnlocked}
      className={`h-64 w-64 rounded-full text-3xl font-extrabold transition select-none ${
        isUnlocked
          ? 'bg-red-500 active:bg-red-700 active:scale-95 animate-buzz-pulse'
          : 'bg-gray-600 opacity-50'
      }`}
    >
      {isUnlocked ? 'BUZZ!' : 'Locked'}
    </button>
  )
}

/**
 * Feud on the phone: question on top, the fixed answer options below, big
 * buzz bar at the bottom. Winning the buzz unlocks the options — the pick
 * auto-reveals a hit (or auto-strikes a miss) for everyone.
 */
function FeudPad({ player, feudState, buzzerState }) {
  const { question, options = [], answers = [] } = feudState || {}
  const { isUnlocked, firstBuzzed } = buzzerState || {}
  const iWon = isMe(firstBuzzed, player)
  const revealed = new Set(answers.filter((a) => a.revealed).map((a) => a.text))

  // No round with options loaded yet — plain buzzer, like the lyric game.
  if (!question || !options.length) {
    return <BuzzerPad player={player} buzzerState={buzzerState} />
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <h2 className="text-xl font-bold text-center">{question}</h2>

      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => {
              if (!iWon) return
              playCue('tap')
              submitFeudGuess(player, option, feudState)
            }}
            disabled={!iWon || revealed.has(option)}
            className={`w-full rounded-xl px-4 py-3 text-left font-bold transition ${
              revealed.has(option)
                ? 'bg-green-900/50 text-white/50'
                : iWon
                  ? 'bg-white text-stage active:scale-95 ring-2 ring-white/60'
                  : 'bg-white/10 text-white/60'
            }`}
          >
            {option} {revealed.has(option) && '✅'}
          </button>
        ))}
      </div>

      {iWon ? (
        <p className="text-center font-bold text-green-400 animate-buzz-pulse">
          🎉 You buzzed first — pick your answer!
        </p>
      ) : firstBuzzed ? (
        <p className="text-center text-white/60">
          🔒 {firstBuzzed.userName} is answering…
        </p>
      ) : (
        <button
          onClick={() => isUnlocked && buzz(player)}
          disabled={!isUnlocked}
          className={`w-full h-24 rounded-2xl text-2xl font-extrabold transition select-none ${
            isUnlocked
              ? 'bg-red-500 active:bg-red-700 active:scale-95 animate-buzz-pulse'
              : 'bg-gray-600 opacity-50'
          }`}
        >
          {isUnlocked ? 'BUZZ!' : 'Buzzers locked'}
        </button>
      )}
    </div>
  )
}

/** Noot vir Noot on the phone: same buzz-then-pick flow as Feud. */
function NootPad({ player, nootState, buzzerState }) {
  const { prompt, options = [], correct, revealed, wrongGuesses = [] } = nootState || {}
  const { isUnlocked, firstBuzzed } = buzzerState || {}
  const iWon = isMe(firstBuzzed, player)

  if (!options.length) {
    return <BuzzerPad player={player} buzzerState={buzzerState} />
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <h2 className="text-xl font-bold text-center">🎶 {prompt}</h2>

      <div className="space-y-2">
        {options.map((option) => {
          const isWrong = wrongGuesses.includes(option)
          const isCorrectRevealed = revealed && option === correct
          return (
            <button
              key={option}
              onClick={() => {
                if (!iWon || revealed) return
                playCue('tap')
                submitNootGuess(player, option, nootState)
              }}
              disabled={!iWon || revealed || isWrong}
              className={`w-full rounded-xl px-4 py-3 text-left font-bold transition ${
                isCorrectRevealed
                  ? 'bg-green-700 ring-2 ring-green-400'
                  : isWrong
                    ? 'bg-white/5 text-white/30 line-through'
                    : iWon && !revealed
                      ? 'bg-white text-stage active:scale-95 ring-2 ring-white/60'
                      : 'bg-white/10 text-white/60'
              }`}
            >
              {option} {isCorrectRevealed && '✅'}
            </button>
          )
        })}
      </div>

      {revealed ? (
        <p className="text-center text-white/60">🎉 Song revealed — next round soon!</p>
      ) : iWon ? (
        <p className="text-center font-bold text-green-400 animate-buzz-pulse">
          🎉 You buzzed first — which song is it?
        </p>
      ) : firstBuzzed ? (
        <p className="text-center text-white/60">
          🔒 {firstBuzzed.userName} is answering…
        </p>
      ) : (
        <button
          onClick={() => isUnlocked && buzz(player)}
          disabled={!isUnlocked}
          className={`w-full h-24 rounded-2xl text-2xl font-extrabold transition select-none ${
            isUnlocked
              ? 'bg-red-500 active:bg-red-700 active:scale-95 animate-buzz-pulse'
              : 'bg-gray-600 opacity-50'
          }`}
        >
          {isUnlocked ? 'BUZZ!' : 'Buzzers locked'}
        </button>
      )}
    </div>
  )
}

function VotePad({ player, pollState }) {
  const { question, options, isOpen, votes } = pollState
  const myVote = votes?.[player.id]?.choice

  return (
    <div className="w-full max-w-sm space-y-4 text-center">
      <h2 className="text-xl font-bold">{question || 'Get ready to vote…'}</h2>
      {(options || []).map((option) => (
        <button
          key={option}
          onClick={() => {
            if (!isOpen) return
            playCue('tap')
            vibrate(20)
            castVote(player, option)
          }}
          disabled={!isOpen}
          className={`w-full rounded-xl py-4 text-lg font-bold transition ${
            myVote === option
              ? 'bg-white text-stage ring-4 ring-white/60'
              : 'bg-white/15 active:bg-white/30'
          } ${!isOpen && 'opacity-40'}`}
        >
          {option}
        </button>
      ))}
      {!isOpen && <p className="text-white/60 text-sm">Voting is closed</p>}
      {myVote && isOpen && (
        <p className="text-white/60 text-sm">You can change your vote until it closes</p>
      )}
    </div>
  )
}

function MuteButton() {
  const [muted, setMutedState] = useState(isMuted)
  return (
    <button
      onClick={() => {
        unlockAudio()
        setMuted(!muted)
        setMutedState(!muted)
      }}
      className="text-lg opacity-80"
      title={muted ? 'Sound off' : 'Sound on'}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}

/**
 * Bridal Bingo card. Guests listen/watch for the balls and tap their own
 * squares — only numbers that have really been called will mark. When the
 * marked squares make the pattern, the BINGO button lights up.
 */
function BingoPad({ player, bingoState }) {
  const { seed = '', pattern = 'line', winner } = bingoState || {}
  const { spinning, visible, current } = useBingoDraw(bingoState)
  const card = useMemo(() => (seed ? makeCard(player.id, seed) : null), [player.id, seed])
  const [store, setStore] = useState(() => ({ seed, marks: loadMarks(seed) }))
  const marks = store.seed === seed ? store.marks : loadMarks(seed)
  const [shake, setShake] = useState(null) // cell index that was tapped too early
  const [toast, setToast] = useState('')
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 1800)
    return () => clearTimeout(t)
  }, [toast])

  if (!card) {
    return <Splash text="🎱 Bridal Bingo — the host is dealing the cards…" />
  }

  const called = new Set(visible)
  const good = goodCells(card, marks, visible)
  const win = winner ? null : winningCells(pattern, good)
  const iWon = winner?.playerId === player.id
  const winCells = new Set(iWon ? winner.cells || [] : [])
  const pat = PATTERNS[pattern] || PATTERNS.line

  const tapCell = (i) => {
    const n = card[i]
    if (n === FREE) return
    let next
    if (marks.includes(i)) {
      next = marks.filter((m) => m !== i)
      playCue('tap')
    } else if (!called.has(n)) {
      setShake(i)
      setTimeout(() => setShake(null), 400)
      setToast(`${ballLabel(n)} hasn't been called yet!`)
      playCue('nope')
      vibrate(80)
      return
    } else {
      next = [...marks, i]
      playCue('mark')
      vibrate(25)
    }
    setStore({ seed, marks: next })
    saveMarks(seed, next)
  }

  const shoutBingo = async () => {
    if (!win || claiming) return
    setClaiming(true)
    const ok = await claimBingo(player, win, bingoState)
    setClaiming(false)
    if (ok) {
      playCue('bingo')
      vibrate([200, 80, 200, 80, 400])
    } else {
      setToast('So close — someone beat you to it!')
    }
  }

  return (
    <div className="w-full max-w-sm space-y-3">
      <div className="flex items-center justify-between gap-3 min-h-16">
        <div className="text-sm">
          <div className="text-white/60">Playing for</div>
          <div className="font-bold">
            {pat.label} · {pat.points} pts
          </div>
        </div>
        {spinning ? (
          <div className="text-lg font-bold animate-buzz-pulse">🌀 Drawing…</div>
        ) : current ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60 text-right leading-tight">
              Just
              <br />
              called
            </span>
            <BingoBall key={current} number={current} size={60} className="animate-ball-pop" />
          </div>
        ) : (
          <div className="text-sm text-white/60">Watch the TV 📺</div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {BINGO_LETTERS.map((l) => (
          <div key={l} className="text-center text-2xl font-extrabold" style={{ color: BALL_COLORS[l] }}>
            {l}
          </div>
        ))}
        {card.map((n, i) => {
          const marked = n === FREE || marks.includes(i)
          const color = BALL_COLORS[BINGO_LETTERS[i % 5]]
          return (
            <button
              key={i}
              onClick={() => tapCell(i)}
              className={`aspect-square rounded-xl text-2xl font-extrabold flex items-center justify-center select-none transition active:scale-90 ${
                shake === i ? 'animate-shake' : ''
              } ${winCells.has(i) ? 'ring-4 ring-yellow-300' : ''} ${
                marked ? 'text-stage' : 'bg-white/10'
              }`}
              style={marked ? { backgroundColor: n === FREE ? '#fde68a' : color } : undefined}
            >
              {n === FREE ? '💍' : n}
            </button>
          )
        })}
      </div>

      <div className="h-6 text-center text-sm text-yellow-300">{toast}</div>

      {winner ? (
        <div
          className={`rounded-2xl p-4 text-center font-bold ${
            iWon ? 'bg-yellow-300 text-stage animate-buzz-pulse' : 'bg-white/10'
          }`}
        >
          {iWon
            ? `🎉 BINGO! +${winner.points} for ${TEAMS[player.team].label}!`
            : `🎉 ${winner.userName} got BINGO! Next round coming up…`}
        </div>
      ) : (
        <button
          onClick={shoutBingo}
          disabled={!win || claiming}
          className={`w-full h-20 rounded-2xl font-extrabold transition select-none ${
            win
              ? 'bg-yellow-300 text-stage text-3xl animate-buzz-pulse active:scale-95'
              : 'bg-white/10 text-white/30 text-lg'
          }`}
        >
          {win ? 'BINGO! 🎉' : 'Tap numbers as they’re called'}
        </button>
      )}
    </div>
  )
}

function Splash({ text }) {
  return <div className="text-center text-xl text-white/80">{text}</div>
}
