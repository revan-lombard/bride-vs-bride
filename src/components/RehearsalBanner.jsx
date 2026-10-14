import { IS_REHEARSAL } from '../lib/mode'

/** Unmissable marker that this tab is playing against the practice state. */
export default function RehearsalBanner() {
  if (!IS_REHEARSAL) return null
  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 rounded-b-xl bg-amber-400 text-stage px-4 py-1 text-xs font-extrabold tracking-widest pointer-events-none">
      🧪 REHEARSAL — NOT THE LIVE GAME
    </div>
  )
}
