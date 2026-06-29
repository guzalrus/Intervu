import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Session from './pages/Session'
import Review from './pages/Review'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/session" element={<Session />} />
      <Route path="/review" element={<Review />} />
    </Routes>
  )
}

export default App
