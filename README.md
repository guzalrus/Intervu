# Intervu

An AI-powered behavioral interview practice app that simulates real interview conditions. An animated interviewer reads questions aloud, you record your answers, and review your performance after each session.

---

## Features

- **AI Interviewer** — An animated waveform character reads questions aloud using the browser's built-in text-to-speech API
- **Question Sets** — Choose from curated categories: Random Mix, Leadership, Conflict Resolution, Teamwork, and Growth & Failure
- **Automatic Recording** — Audio and video recording starts automatically and runs continuously across all questions
- **Camera Preview Toggle** — Optionally see yourself during the session; recording always happens regardless
- **Session Review** — After each session, rewatch your answers question by question
- **Persistent Storage** — Recordings are saved to IndexedDB and persist across page refreshes
- **Session Timer** — A live timer tracks how long you've been recording

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| Build Tool | Vite |
| Storage | IndexedDB (via `idb`) |
| Recording | MediaRecorder API (browser-native) |
| Speech | Web Speech API (browser-native) |
| Backend | Go *(planned)* |
| AI Feedback | Anthropic API *(planned)* |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (LTS version)
- npm (included with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Intervu.git
cd Intervu

# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
src/
├── pages/
│   ├── Home.tsx        # Question set selection and camera toggle
│   ├── Session.tsx     # Live interview session with recording
│   └── Review.tsx      # Post-session playback and review
├── db.ts               # IndexedDB setup and helper functions
├── App.tsx             # Route definitions
├── main.tsx            # App entry point
└── index.css           # Tailwind CSS imports and theme
```

---

## How It Works

1. **Home** — Select a question category and choose whether to show camera preview, then start the session
2. **Session** — The waveform interviewer reads each question aloud. Recording starts automatically. Hit Next Question to move through the set, or Finish Session when done
3. **Review** — Browse your answers by question. Click any question on the left to watch your recording in the player

---

## Roadmap

- [ ] Go backend for persisting sessions server-side
- [ ] AI feedback on answers via Anthropic API (STAR method scoring, clarity, relevance)
- [ ] Transcript generation via Whisper API
- [ ] User authentication
- [ ] Export recordings as video files
- [ ] Custom question sets

---

## Browser Compatibility

Intervu uses browser-native APIs for recording and speech. For best results use **Google Chrome** or **Microsoft Edge**. Firefox has limited support for the MediaRecorder API with video.

---

## License

MIT
