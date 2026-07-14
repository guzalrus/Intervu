import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSessionRecordings } from '../db'
import type { Highlight } from '../types/review'


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

function Review() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()

  const [recordings, setRecordings] = useState<Recording[]>([])
  const [selected, setSelected] = useState<Recording | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
          {selected && (
            <p className="text-gray-600 text-xs text-right">
              Recorded at {new Date(selected.timestamp).toLocaleTimeString()}
            </p>
          )}

        </div>
      </main>
    </div>
  )
}

export default Review