import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Offline app shell (see public/sw.js). Production only — in dev it would
// cache Vite's modules and fight hot reload.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}

// Android/desktop Chrome fire this once, early — keep it for the install button.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window.__bvbInstallPrompt = e
  window.dispatchEvent(new Event('bvb-installable'))
})

// HashRouter because GitHub Pages has no SPA rewrite support —
// /#/host and /#/display work without a 404 fallback hack.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
