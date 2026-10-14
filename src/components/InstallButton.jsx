import { useEffect, useState } from 'react'

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

/**
 * "Add to home screen" — opens full-screen with no browser bars, and loads
 * from the device even if the Wi-Fi blips. Chrome/Android get a real
 * install button; iPhones get the Share-menu instructions.
 */
export default function InstallButton({ className = '' }) {
  const [prompt, setPrompt] = useState(() => window.__bvbInstallPrompt || null)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    const ready = () => setPrompt(window.__bvbInstallPrompt || null)
    const done = () => setInstalled(true)
    window.addEventListener('bvb-installable', ready)
    window.addEventListener('appinstalled', done)
    return () => {
      window.removeEventListener('bvb-installable', ready)
      window.removeEventListener('appinstalled', done)
    }
  }, [])

  if (installed) return null

  if (prompt) {
    return (
      <button
        onClick={async () => {
          prompt.prompt()
          const { outcome } = await prompt.userChoice
          window.__bvbInstallPrompt = null
          setPrompt(null)
          if (outcome === 'accepted') setInstalled(true)
        }}
        className={`rounded-xl bg-white/10 px-4 py-2 text-sm font-bold ${className}`}
      >
        📲 Add to home screen
      </button>
    )
  }

  if (isIos()) {
    return (
      <p className={`text-xs text-white/50 text-center ${className}`}>
        📲 Tip: tap <b>Share</b> → <b>Add to Home Screen</b> for full-screen play
      </p>
    )
  }
  return null
}
