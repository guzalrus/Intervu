import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const questions: Record<string, string[]> = {
  random: [
    'Tell me about a time you had to work with a difficult team member.',
    'Describe a situation where you had to meet a tight deadline.',
    'Tell me about a time you failed and what you learned from it.',
    'Give an example of a goal you reached and how you achieved it.',
    'Describe a time you showed leadership.',
  ],
  leadership: [
    'Tell me about a time you led a team through a difficult situation.',
    'Describe a time you had to make a tough decision as a leader.',
    'How have you motivated others when morale was low?',
  ],
  conflict: [
    'Tell me about a time you disagreed with your manager.',
    'Describe a situation where you had to resolve a conflict between teammates.',
    'How do you handle it when someone criticizes your work?',
  ],
  teamwork: [
    'Tell me about a time you collaborated on a challenging project.',
    'Describe a situation where you had to rely on a teammate.',
    "How do you handle it when a team member isn't pulling their weight?",
  ],
  growth: [
    'Tell me about a time you failed and what you learned.',
    'Describe a skill you taught yourself and how you did it.',
    'Tell me about a piece of feedback that changed how you work.',
  ],
}

function Session() {
  const location = useLocation()
  const navigate = useNavigate()
  const { questionSet, cameraPreview } = location.state ?? { questionSet: 'random', cameraPreview: false }
  const sessionQuestions: string[] = questions[questionSet] ?? questions.random

  // Track which question we're on
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Reference to the video element in the DOM
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentQuestion = sessionQuestions[currentIndex]
  const isLastQuestion = currentIndex === sessionQuestions.length - 1

  // ── Camera setup ──────────────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Camera access denied:', err)
      }
    }

    startCamera()

    // Cleanup: stop the camera when the user leaves the page
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // ── Text-to-speech ────────────────────────────────────────────
  function speakQuestion(text: string) {
    window.speechSynthesis.cancel() // stop anything already speaking
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  // Speak automatically when the question changes
  useEffect(() => {
    speakQuestion(currentQuestion)
  }, [currentIndex])

  function handleNext() {
    if (isLastQuestion) {
      navigate('/review')
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  // ── UI ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="px-8 py-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Intervu</h1>
        <span className="text-gray-400 text-sm">
          Question {currentIndex + 1} of {sessionQuestions.length}
        </span>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          End Session
        </button>
      </header>

      <main className="flex flex-1 gap-6 p-8">

        {/* Left Panel — Interviewer */}
        <div className="flex flex-col gap-6 w-1/2">

          {/* Question display */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
            <span className="text-xs text-blue-400 font-semibold uppercase tracking-widest">
              Question {currentIndex + 1}
            </span>
            <p className="text-lg font-medium leading-relaxed">
              {currentQuestion}
            </p>
            <button
              onClick={() => speakQuestion(currentQuestion)}
              className="text-sm text-gray-400 hover:text-white transition-colors self-start"
            >
              🔁 Repeat question
            </button>
          </div>

          {/* Waveform / Speaking indicator */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center justify-center py-16 gap-6">
            <div className="flex items-end gap-1 h-16">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 rounded-full transition-all duration-150 ${
                    isSpeaking ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                  style={{
                    height: isSpeaking
                      ? `${Math.random() * 100}%`
                      : '20%',
                  }}
                />
              ))}
            </div>
            <p className="text-gray-400 text-sm">
              {isSpeaking ? 'Interviewer is speaking...' : 'Waiting for your answer'}
            </p>
          </div>

          

        </div>

        {/* Right Panel — Candidate */}
        <div className="flex flex-col gap-6 w-1/2">

          {/* Camera preview or placeholder */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
            {cameraPreview ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <p className="text-gray-600 text-sm">Camera preview off</p>
            )}
          </div>

          {/* Next button */}
          <button
            onClick={handleNext}
            className="w-full bg-blue-600 hover:bg-blue-500 transition-colors text-white font-semibold py-4 rounded-xl text-lg"
          >
            {isLastQuestion ? 'Finish Session' : 'Next Question →'}
          </button>

        </div>
      </main>
    </div>
  )
}

export default Session