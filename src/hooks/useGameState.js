import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { DEFAULT_STATE } from '../lib/schema'
import { GAME_ROOT } from '../lib/mode'

/**
 * Live subscription to the shared /game state (/game-test in rehearsal mode). Every view (guest, host,
 * display) renders off this single source of truth.
 */
export function useGameState() {
  const [state, setState] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!isFirebaseConfigured) return

    const unsubGame = onValue(ref(db, GAME_ROOT), (snap) => {
      // Merge over defaults so missing branches (e.g. votes) don't crash views
      setState({ ...DEFAULT_STATE, ...(snap.val() || {}) })
    })
    const unsubConn = onValue(ref(db, '.info/connected'), (snap) =>
      setConnected(snap.val() === true)
    )
    return () => {
      unsubGame()
      unsubConn()
    }
  }, [])

  return { state, connected, isConfigured: isFirebaseConfigured }
}
