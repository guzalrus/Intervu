import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSessionRecordings} from '../db'
import type { Highlight, ReviewResult } from '../types/review'


interface Recording {
  id: number
  question: string
  blob: Blob
  timestamp: number
  questionIndex: number
  sessionId: string
  transcript: string
}

interface Segment {
  text: string;
  highlight?: Highlight; // undefined = plain text segment
}


function buildSegments(transcript: string, highlights: Highlight[]): Segment[] {
  // Find match positions for each highlight, skip ones that don't match
  const matches = highlights
    .map(h => ({ highlight: h, index: transcript.indexOf(h.quote) }))
    .filter(m => m.index !== -1)
    .sort((a, b) => a.index - b.index); // left-to-right order

  const segments: Segment[] = [];
  let cursor = 0;

  for (const match of matches) {
    // skip overlapping matches (already covered by cursor)
    if (match.index < cursor) continue;

    // plain text before this highlight
    if (match.index > cursor) {
      segments.push({ text: transcript.slice(cursor, match.index) });
    }

    // the highlighted chunk itself
    segments.push({
      text: match.highlight.quote,
      highlight: match.highlight,
    });

    cursor = match.index + match.highlight.quote.length;
  }

  // remaining plain text after the last highlight
  if (cursor < transcript.length) {
    segments.push({ text: transcript.slice(cursor) });
  }

  return segments;
}

