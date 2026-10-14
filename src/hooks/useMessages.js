import { useEffect, useState } from 'react'
import { onValue } from 'firebase/database'
import { messagesRef } from '../lib/gameActions'

/** Live list of messages for the brides, oldest first: [{ id, text, name, to, team, ts }]. */
export function useMessages() {
  const [messages, setMessages] = useState([])
  useEffect(
    () =>
      onValue(messagesRef(), (snap) => {
        const list = Object.entries(snap.val() || {}).map(([id, m]) => ({ id, ...m }))
        list.sort((a, b) => (a.ts || 0) - (b.ts || 0))
        setMessages(list)
      }),
    []
  )
  return messages
}
