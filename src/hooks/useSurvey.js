import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db, isFirebaseConfigured } from '../lib/firebase'

/**
 * Live subscription to the /survey root (config + responses). Used by the
 * invitee survey view and the host tally view.
 */
export function useSurvey() {
  const [surveyState, setSurveyState] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!isFirebaseConfigured) return

    const unsubSurvey = onValue(ref(db, 'survey'), (snap) => {
      setSurveyState(snap.val() || {})
    })
    const unsubConn = onValue(ref(db, '.info/connected'), (snap) =>
      setConnected(snap.val() === true)
    )
    return () => {
      unsubSurvey()
      unsubConn()
    }
  }, [])

  // Missing config means the toggle has never been touched — treat as open.
  const isOpen = surveyState?.config?.open !== false

  return {
    loaded: surveyState !== null,
    isOpen,
    responses: surveyState?.responses || {},
    connected,
    isConfigured: isFirebaseConfigured,
  }
}