function TranscriptWithHighlights({ transcript, highlights }: { transcript: string; highlights: Highlight[] }) {
  const segments = useMemo(() => buildSegments(transcript, highlights), [transcript, highlights]);
  const [activeComment, setActiveComment] = useState<string | null>(null);

  return (
    <div className="relative leading-relaxed">
      {segments.map((seg, i) =>
        seg.highlight ? (
          <span
            key={i}
            onClick={() => setActiveComment(seg.highlight!.comment)}
            className={
              seg.highlight.type === "strength"
                ? "bg-green-500/20 border-b-2 border-green-500 cursor-pointer"
                : "bg-amber-500/20 border-b-2 border-amber-500 cursor-pointer"
            }
          >
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}

      {activeComment && (
        <div className="mt-3 p-3 rounded bg-slate-800 text-sm">
          {activeComment}
        </div>
      )}
    </div>
  );
}


async function fetchFeedback(question: string, transcript: string): Promise<ReviewResult> {
  const response = await fetch('http://localhost:8080/api/review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, transcript }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch feedback')
  }

  return response.json()
}



function Review() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()

  const [recordings, setRecordings] = useState<Recording[]>([])
  const [selected, setSelected] = useState<Recording | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [feedbackCache, setFeedbackCache] = useState<Record<number, ReviewResult>>({})
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  // ── Load recordings from IndexedDB ────────────────────────────
  useEffect(() => {
    async function loadRecordings() {
      if (!sessionId) {
        setLoading(false)
        return
      }
      const results = await getSessionRecordings(sessionId)
      const sorted = results.sort((a, b) => a.questionIndex - b.questionIndex)
      setRecordings(sorted)

      // Auto select the first recording
      if (sorted.length > 0) setSelected(sorted[0])
      setLoading(false)
    }
    loadRecordings()
  }, [sessionId])

  // ── When selected recording changes, create a playable URL ────
  useEffect(() => {
    if (!selected) return

    // Revoke the old URL to free memory
    if (videoUrl) URL.revokeObjectURL(videoUrl)

    const url = URL.createObjectURL(selected.blob)
    setVideoUrl(url)

    // Cleanup when component unmounts
    return () => URL.revokeObjectURL(url)
  }, [selected])

  // Handles fetching feedback for the selected recording

  async function handleAnalyze() {
  if (!selected) return
  if (feedbackCache[selected.id]) return // already have it cached

  setFeedbackLoading(true)
  setFeedbackError(null)

  try {
    const result = await fetchFeedback(selected.question, selected.transcript)
    setFeedbackCache(prev => ({ ...prev, [selected.id]: result }))
  } catch (err) {
    console.error(err)
    setFeedbackError('Could not generate feedback. Make sure the backend is running.')
  } finally {
    setFeedbackLoading(false)
  }
}



  // ── UI ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading recordings...</p>
      </div>
    )
  }

  if (!sessionId || recordings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400">No recordings found for this session.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-500 transition-colors text-white font-semibold px-6 py-3 rounded-xl"
        >
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="px-8 py-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Intervu</h1>
        <span className="text-gray-400 text-sm">Session Review</span>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          New Session
        </button>
      </header>

      <main className="flex flex-1 gap-6 p-8">

        {/* Left Panel — Question List */}
        <div className="flex flex-col gap-3 w-1/3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Your Answers
          </h2>
          {recordings.map((rec) => (
            <button
              key={rec.id}
              onClick={() => setSelected(rec)}
              className={`text-left px-4 py-4 rounded-xl border transition-colors ${
                selected?.id === rec.id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-800 bg-gray-900 hover:border-gray-600'
              }`}
            >
              <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-1">
                Question {rec.questionIndex + 1}
              </p>
              <p className="text-sm text-gray-300 leading-snug line-clamp-2">
                {rec.question}
              </p>
            </button>
          ))}
        </div>

        {/* Right Panel — Video Player */}
        <div className="flex flex-col gap-6 flex-1">

          {/* Question text */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <span className="text-xs text-blue-400 font-semibold uppercase tracking-widest">
              Question {selected ? selected.questionIndex + 1 : ''}
            </span>
            <p className="text-lg font-medium leading-relaxed mt-2">
              {selected?.question}
            </p>
          </div>

          {/* Video player */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
            {videoUrl ? (
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <p className="text-gray-600 text-sm">Select a question to watch your answer</p>
            )}
          </div>

          {/* Recorded at timestamp */}
          {/* Recorded at timestamp */}
{selected && (
  <p className="text-gray-600 text-xs text-right">
    Recorded at {new Date(selected.timestamp).toLocaleTimeString()}
  </p>
)}

{/* AI Feedback Section */}
{selected && (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <span className="text-xs text-blue-400 font-semibold uppercase tracking-widest">
        AI Feedback
      </span>
      {!feedbackCache[selected.id] && (
        <button
          onClick={handleAnalyze}
          disabled={feedbackLoading}
          className="text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors text-white font-medium px-4 py-2 rounded-lg"
        >
          {feedbackLoading ? 'Analyzing...' : 'Get AI Feedback'}
        </button>
      )}
    </div>

    {feedbackError && (
      <p className="text-red-400 text-sm">{feedbackError}</p>
    )}

    {feedbackCache[selected.id] && (
      <div className="flex flex-col gap-5">

        {/* Score */}
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-blue-400">
            {feedbackCache[selected.id].score}/10
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            {feedbackCache[selected.id].summary}
          </p>
        </div>

        {/* Strengths */}
        <div>
          <p className="text-xs text-green-400 font-semibold uppercase tracking-widest mb-2">
            Strengths
          </p>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            {(feedbackCache[selected.id].strengths ?? []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div>
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-2">
            Areas to Improve
          </p>
          <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
            {(feedbackCache[selected.id].improvements ?? []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        {/* Transcript with highlights */}
        {selected.transcript && (
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-2">
              Your Transcript
            </p>
            <div className="text-sm text-gray-300 bg-gray-950 border border-gray-800 rounded-xl p-4">
              <TranscriptWithHighlights
                transcript={selected.transcript}
                highlights={feedbackCache[selected.id].highlights ?? []}
              />
            </div>
          </div>
        )}

        {/* Rewrite suggestion */}
        <div>
          <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest mb-2">
            Suggested Rewrite
          </p>
          <p className="text-sm text-gray-300 leading-relaxed bg-gray-950 border border-gray-800 rounded-xl p-4">
            {feedbackCache[selected.id].rewriteSuggestion}
          </p>
        </div>

      </div>
    )}
  </div>
)}

        </div>
      </main>
    </div>
  )
}

export default Review