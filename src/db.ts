import { openDB } from 'idb'

const DB_NAME = 'intervu'
const STORE_NAME = 'recordings'

// Open (or create) the database
export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    },
  })
}

// Save a single recording
export async function saveRecording(recording: {
  question: string
  blob: Blob
  timestamp: number
  questionIndex: number
  sessionId: string
  transcript: string
}) {
  const db = await getDB()
  await db.add(STORE_NAME, recording)
}

// Get all recordings for a specific session
export async function getSessionRecordings(sessionId: string) {
  const db = await getDB()
  const all = await db.getAll(STORE_NAME)
  return all.filter(r => r.sessionId === sessionId)
}

// Get all sessions (for a sessions list later)
export async function getAllRecordings() {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

// Delete all recordings belonging to a session
export async function deleteSession(sessionId: string) {
  const db = await getDB()
  const all = await db.getAll(STORE_NAME)
  const toDelete = all.filter(r => r.sessionId === sessionId)

  for (const rec of toDelete) {
    await db.delete(STORE_NAME, rec.id)
  }
}

export async function getAllSessions() {
  const recordings = await getAllRecordings()
  const sessionMap = new Map<string, { sessionId: string; timestamp: number; count: number }>()

  for (const rec of recordings) {
    const existing = sessionMap.get(rec.sessionId)
    if (!existing) {
      sessionMap.set(rec.sessionId, {
        sessionId: rec.sessionId,
        timestamp: rec.timestamp,
        count: 1,
      })
    } else {
      existing.count += 1
      existing.timestamp = Math.min(existing.timestamp, rec.timestamp)
    }
  }

  return Array.from(sessionMap.values()).sort((a, b) => b.timestamp - a.timestamp)
}

