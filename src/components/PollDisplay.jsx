
import { THEME } from '../lib/theme'

const COLORS = ['#f472b6', '#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#f87171']

/**
 * Live poll on the TV. While voting: the options as big tiles, a "votes in"
 * meter against everyone online and names popping in as they vote — but no
 * results, so the reveal keeps its punch. On reveal: bars race out, the
 * winner gets a crown, and you see who voted for what. Two-option polls
 * (Melissa or Calista?) become a head-to-head tug-of-war bar.
 */
export default function PollDisplay({ pollState, players }) {
  const { question, options = [], votes, isOpen, showResults } = pollState || {}
  const voteList = Object.values(votes || {})
  const online = Object.values(players || {}).filter((p) => p?.online === true && !p.kicked).length

  if (!question) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-7xl font-extrabold">🗳️ Live Poll</h2>
        <p className="text-3xl text-white/70">Get your phones ready…</p>
      </div>
    )
  }

  const tally = options.map((o, i) => ({
    option: o,
    color: twoBrides(options) ? (i === 0 ? '#f472b6' : '#a78bfa') : COLORS[i % COLORS.length],
    voters: voteList.filter((v) => v.choice === o),
  }))
  const top = Math.max(...tally.map((t) => t.voters.length), 0)

  return (
    <div className="w-full max-w-7xl space-y-10">
      <h2 className="text-6xl font-extrabold text-center leading-tight">{question}</h2>
      {showResults ? (
        options.length === 2 ? (
          <HeadToHead tally={tally} total={voteList.length} />
        ) : (
          <Bars tally={tally} total={voteList.length} top={top} />
        )
      ) : (
        <Voting tally={tally} voteList={voteList} online={online} isOpen={isOpen} />
      )}
    </div>
  )
}

const twoBrides = (options) =>
  options.length === 2 && options[0] === THEME.brideA && options[1] === THEME.brideB

function Voting({ tally, voteList, online, isOpen }) {
  const expected = Math.max(online, voteList.length, 1)
  const pct = Math.min((voteList.length / expected) * 100, 100)
  const recent = voteList.slice(-12)
  return (
    <div className="space-y-10">
      <div className={`grid gap-6 ${tally.length <= 2 ? 'grid-cols-2' : tally.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {tally.map((t) => (
          <div
            key={t.option}
            className="rounded-3xl px-8 py-8 text-center text-5xl font-extrabold shadow-xl"
            style={{ backgroundColor: `${t.color}33`, border: `4px solid ${t.color}` }}
          >
            {t.option}
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="flex justify-between text-3xl">
          <span>{isOpen ? '🗳️ Vote on your phone!' : '🔒 Voting closed'}</span>
          <span className="font-bold tabular-nums">
            {voteList.length}
            {online > 0 && ` / ${expected}`} votes in
          </span>
        </div>
        <div className="h-6 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex flex-wrap gap-2 min-h-10">
          {recent.map((v, i) => (
            <span
              key={`${v.userName}-${i}`}
              className={`rounded-full px-3 py-1 text-xl font-bold animate-card-reveal ${
                v.team === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'
              }`}
            >
              ✔ {v.userName}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function Names({ voters, max = 10 }) {
  const shown = voters.slice(0, max)
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((v, i) => (
        <span
          key={`${v.userName}-${i}`}
          className={`rounded-full px-2.5 py-0.5 text-lg font-bold ${v.team === 'teamA' ? 'bg-bride-a-dark' : 'bg-bride-b-dark'}`}
        >
          {v.userName}
        </span>
      ))}
      {voters.length > max && <span className="text-lg text-white/60">+{voters.length - max} more</span>}
    </div>
  )
}

function Bars({ tally, total, top }) {
  const sorted = [...tally].sort((a, b) => b.voters.length - a.voters.length)
  return (
    <div className="space-y-6">
      {sorted.map((t, i) => {
        const n = t.voters.length
        const share = total ? n / total : 0
        const winner = n > 0 && n === top
        return (
          <div key={t.option} className="space-y-2">
            <div className="flex items-end justify-between">
              <span className={`text-4xl font-extrabold ${winner ? 'text-yellow-300' : ''}`}>
                {winner && '👑 '}
                {t.option}
              </span>
              <span className="text-4xl font-extrabold tabular-nums">
                {n} <span className="text-2xl text-white/60">({Math.round(share * 100)}%)</span>
              </span>
            </div>
            <div className="h-12 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full animate-grow-x ${winner ? 'shadow-[0_0_30px_rgba(253,224,71,0.6)]' : ''}`}
                style={{ width: `${Math.max(share * 100, n ? 3 : 0)}%`, backgroundColor: t.color, animationDelay: `${i * 0.25}s` }}
              />
            </div>
            <Names voters={t.voters} />
          </div>
        )
      })}
    </div>
  )
}

/** Two options: one bar, fought over from both ends. */
function HeadToHead({ tally, total }) {
  const [left, right] = tally
  const l = left.voters.length
  const r = right.voters.length
  const lPct = total ? Math.round((l / total) * 100) : 50
  const winner = l === r ? null : l > r ? left : right
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-5xl font-extrabold" style={{ color: left.color }}>
            {winner === left && '👑 '}
            {left.option}
          </div>
          <div className="text-7xl font-extrabold tabular-nums">{l}</div>
        </div>
        <div className="text-5xl font-extrabold text-white/40">VS</div>
        <div className="text-right">
          <div className="text-5xl font-extrabold" style={{ color: right.color }}>
            {right.option}
            {winner === right && ' 👑'}
          </div>
          <div className="text-7xl font-extrabold tabular-nums">{r}</div>
        </div>
      </div>
      <div className="relative h-20 rounded-full overflow-hidden flex text-3xl font-extrabold">
        <div
          className="h-full flex items-center pl-6 transition-all duration-[1600ms] ease-out"
          style={{ width: `${lPct}%`, backgroundColor: left.color }}
        >
          {total > 0 && `${lPct}%`}
        </div>
        <div className="h-full flex-1 flex items-center justify-end pr-6" style={{ backgroundColor: right.color }}>
          {total > 0 && `${100 - lPct}%`}
        </div>
        <div className="absolute inset-y-0 left-1/2 w-1 bg-white/60" />
      </div>
      <p className="text-center text-4xl font-extrabold">
        {winner ? `The room says: ${winner.option}!` : "🤝 Dead even — can't split them!"}
      </p>
      <div className="grid grid-cols-2 gap-10">
        <Names voters={left.voters} max={14} />
        <div className="flex justify-end">
          <Names voters={right.voters} max={14} />
        </div>
      </div>
    </div>
  )
}

