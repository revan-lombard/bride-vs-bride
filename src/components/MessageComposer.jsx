import { useState } from 'react'
import { THEME } from '../lib/theme'
import { MESSAGE_MAX, sendMessage } from '../lib/gameActions'
import { playCue, vibrate } from '../lib/sounds'

/**
 * Phone sheet for writing the brides a message. Saved straight to Firebase
 * (outside the game state, so resets never touch it); the host collects
 * them all afterwards on /#/messages.
 */
export default function MessageComposer({ player, onClose }) {
  const [text, setText] = useState('')
  const [name, setName] = useState(player.userName)
  const [to, setTo] = useState('both')
  const [status, setStatus] = useState('writing') // writing | sending | sent | error

  const send = async () => {
    if (!text.trim() || status === 'sending') return
    setStatus('sending')
    try {
      await sendMessage(player, { text, name, to })
      playCue('mark')
      vibrate([60, 40, 60])
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-md bg-stage rounded-t-3xl sm:rounded-3xl p-5 space-y-4 border-t-4 border-bride-a"
        onClick={(e) => e.stopPropagation()}
      >
        {status === 'sent' ? (
          <div className="text-center space-y-4 py-6">
            <div className="text-6xl">💌</div>
            <h2 className="text-2xl font-bold">Sent with love!</h2>
            <p className="text-white/70">The brides get every message after the celebrations.</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setText('')
                  setStatus('writing')
                }}
                className="flex-1 rounded-xl bg-white/15 py-3 font-bold"
              >
                Write another
              </button>
              <button onClick={onClose} className="flex-1 rounded-xl bg-white text-stage py-3 font-bold">
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">💌 A message for the brides</h2>
              <button onClick={onClose} className="text-2xl text-white/60" aria-label="Close">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {[
                ['both', 'Both 💕'],
                ['teamA', THEME.brideA],
                ['teamB', THEME.brideB],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTo(id)}
                  className={`rounded-lg py-2 font-bold ${to === id ? 'bg-white text-stage' : 'bg-white/10'}`}
                >
                  {id === 'both' ? label : `To ${label}`}
                </button>
              ))}
            </div>
            <textarea
              autoFocus
              rows={6}
              maxLength={MESSAGE_MAX}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Your wishes, advice, a favourite memory… 💐"
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-base outline-none focus:ring-2 ring-white/50 resize-none"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60 shrink-0">From</span>
              <input
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm outline-none"
              />
              <span className="text-xs text-white/40 tabular-nums">
                {text.length}/{MESSAGE_MAX}
              </span>
            </div>
            {status === 'error' && <p className="text-sm text-red-300">Couldn't send — check your connection and try again.</p>}
            <button
              onClick={send}
              disabled={!text.trim() || status === 'sending'}
              className="w-full rounded-xl bg-bride-a py-3 text-lg font-bold disabled:opacity-40"
            >
              {status === 'sending' ? 'Sending…' : 'Send 💌'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
