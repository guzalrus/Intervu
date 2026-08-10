import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Session from './pages/Session'
import Review from './pages/Review'
import Sessions from './pages/Sessions'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/session" element={<Session />} />
      <Route path="/review/:sessionId" element={<Review />} />
      <Route path="/sessions" element={<Sessions />} />
    </Routes>
  )
}

export default App
