/**
 * Rehearsal mode: the whole game runs against a separate /game-test root,
 * so you can practise the show (scores, buzzers, bingo…) without touching
 * the live state. Turn it on by adding ?rehearsal=1 to any game URL, e.g.
 * #/host?rehearsal=1 — it sticks for that browser tab (?rehearsal=0 turns
 * it off). Decided once at page load; switching reloads the page.
 */
const KEY = 'bvb-rehearsal'

function detect() {
  const query = location.hash.split('?')[1] || location.search.slice(1)
  const flag = new URLSearchParams(query).get('rehearsal')
  try {
    if (flag === '1') sessionStorage.setItem(KEY, '1')
    if (flag === '0') sessionStorage.removeItem(KEY)
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return flag === '1'
  }
}

export const IS_REHEARSAL = detect()

/** Database root for all game state (survey data is unaffected). */
export const GAME_ROOT = IS_REHEARSAL ? 'game-test' : 'game'

/** Full URL to a route, carrying the rehearsal flag along. */
export function appUrl(route = '/', rehearsal = IS_REHEARSAL) {
  return `${location.origin}${import.meta.env.BASE_URL}#${route}${rehearsal ? '?rehearsal=1' : ''}`
}

/** Hop between live and rehearsal (full reload, since the root is fixed at load). */
export function switchMode(rehearsal) {
  const route = location.hash.slice(1).split('?')[0] || '/'
  location.href = appUrl(route, rehearsal) + (rehearsal ? '' : '?rehearsal=0')
  location.reload()
}
