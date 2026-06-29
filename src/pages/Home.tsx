import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
      state: { questionSet: selectedSet, cameraEnabled }
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold tracking-tight">Intervu</h1>
        <p className="text-gray-400 text-sm mt-1">AI-powered behavioral interview practice</p>
      </header>

      {/* Content */}
      <main className="flex flex-col items-center justify-center flex-1 px-8 py-12 gap-10 max-w-2xl mx-auto w-full">

        {/* Question Set Picker */}
        <section className="w-full flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Choose a question set</h2>
          <div className="flex flex-col gap-3">
            {questionSets.map((set) => (
              <button
                key={set.id}
                onClick={() => setSelectedSet(set.id)}
                className={`w-full text-left px-5 py-4 rounded-xl border transition-colors ${
                  selectedSet === set.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                }`}
              >
                <p className="font-medium">{set.label}</p>
                <p className="text-gray-400 text-sm mt-0.5">{set.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Camera Toggle */}
        <section className="w-full flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
          <div>
            <p className="font-medium">Camera</p>
            <p className="text-gray-400 text-sm mt-0.5">Show video preview during the session</p>
          </div>
          <button
            onClick={() => setCameraEnabled(!cameraEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              cameraEnabled ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
              cameraEnabled ? 'left-7' : 'left-1'
            }`} />
          </button>
        </section>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full bg-blue-600 hover:bg-blue-500 transition-colors text-white font-semibold py-4 rounded-xl text-lg"
        >
          Start Interview
        </button>

      </main>
    </div>
  )
}

export default Home