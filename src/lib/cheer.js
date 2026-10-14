/**
 * Cheer-off: both teams tap their phones as fast as they can for
 * CHEER_SECONDS; a tug-of-war rope on the TV follows the score.
 *
 * Fair with uneven teams: the rope and the result use AVERAGE taps per
 * player who tapped, not the team total. Each phone counts at most
 * MAX_TAPS_PER_SEC so an auto-clicker can't win it.
 */
export const CHEER_SECONDS = 10
export const CHEER_POINTS = 10 // to the winning team (half each on a tie)
export const CHEER_TOP_POINTS = 5 // personal MVP points for the top tapper
export const COUNTDOWN_MS = 3500 // "3… 2… 1… CHEER!" before taps count
export const SETTLE_MS = 1500 // grace after the buzzer for the last taps to land
export const MAX_TAPS_PER_SEC = 15

/** Tally the per-player tap slots: { [playerId]: { team, userName, taps } }. */
export function tallyCheer(all) {
  const teams = { teamA: { taps: 0, tappers: 0, avg: 0 }, teamB: { taps: 0, tappers: 0, avg: 0 } }
  let top = null
  for (const [id, p] of Object.entries(all || {})) {
    const t = teams[p?.team]
    if (!t || !(p.taps > 0)) continue
    t.taps += p.taps
    t.tappers += 1
    if (!top || p.taps > top.taps) top = { playerId: id, userName: p.userName, team: p.team, taps: p.taps }
  }
  for (const t of Object.values(teams)) t.avg = t.tappers ? Math.round((t.taps / t.tappers) * 10) / 10 : 0
  const { teamA: a, teamB: b } = teams
  const winner = a.avg === b.avg ? 'tie' : a.avg > b.avg ? 'teamA' : 'teamB'
  return { ...teams, winner, top }
}

/**
 * Rope position 0–100 (50 = middle). Team A pulls left, Team B right.
 * Uses the share of the two averages, amplified so a clear lead looks like
 * a real heave (30 vs 17.5 per player ≈ 74%), clamped off the very ends.
 */
export function ropePosition({ teamA, teamB }) {
  const total = teamA.avg + teamB.avg
  if (!total) return 50
  return Math.min(94, Math.max(6, 50 + ((teamB.avg - teamA.avg) / total) * 90))
}

/** Where we are in a round, from the shared server clock. */
export function cheerPhase(cheerState, now) {
  if (!cheerState || cheerState.phase === 'idle' || !cheerState.startsAt) return 'idle'
  if (cheerState.phase === 'done') return 'done'
  if (now < cheerState.startsAt) return 'countdown'
  if (now < cheerState.endsAt) return 'live'
  return 'counting'
}
