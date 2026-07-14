import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const questionSets = [
  { id: 'random', label: 'Random Mix', description: 'A shuffle of the most common behavioral questions' },
  { id: 'leadership', label: 'Leadership', description: 'Questions about leading teams and making decisions' },
  { id: 'conflict', label: 'Conflict Resolution', description: 'Questions about handling disagreements and difficult situations' },
  { id: 'teamwork', label: 'Teamwork', description: 'Questions about collaboration and working with others' },
  { id: 'growth', label: 'Growth & Failure', description: 'Questions about learning from mistakes and challenges' },
  { id: 'byo', label: 'Build Your Own', description: 'Create a custom set of questions to practice with' },
]

function Home() {
  const navigate = useNavigate()
  const [selectedSet, setSelectedSet] = useState('random')
  const [cameraEnabled, setCameraEnabled] = useState(true)

  function handleStart() {
    navigate('/session', {
      state: { questionSet: selectedSet, cameraEnabled },
    })
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-[#0c1f33]">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-white border-r border-[#c3c6ce] flex-col py-8 px-4 z-40">
        <div className="mb-12 px-2">
          <h1 className="text-2xl font-bold tracking-tight">Intervu</h1>
          <p className="text-[#43474d] text-sm opacity-70">AI-powered behavioral interview practice</p>
        </div>

        <nav className="flex-grow space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 py-3 px-4 rounded-lg font-semibold transition-colors border-l-4 border-[#486177] bg-[#eff4ff]"
          >
            <span className="material-symbols-outlined">home</span>
            Home
          </Link>
          <Link
            to="/review"
            className="flex items-center gap-3 py-3 px-4 rounded-lg font-semibold transition-colors text-[#43474d] hover:bg-[#eff4ff]"
          >
            <span className="material-symbols-outlined">history_edu</span>
            Review
          </Link>
          <Link
            to="/sessions"
            className="flex items-center gap-3 py-3 px-4 rounded-lg font-semibold transition-colors text-[#43474d] hover:bg-[#eff4ff]"
          >
            <span className="material-symbols-outlined">video_call</span>
            Sessions
          </Link>
        </nav>

        <div className="mt-auto px-2">
          <button
            onClick={handleStart}
            className="w-full bg-[#3a5572] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity active:scale-95"
          >
            Start Practice
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#c3c6ce] flex justify-around py-3 px-4 z-50">
        <Link to="/" className="flex flex-col items-center">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link to="/review" className="flex flex-col items-center text-[#43474d]">
          <span className="material-symbols-outlined">history_edu</span>
          <span className="text-[10px] font-semibold">Review</span>
        </Link>
        <Link to="/sessions" className="flex flex-col items-center text-[#43474d]">
          <span className="material-symbols-outlined">video_call</span>
          <span className="text-[10px] font-semibold">Sessions</span>
        </Link>
      </nav>

      {/* Main content */}
      <main className="md:ml-64 min-h-screen px-4 md:px-12 py-12 pb-24 md:pb-12 max-w-[900px] mx-auto">
        <header className="mb-10">
          <span className="text-xs font-semibold text-[#486177] uppercase tracking-widest mb-2 block">
            New session
          </span>
          <h2 className="text-3xl md:text-[40px] md:leading-[48px] font-bold tracking-tight max-w-2xl">
            Ready to practice?
          </h2>
        </header>

        <div className="bg-white border border-[#c3c6ce] rounded-xl p-6 md:p-10 relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-8">
            {/* Question Set Picker */}
            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Choose a question set</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {questionSets.map((set) => (
                  <button
                    key={set.id}
                    onClick={() => setSelectedSet(set.id)}
                    className={`text-left h-full p-5 border-2 rounded-lg bg-white transition-all flex flex-col justify-between ${
                      selectedSet === set.id
                        ? 'border-[#486177] bg-[#c9e3fd]/30'
                        : 'border-[#c3c6ce] hover:border-[#73777e]'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{set.label}</p>
                      <p className="text-sm text-[#43474d] mt-0.5">{set.description}</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <span
                        className={`material-symbols-outlined text-[#486177] transition-opacity ${
                          selectedSet === set.id ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        check_circle
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Camera Toggle */}
            <section className="flex items-center justify-between bg-[#eff4ff] border border-[#c3c6ce]/30 rounded-lg px-5 py-4">
              <div>
                <p className="font-semibold">Camera</p>
                <p className="text-sm text-[#43474d] mt-0.5">Show video preview during the session</p>
              </div>
              <button
                onClick={() => setCameraEnabled(!cameraEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  cameraEnabled ? 'bg-[#486177]' : 'bg-[#73777e]'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    cameraEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </section>

            {/* Start Button */}
            <button
              onClick={handleStart}
              className="w-full bg-[#3a5572] hover:opacity-90 transition-all text-white font-semibold py-4 rounded-lg text-lg active:scale-[0.99]"
            >
              Start Interview
            </button>
          </div>

          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#486177]/5 rounded-full blur-3xl pointer-events-none" />
        </div>
      </main>
    </div>
  )
}

export default Home