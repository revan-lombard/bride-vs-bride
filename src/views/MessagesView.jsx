import { useState } from 'react'
import { THEME } from '../lib/theme'
import { deleteMessage } from '../lib/gameActions'
import { useMessages } from '../hooks/useMessages'
import { IS_REHEARSAL } from '../lib/mode'

const toLabel = (to) =>
  to === 'teamA' ? `To ${THEME.brideA}` : to === 'teamB' ? `To ${THEME.brideB}` : `To ${THEME.brideA} & ${THEME.brideB}`

const esc = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** A self-contained, print-friendly keepsake page (open it and Print → Save as PDF). */
function keepsakeHtml(messages) {
  const title = `Messages for ${THEME.brideA} & ${THEME.brideB}`
  const cards = messages
    .map(
      (m) => `<article>
  <div class="to">${esc(toLabel(m.to))}</div>
  <p>${esc(m.text).replace(/\n/g, '<br>')}</p>
  <div class="from">— ${esc(m.name)}</div>
</article>`
    )
    .join('\n')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; background: #fdf2f8; color: #1e1b4b; margin: 0; padding: 40px 16px; }
  header { text-align: center; margin-bottom: 32px; }
  h1 { font-size: 2.2rem; margin: 0 0 6px; }
  header p { color: #6b7280; margin: 0; }
  main { max-width: 760px; margin: 0 auto; columns: 2 320px; column-gap: 20px; }
  article { break-inside: avoid; background: #fff; border-radius: 14px; padding: 18px 20px; margin: 0 0 20px; box-shadow: 0 2px 10px rgba(30,27,75,.08); border-top: 4px solid #f472b6; }
  article:nth-child(even) { border-top-color: #a78bfa; }
  .to { font-size: .75rem; text-transform: uppercase; letter-spacing: .08em; color: #9ca3af; }
  p { font-size: 1.05rem; line-height: 1.55; margin: 10px 0; overflow-wrap: anywhere; }
  .from { text-align: right; font-style: italic; color: #6b21a8; overflow-wrap: anywhere; }
  @media print { body { background: #fff; padding: 0; } article { box-shadow: none; border: 1px solid #e5e7eb; } }
</style></head><body>
<header><h1>💍 ${esc(title)} 💍</h1><p>${messages.length} messages from your kitchen tea</p></header>
<main>
${cards}
</main></body></html>`
}

const plainText = (messages) =>
  messages.map((m) => `${toLabel(m.to)}\n${m.text}\n— ${m.name}`).join('\n\n----------\n\n')

/**
 * Host page (/#/messages, PIN-gated): every message guests wrote for the
 * brides, live. Remove anything inappropriate, then export a keepsake.
 */
export default function MessagesView() {
  const messages = useMessages()
  const [copied, setCopied] = useState(false)
  const date = new Date().toISOString().slice(0, 10)

  return (
    <div className="min-h-full max-w-2xl mx-auto p-4 space-y-5 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">💌 Messages for the brides{IS_REHEARSAL && ' 🧪'}</h1>
        <a href="#/host" className="text-sm text-white/60 underline">
          ← Host panel
        </a>
      </header>

      <p className="text-sm text-white/70">
        {messages.length} message{messages.length === 1 ? '' : 's'} so far. Guests write them from the 💌 button on
        their phones. These are kept separately from the game, so <b>Reset everything doesn't delete them</b>.
      </p>

      <div className="grid grid-cols-3 gap-2">
        <button
          disabled={!messages.length}
          onClick={() => download(`messages-for-the-brides-${date}.html`, keepsakeHtml(messages), 'text/html')}
          className="rounded-lg bg-bride-a py-3 text-sm font-bold disabled:opacity-40"
        >
          ⬇️ Keepsake page
        </button>
        <button
          disabled={!messages.length}
          onClick={() => download(`messages-for-the-brides-${date}.txt`, plainText(messages), 'text/plain')}
          className="rounded-lg bg-white/15 py-3 text-sm font-bold disabled:opacity-40"
        >
          ⬇️ Text file
        </button>
        <button
          disabled={!messages.length}
          onClick={async () => {
            await navigator.clipboard?.writeText(plainText(messages))
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
          className="rounded-lg bg-white/15 py-3 text-sm font-bold disabled:opacity-40"
        >
          {copied ? '✅ Copied' : '📋 Copy all'}
        </button>
      </div>
      <p className="text-xs text-white/40">
        Tip: open the keepsake page and use Print → Save as PDF for a lovely file to send the brides.
      </p>

      <div className="space-y-3">
        {!messages.length && <p className="text-center text-white/50 py-10">No messages yet 💭</p>}
        {[...messages].reverse().map((m) => (
          <article
            key={m.id}
            className={`rounded-xl bg-white/10 p-4 space-y-2 border-l-4 ${m.team === 'teamB' ? 'border-bride-b' : 'border-bride-a'}`}
          >
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>{toLabel(m.to)}</span>
              <span>{m.ts ? new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
            <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{m.text}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm italic text-white/80">— {m.name}</span>
              <button
                onClick={() => confirm(`Delete this message from ${m.name}? This can't be undone.`) && deleteMessage(m.id)}
                className="text-xs text-white/40 underline"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
