import { useEffect, useMemo, useRef, useState } from 'react'
import { GAMES, GAME_TITLES, TEAMS, loadPlayer, savePlayer, clearPlayer, isMe, brideTeamOf, brideName, whoSaidText } from '../lib/schema'
import { THEME } from '../lib/theme'
import {
  buzz as sendBuzz,
  castVote,
  submitFeudGuess,
  submitNootGuess,
  claimBingo,
  registerPlayer,
  setBrideAnswer,
  castNewlywedGuess,
  NEWLYWED_PERSONAL_POINTS,
} from '../lib/gameActions'
import {
  BINGO_LETTERS,
  BALL_COLORS,
  PATTERNS,
  FREE,
  cellLabel,
  giftWord,
  isGiftMode,
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
import { ReactionBar } from '../components/Reactions'
import InstallButton from '../components/InstallButton'
import { CheerPad } from '../components/Cheer'
import MessageComposer from '../components/MessageComposer'
import { useWakeLock } from '../hooks/useWakeLock'

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
  const [writing, setWriting] = useState(false) // message-for-the-brides sheet
  useWakeLock()
  const removed = useRosterSync(player, setPlayer, state, connected)

  if (!player) return <JoinScreen onJoin={setPlayer} removed={removed} />
  if (!state) return <Splash text="Connecting…" />

  const teamColor = player.team === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'

  return (
    <div className="min-h-full flex flex-col">
      <ReconnectOverlay connected={connected} />
      <RecapToast recap={state.recap} player={player} />
      {writing && <MessageComposer player={player} onClose={() => setWriting(false)} />}
      <header className={`${teamColor} px-4 py-3 flex items-center justify-between`}>
        <div>
          <div className="font-bold">{player.userName}</div>
          <div className="text-xs text-white/80">
            {TEAMS[player.team].label}
            {state.players?.[player.id]?.points > 0 && (
              <span className="ml-2 text-yellow-300 font-bold">⭐ {state.players[player.id].points} pts</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setWriting(true)} className="text-xl" title="Write the brides a message">
            💌
          </button>
          <MuteButton />
          <span
            className={`h-3 w-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}
            title={connected ? 'Connected' : 'Reconnecting…'}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {state.currentGame === GAMES.LOBBY && (
          <LobbyPad
            player={player}
            players={state.players}
            reactionsOn={state.reactionsOn !== false}
            onWrite={() => setWriting(true)}
          />
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
        {state.currentGame === GAMES.NEWLYWED && (
          <NewlywedPad
            player={player}
            role={state.players?.[player.id]?.role}
            nw={state.newlywedState}
          />
        )}
        {state.currentGame === GAMES.CHEER && <CheerPad player={player} cheerState={state.cheerState} />}
        {state.currentGame === GAMES.WINNER && (
          <div className="text-center space-y-5 max-w-sm">
            <Splash text="🏆 Final scores are on the TV — thanks for playing! 🥂" />
            <button onClick={() => setWriting(true)} className="w-full rounded-xl bg-bride-a py-4 text-lg font-bold">
              💌 Leave the brides a message before you go
            </button>
          </div>
        )}
        {state.currentGame === GAMES.POLL && (
          <VotePad player={player} pollState={state.pollState} />
        )}
      </main>
      {state.reactionsOn !== false && <ReactionBar player={player} />}
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
      <InstallButton />
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
  const steal = feudState?.steal
  const stealOpen = steal?.status === 'open'
  const myTeamSteals = stealOpen && steal.team === player.team
  // During a steal only the stealing team can buzz; once decided, nobody.
  const canBuzz = !steal || myTeamSteals

  // No round with options loaded yet — plain buzzer, like the lyric game.
  if (!question || !options.length) {
    return <BuzzerPad player={player} buzzerState={buzzerState} />
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      {steal && <StealBanner steal={steal} player={player} />}
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
        <p className="text-center font-bold text-green-400 animate-text-pulse">
          🎉 You buzzed first — pick your answer!
        </p>
      ) : firstBuzzed ? (
        <p className="text-center text-white/60">
          🔒 {firstBuzzed.userName} is answering…
        </p>
      ) : !canBuzz ? (
        <p className="text-center text-white/60">
          {stealOpen ? 'Fingers crossed… 🤞' : 'Board decided — next round coming up!'}
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

/** Feud steal status on the phone — framed for whichever side you're on. */
function StealBanner({ steal, player }) {
  const mine = steal.team === player.team
  const thief = TEAMS[steal.team].label
  const defenders = TEAMS[steal.team === 'teamA' ? 'teamB' : 'teamA'].label
  const text =
    steal.status === 'open'
      ? mine
        ? '🦹 STEAL! Your team gets ONE guess — talk it over, then buzz!'
        : `🛡️ ${thief} is trying to steal your points…`
      : steal.status === 'won'
        ? mine
          ? `🦹 You stole ${steal.points} points! 🎉`
          : `😱 ${thief} stole ${steal.points} points!`
        : mine
          ? `😅 Steal missed — ${defenders} keeps the board`
          : '🛡️ Steal blocked — you keep your points!'
  const good = (steal.status === 'open' && mine) || (steal.status === 'won' && mine) || (steal.status === 'lost' && !mine)
  return (
    <div
      className={`rounded-xl px-4 py-3 text-center font-extrabold ${
        good ? 'bg-yellow-300 text-stage' : 'bg-red-900/70'
      } ${steal.status === 'open' ? 'animate-text-pulse' : 'animate-card-reveal'}`}
    >
      {text}
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
        <p className="text-center font-bold text-green-400 animate-text-pulse">
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

/**
 * Phone side of the between-games recap: a few seconds of "your team +12,
 * you +5" while the TV shows the full version. Skips whatever recap was
 * already in state when the page loaded.
 */
function RecapToast({ recap, player }) {
  const [shown, setShown] = useState(null)
  const seen = useRef(recap?.id)

  useEffect(() => {
    if (!recap?.id || recap.id === seen.current) return
    seen.current = recap.id
    const show = setTimeout(() => setShown(recap), 0)
    const hide = setTimeout(() => setShown(null), 6500)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [recap])

  if (!shown) return null
  const { fromGame, gained, scores, gains } = shown
  const lead = scores.teamA === scores.teamB ? null : scores.teamA > scores.teamB ? 'teamA' : 'teamB'
  const mine = gains?.[player.id]
  return (
    <div className="fixed top-16 inset-x-3 z-40 rounded-2xl bg-white text-stage p-4 shadow-2xl animate-card-reveal text-center space-y-1">
      <p className="text-xs uppercase tracking-widest text-stage/60">
        {fromGame ? `${GAME_TITLES[fromGame] || fromGame} — recap` : '📊 Scoreboard check'}
      </p>
      {gained && (
        <p className="text-xl font-extrabold">
          {gained[player.team] > 0 ? `Your team +${gained[player.team]}` : 'No points for your team this round'}
          {mine > 0 && <span className="text-bride-a-dark"> · you +{mine} ⭐</span>}
        </p>
      )}
      <p className="font-bold">
        {lead
          ? lead === player.team
            ? `👑 You're leading by ${Math.abs(scores.teamA - scores.teamB)}!`
            : `😤 ${TEAMS[lead].label} leads by ${Math.abs(scores.teamA - scores.teamB)} — catch up!`
          : `🤝 All square at ${scores.teamA}!`}
      </p>
    </div>
  )
}

/** Waiting room: who's on your team, and a nudge to play with the emoji bar. */
function LobbyPad({ player, players, reactionsOn, onWrite }) {
  const team = Object.values(players || {})
    .filter((p) => p?.userName && !p.kicked && p.team === player.team)
    .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))
  const color = player.team === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'
  return (
    <div className="w-full max-w-sm text-center space-y-5">
      <div className="text-5xl">🥂</div>
      <h2 className="text-2xl font-bold">You're in, {player.userName}!</h2>
      <p className="text-white/70">
        {TEAMS[player.team].label} · {team.length} player{team.length === 1 ? '' : 's'}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {team.map((p, i) => (
          <span key={`${p.userName}-${i}`} className={`${color} rounded-full px-3 py-1 text-sm font-bold`}>
            {p.userName}
          </span>
        ))}
      </div>
      <p className="text-white/60 text-sm">
        The games start soon — keep this screen open.
        {reactionsOn && (
          <>
            <br />
            Warm up by cheering on the TV 👇
          </>
        )}
      </p>
      <button onClick={onWrite} className="w-full rounded-xl bg-white/10 py-3 font-bold">
        💌 Write the brides a message
      </button>
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
 * marked squares make the pattern, the BINGO button lights up. In Gift
 * Bingo the squares are gift words, marked as the bride opens each gift.
 */
function BingoPad({ player, bingoState }) {
  const { seed = '', pattern = 'line', winner, mode = 'numbers' } = bingoState || {}
  const gifts = isGiftMode(bingoState)
  const { spinning, visible, current } = useBingoDraw(bingoState)
  const card = useMemo(() => (seed ? makeCard(player.id, seed, mode) : null), [player.id, seed, mode])
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
    return <Splash text="🎱 Bingo — the host is dealing the cards…" />
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
      setToast(`${cellLabel(n, mode)} ${gifts ? "hasn't been opened" : "hasn't been called"} yet!`)
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
        {gifts ? (
          current ? (
            <div key={current} className="text-right animate-card-reveal">
              <div className="text-xs text-white/60">🎁 Just opened</div>
              <div className="font-extrabold text-yellow-300">{giftWord(current)}</div>
            </div>
          ) : (
            <div className="text-sm text-white/60">Watch the gifts 🎁</div>
          )
        ) : spinning ? (
          <div className="text-lg font-bold animate-text-pulse">🌀 Drawing…</div>
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
              className={`aspect-square rounded-xl font-extrabold flex items-center justify-center text-center select-none transition active:scale-90 ${
                gifts && n !== FREE ? 'text-[11px] leading-tight px-0.5 break-words hyphens-auto' : 'text-2xl'
              } ${
                shake === i ? 'animate-shake' : ''
              } ${winCells.has(i) ? 'ring-4 ring-yellow-300' : ''} ${
                marked ? 'text-stage' : 'bg-white/10'
              }`}
              style={marked ? { backgroundColor: n === FREE ? '#fde68a' : color } : undefined}
            >
              {n === FREE ? '💍' : gifts ? giftWord(n) : n}
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
          {win ? 'BINGO! 🎉' : gifts ? 'Tap gifts as they’re opened' : 'Tap numbers as they’re called'}
        </button>
      )}
    </div>
  )
}

