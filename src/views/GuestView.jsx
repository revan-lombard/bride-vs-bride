import { useState } from 'react'
import { GAMES, TEAMS, loadPlayer, savePlayer } from '../lib/schema'
import { buzz, castVote } from '../lib/gameActions'

/**
 * The phone-in-hand view. Guests join once (name + team, persisted in
 * localStorage), then the pad follows whatever game the host has active.
 */
export default function GuestView({ state, connected }) {
  const [player, setPlayer] = useState(loadPlayer)

  if (!player) return <JoinScreen onJoin={setPlayer} />
  if (!state) return <Splash text="Connecting…" />

  const teamColor = player.team === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'

  return (
    <div className="min-h-full flex flex-col">
      <header className={`${teamColor} px-4 py-3 flex items-center justify-between`}>
        <div>
          <div className="font-bold">{player.userName}</div>
          <div className="text-xs text-white/80">{TEAMS[player.team].label}</div>
        </div>
        <span
          className={`h-3 w-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}
          title={connected ? 'Connected' : 'Reconnecting…'}
        />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {state.currentGame === GAMES.LOBBY && (
          <Splash text="🥂 Waiting for the host to start a game…" />
        )}
        {(state.currentGame === GAMES.FEUD || state.currentGame === GAMES.LYRIC) && (
          <BuzzerPad player={player} buzzerState={state.buzzerState} />
        )}
        {state.currentGame === GAMES.POLL && (
          <VotePad player={player} pollState={state.pollState} />
        )}
      </main>
    </div>
  )
}

function JoinScreen({ onJoin }) {
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
      <h1 className="text-3xl font-bold text-center">💍 Bride vs. Bride</h1>
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
  const iWon = firstBuzzed?.userName === player.userName

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

function VotePad({ player, pollState }) {
  const { question, options, isOpen, votes } = pollState
  const myVote = votes?.[player.id]?.choice

  return (
    <div className="w-full max-w-sm space-y-4 text-center">
      <h2 className="text-xl font-bold">{question || 'Get ready to vote…'}</h2>
      {(options || []).map((option) => (
        <button
          key={option}
          onClick={() => isOpen && castVote(player, option)}
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

function Splash({ text }) {
  return <div className="text-center text-xl text-white/80">{text}</div>
}
