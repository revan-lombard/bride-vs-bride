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

    // Read config and responses separately: the database rules grant read
    // on survey/config and survey/responses, not on the /survey root itself,
    // so a single listener on 'survey' is refused and the page never loads.
    let config, responses
    const publish = () => {
      if (config !== undefined && responses !== undefined) setSurveyState({ config, responses })
    }
    const unsubConfig = onValue(ref(db, 'survey/config'), (snap) => {
      config = snap.val() || {}
      publish()
    })
    const unsubResponses = onValue(ref(db, 'survey/responses'), (snap) => {
      responses = snap.val() || {}
      publish()
    })
    const unsubSurvey = () => {
      unsubConfig()
      unsubResponses()
    }
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