/**
 * Bride Knows Best. Brides (marked by the host in the roster) secretly pick
 * their own answer; everyone else predicts what their team's bride picked —
 * or, in "Who said it?" rounds, which bride it was.
 */
function NewlywedPad({ player, role, nw }) {
  const { kind, question, options = [], guesses, brideAnswers, revealed, answer, results } = nw || {}
  const myBrideTeam = brideTeamOf(role) // set if this phone IS a bride
  const whosaid = kind === 'whosaid'

  if (!question) return <Splash text="💑 Bride Knows Best — get ready…" />

  const pick = (fn) => {
    playCue('tap')
    vibrate(20)
    fn()
  }

  // ---- the brides themselves ----
  if (myBrideTeam) {
    if (whosaid) {
      return (
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-6xl">😉</div>
          <h2 className="text-xl font-bold">{whoSaidText(question)}</h2>
          <p className="text-white/70">You know this one — sit back and watch them guess!</p>
        </div>
      )
    }
    const mine = brideAnswers?.[myBrideTeam]
    return (
      <div className="w-full max-w-sm space-y-4">
        <p className="text-center text-sm text-yellow-300 font-bold">🤫 Secret answer — keep your screen hidden!</p>
        <h2 className="text-2xl font-bold text-center">{question}</h2>
        <div className="space-y-2">
          {options.map((o) => (
            <button
              key={o}
              disabled={revealed}
              onClick={() => pick(() => setBrideAnswer(myBrideTeam, o))}
              className={`w-full rounded-xl py-4 text-lg font-bold transition ${
                mine === o ? 'bg-white text-stage ring-4 ring-white/60' : 'bg-white/15 active:bg-white/30'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
        <p className="text-center text-white/60 text-sm">
          {mine ? '🔒 Locked in — you can change it until the reveal' : 'Pick your answer'}
        </p>
      </div>
    )
  }

  // ---- everyone else predicts ----
  const myGuess = guesses?.[player.id]?.choice
  const target = whosaid ? answer : brideAnswers?.[player.team]
  const choices = whosaid ? ['teamA', 'teamB'] : options
  const label = (c) => (whosaid ? brideName(c) : c)
  const got = revealed && myGuess && myGuess === target

  return (
    <div className="w-full max-w-sm space-y-4">
      <p className="text-center text-sm text-white/60">
        {whosaid ? '🗨️ Who said it?' : `💑 What did ${brideName(player.team)} pick?`}
      </p>
      <h2 className="text-2xl font-bold text-center">{whosaid ? whoSaidText(question) : question}</h2>
      <div className={whosaid ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
        {choices.map((c) => {
          const isTarget = revealed && c === target
          return (
            <button
              key={c}
              disabled={revealed}
              onClick={() => pick(() => castNewlywedGuess(player, c))}
              className={`w-full rounded-xl font-bold transition ${whosaid ? 'py-8 text-xl' : 'py-4 text-lg'} ${
                isTarget
                  ? 'bg-green-600 ring-4 ring-green-300'
                  : myGuess === c
                    ? 'bg-white text-stage ring-4 ring-white/60'
                    : whosaid
                      ? c === 'teamA'
                        ? 'bg-bride-a-dark'
                        : 'bg-bride-b-dark'
                      : 'bg-white/15 active:bg-white/30'
              } ${revealed && !isTarget && myGuess !== c ? 'opacity-40' : ''}`}
            >
              {label(c)} {isTarget && '✅'}
            </button>
          )
        })}
      </div>
      <p className="text-center text-sm text-white/70">
        {revealed
          ? got
            ? `🎉 You got it! +${NEWLYWED_PERSONAL_POINTS} MVP points · team +${results?.[player.team]?.points ?? 0}`
            : myGuess
              ? `😅 Not quite — it was ${label(target)}`
              : `It was ${label(target)}`
          : myGuess
            ? 'Locked in — you can change until the reveal'
            : 'Tap your guess'}
      </p>
    </div>
  )
}

function Splash({ text }) {
  return <div className="text-center text-xl text-white/80">{text}</div>
}
