import { Routes, Route } from 'react-router-dom'
import { useGameState } from './hooks/useGameState'
import GuestView from './views/GuestView'
import HostView from './views/HostView'
import DisplayView from './views/DisplayView'
import SetupNotice from './components/SetupNotice'

export default function App() {
  const gameState = useGameState()

  if (!gameState.isConfigured) return <SetupNotice />

  return (
    <Routes>
      <Route path="/" element={<GuestView {...gameState} />} />
      <Route path="/host" element={<HostView {...gameState} />} />
      <Route path="/display" element={<DisplayView {...gameState} />} />
    </Routes>
  )
}
