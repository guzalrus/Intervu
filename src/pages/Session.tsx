import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { saveRecording } from '../db'


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

declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}



function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// Generate a unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}`
}

function Session() {
  const location = useLocation()
  const navigate = useNavigate()
  const { questionSet, cameraEnabled } = location.state ?? { questionSet: 'random', cameraEnabled: false }
  const sessionQuestions: string[] = questions[questionSet] ?? questions.random

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const sessionIdRef = useRef<string>(generateSessionId())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef<string>('')

  const currentQuestion = sessionQuestions[currentIndex]
  const isLastQuestion = currentIndex === sessionQuestions.length - 1

  // ── Camera + recording setup on mount ────────────────────────
  useEffect(() => {
    async function startSession() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        // Start recording immediately
        startRecording(stream)

        // Start timer
        timerRef.current = setInterval(() => {
          setTimer(prev => prev + 1)
        }, 1000)

      } catch (err) {
        console.error('Camera/mic access denied:', err)
      }
    }

    startSession()

    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop())
      if (timerRef.current) clearInterval(timerRef.current)
      window.speechSynthesis.cancel()
    }
  }, [])

  // ── Speak question when index changes ────────────────────────
  useEffect(() => {
    speakQuestion(currentQuestion)
  }, [currentIndex])

  // ── Text-to-speech ────────────────────────────────────────────
  function speakQuestion(text: string) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  // ── Start a fresh MediaRecorder for each question ─────────────
  function startRecording(stream: MediaStream) {
    chunksRef.current = []
    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.start()

    // Transcribe speech alongside recording
    transcriptRef.current = ''
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognitionClass()
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcriptRef.current += event.results[i][0].transcript + ' '
        }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  // ── Stop current recording and save it to IndexedDB ───────────
  async function stopAndSave(questionText: string, questionIndex: number): Promise<void> {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        resolve()
        return
      }

      // stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        await saveRecording({
          question: questionText,
          blob,
          timestamp: Date.now(),
          questionIndex,
          sessionId: sessionIdRef.current,
          transcript: transcriptRef.current
        })
        resolve()
      }

      recorder.stop()
    })
  }

  // ── Handle moving to next question or finishing ───────────────
  async function handleNext() {
    setIsSaving(true)

    // Save the current question's recording
    await stopAndSave(currentQuestion, currentIndex)

    if (isLastQuestion) {
      if (timerRef.current) clearInterval(timerRef.current)
      navigate(`/review/${sessionIdRef.current}`)
    } else {
      // Start a fresh recording for the next question
      if (streamRef.current) startRecording(streamRef.current)
      setCurrentIndex(prev => prev + 1)
      setIsSaving(false)
    }
  }

  // ── UI ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="px-8 py-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Intervu</h1>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 font-mono text-sm">{formatTime(timer)}</span>
        </div>
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

          {/* Waveform */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col items-center justify-center py-16 gap-6">
            <div className="flex items-end gap-1 h-16">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 rounded-full transition-all duration-150 ${
                    isSpeaking ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                  style={{
                    height: isSpeaking ? `${Math.random() * 100}%` : '20%',
                  }}
                />
              ))}
            </div>
            <p className="text-gray-400 text-sm">
              {isSpeaking ? 'Interviewer is speaking...' : 'Waiting for your answer'}
            </p>
          </div>

          {/* Question */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
            <span className="text-xs text-blue-400 font-semibold uppercase tracking-widest">
              Question {currentIndex + 1} of {sessionQuestions.length}
            </span>
            <p className="text-lg font-medium leading-relaxed">{currentQuestion}</p>
            <button
              onClick={() => speakQuestion(currentQuestion)}
              className="text-sm text-gray-400 hover:text-white transition-colors self-start"
            >
              🔁 Repeat question
            </button>
          </div>

        </div>

        {/* Right Panel — Candidate */}
        <div className="flex flex-col gap-6 w-1/2">

          {/* Camera preview */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden aspect-video flex items-center justify-center relative">
            {cameraEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-600">
                <span className="text-4xl">🎙️</span>
                <p className="text-sm">Audio recording in progress</p>
              </div>
            )}
            {/* Always show recording indicator */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400">REC</span>
            </div>
          </div>

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-semibold py-4 rounded-xl text-lg"
          >
            {isSaving ? 'Saving...' : isLastQuestion ? 'Finish Session →' : 'Next Question →'}
          </button>

        </div>
      </main>
    </div>
  )
}

export default Session