import { Routes, Route } from 'react-router-dom'
import { useGameState } from './hooks/useGameState'
import GuestView from './views/GuestView'
import HostView from './views/HostView'
import DisplayView from './views/DisplayView'
import SurveyView from './views/SurveyView'
import SurveyResultsView from './views/SurveyResultsView'
import MessagesView from './views/MessagesView'
import SetupNotice from './components/SetupNotice'
import PinGate from './components/PinGate'
import RehearsalBanner from './components/RehearsalBanner'

export default function App() {
  const gameState = useGameState()

  if (!gameState.isConfigured) return <SetupNotice />

  return (
    <>
    <RehearsalBanner />
    <Routes>
      <Route path="/" element={<GuestView {...gameState} />} />
      <Route path="/host" element={<PinGate><HostView {...gameState} /></PinGate>} />
      <Route path="/display" element={<DisplayView {...gameState} />} />
      <Route path="/survey" element={<SurveyView />} />
      <Route path="/survey-results" element={<PinGate><SurveyResultsView /></PinGate>} />
      <Route path="/messages" element={<PinGate><MessagesView /></PinGate>} />
    </Routes>
    </>
  )
}
