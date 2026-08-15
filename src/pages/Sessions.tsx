import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getAllSessions, deleteSession } from '../db'


interface SessionSummary {
  sessionId: string
  timestamp: number
  count: number
}



function Sessions() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const results = await getAllSessions()
      setSessions(results)
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete(e: React.MouseEvent, sessionId: string) {
    e.stopPropagation() // prevent the card's onClick from firing too
    const confirmed = window.confirm('Delete this session? This cannot be undone.')
    if (!confirmed) return

    await deleteSession(sessionId)
    setSessions(prev => prev.filter(s => s.sessionId !== sessionId))
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-[#0c1f33]">

      {/* Sidebar */}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-white border-r border-[#c3c6ce] flex-col py-8 px-4 z-40">
        <div className="mb-12 px-2">
          <h1 className="text-2xl font-bold tracking-tight">Intervu</h1>
          <p className="text-[#43474d] text-sm opacity-70">AI-powered behavioral interview practice</p>
        </div>
        <nav className="flex-grow space-y-2">
          <Link to="/" className="flex items-center gap-3 py-3 px-4 rounded-lg font-semibold transition-colors text-[#43474d] hover:bg-[#eff4ff]">            Home
          </Link>
          <Link to="/sessions" className="flex items-center gap-3 py-3 px-4 rounded-lg font-semibold transition-colors border-l-4 border-[#486177] bg-[#eff4ff]">
            Sessions
          </Link>
        </nav>
        <div className="mt-auto px-2">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-[#3a5572] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Start Practice
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#c3c6ce] flex justify-around py-3 px-4 z-50">
        <Link to="/" className="flex flex-col items-center text-[#43474d]">
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link to="/sessions" className="flex flex-col items-center">
          <span className="text-[10px] font-semibold">Sessions</span>
        </Link>
      </nav>

      {/* Main content */}
      <main className="md:ml-64 min-h-screen px-4 md:px-12 py-12 pb-24 md:pb-12 max-w-[900px] mx-auto">
        <header className="mb-10">
          <span className="text-xs font-semibold text-[#486177] uppercase tracking-widest mb-2 block">
            History
          </span>
          <h2 className="text-3xl md:text-[40px] font-bold tracking-tight">
            Past Sessions
          </h2>
        </header>

        {loading ? (
          <p className="text-[#43474d]">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <p className="text-[#43474d] text-lg">No sessions yet</p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#3a5572] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90"
            >
              Start your first session
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sessions.map((session) => (
              <button
                key={session.sessionId}
                onClick={() => navigate(`/review/${session.sessionId}`)}
                className="w-full text-left bg-white border border-[#c3c6ce] rounded-xl px-6 py-5 hover:border-[#486177] hover:shadow-sm transition-all relative group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#0c1f33]">
                      {new Date(session.timestamp).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-[#43474d] mt-1">
                      {session.count} question{session.count !== 1 ? 's' : ''} answered
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => handleDelete(e, session.sessionId)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-50 text-[#73777e] hover:text-red-600"
                    >
                      <span className="material-symbols-outlined text-lg"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path fill="#dc2626" d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zm2-4h2V8H9zm4 0h2V8h-2z"/></svg></span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[#73777e] mt-3">
                  {new Date(session.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Sessions