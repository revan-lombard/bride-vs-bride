import { useState } from 'react'
import { THEME } from '../lib/theme'

/**
 * Party-grade gate for the host views: stops a curious guest who edits the
 * URL, nothing more. Remembered per device after the first correct entry.
 */
export default function PinGate({ children }) {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem('bvb-host-pin') === THEME.hostPin
  )
  const [pin, setPin] = useState('')
  const [wrong, setWrong] = useState(false)

  if (unlocked) return children

  const tryPin = () => {
    if (pin === THEME.hostPin) {
      localStorage.setItem('bvb-host-pin', pin)
      setUnlocked(true)
    } else {
      setWrong(true)
      setPin('')
    }
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 gap-4 text-center">
      <div className="text-5xl">🔐</div>
      <h1 className="text-xl font-bold">Host access</h1>
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        className="w-40 rounded-xl bg-white/10 px-4 py-3 text-2xl text-center tracking-widest outline-none focus:ring-2 ring-white/50"
        placeholder="PIN"
        value={pin}
        maxLength={8}
        onChange={(e) => {
          setPin(e.target.value)
          setWrong(false)
        }}
        onKeyDown={(e) => e.key === 'Enter' && tryPin()}
      />
      {wrong && <p className="text-red-400 text-sm">Wrong PIN — try again</p>}
      <button
        onClick={tryPin}
        className="w-40 rounded-xl bg-white text-stage font-bold py-3"
      >
        Unlock
      </button>
    </div>
  )
}
