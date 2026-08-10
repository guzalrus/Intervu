import Groq from 'groq-sdk'

const groq = new Groq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    dangerouslyAllowBrowser: true,
})

export interface Highlight {
    quote: string
    type: 'strength' | 'improvement'
    comment: string
}

export interface Feedback {
  score: number
  summary: string
  strengths: string[]
  improvements: string[]
  highlights: Highlight[]
  rewriteSuggestion: string
}

export async function analyzAnswer(question: string, transcript: string): Promise<Feedback> {
  const prompt = `
You are an expert interview coach evaluating a behavioral interview answer.

Question asked: "${question}"
Candidate's answer: "${transcript}"

Evaluate this answer and respond with ONLY a valid JSON object in this exact format, no markdown, no backticks:
{
  "score": <number from 1-10>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>"],
  "highlights": [
    {
      "quote": "<exact short phrase from the transcript>",
      "type": "strength",
      "comment": "<why this was good>"
    },
    {
      "quote": "<exact short phrase from the transcript>",
      "type": "improvement",
      "comment": "<how to improve this>"
    }
  ],
  "rewriteSuggestion": "<a rewritten version of their answer using STAR method>"
}

Scoring guide:
1-3: Poor — vague, no structure, missing key details
4-6: Average — some structure but lacks specifics or result
7-8: Good — clear STAR structure with specific details
9-10: Excellent — compelling story, quantified results, concise

Only include highlights for quotes that actually appear word-for-word in the transcript.
`

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
  })

  const raw = response.choices[0].message.content ?? '{}'
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as Feedback
}