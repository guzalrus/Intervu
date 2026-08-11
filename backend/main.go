package main

import "github.com/joho/godotenv"

import (
    "bytes"
    "encoding/json"
    "fmt"
	"io"
    "log"
    "net/http"
    "os"
    "time"
)

// Types for request and response payloads

// ReviewRequest represents the incoming request payload for review generation
type ReviewRequest struct {
	Question string `json:"question"`
	Transcript string `json:"transcript"`
}

// ReviewResult represents the structured review result returned by the API
type Highlight struct {
	Quote string `json:"quote"`
	Comment string `json:"comment"`
	Type string `json:"type"`
}

// ReviewResult represents the structured review result returned by the API
type ReviewResult struct {
    OverallScore int         `json:"overallScore"`
    Summary      string      `json:"summary"`
    Strengths    []string    `json:"strengths"`
    Weaknesses   []string    `json:"weaknesses"`
    Highlights   []Highlight `json:"highlights"`
}



type groqRequest struct {
    Model     string          `json:"model"`
    MaxTokens int             `json:"max_tokens"`
    Messages  []groqMessage `json:"messages"`
}

type groqMessage struct {
    Role    string `json:"role"`
    Content string `json:"content"`
}

// CORS = Cross-Origin Resource Sharing
// Browsers block requests between different origins (e.g. localhost:5173
// calling localhost:8080) unless the server explicitly allows it.
// This middleware adds the headers that tell the browser "yes, this is allowed".

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Browsers send a "preflight" OPTIONS request before the real one
		// We just respond OK to that and return early
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func handleReview(w http.ResponseWriter, r *http.Request) {
	var req ReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	result, err := callGroqForReview(req.Question, req.Transcript)
	if err != nil {
		log.Printf("review generation failed: %v", err)
		http.Error(w, "Failed to generate review", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// Groq API call 

func callGroqForReview(question, transcript string) (*ReviewResult, error) {
	systemPrompt := `You are an expert interview coach evaluating behavioral interview answers using the STAR method (Situation, Task, Action, Result). Respond ONLY with valid JSON, no markdown, no backticks.`

	userMessage := fmt.Sprintf(`
Question: "%s"
Transcript: "%s"

Evaluate this answer and return ONLY this JSON structure:
{
  "score": <1-10>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "highlights": [
    {
      "quote": "<exact phrase from transcript>",
      "type": "strength",
      "comment": "<why this was good>"
    },
    {
      "quote": "<exact phrase from transcript>",
      "type": "improvement",
      "comment": "<how to improve this>"
    }
  ],
  "rewriteSuggestion": "<rewritten answer using STAR method>"
}

Scoring: 1-3 poor, 4-6 average, 7-8 good, 9-10 excellent.
Only use quotes that appear word-for-word in the transcript.
`, question, transcript)

	reqBody := groqRequest{
		Model:     "llama-3.3-70b-versatile",
		MaxTokens: 1000,
		Messages: []groqMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userMessage},
		},
	}

	bodyBytes, _ := json.Marshal(reqBody)
	httpReq, _ := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(bodyBytes))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+os.Getenv("GROQ_API_KEY"))

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("groq api request failed: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes2, _ := io.ReadAll(resp.Body)
	log.Printf("Groq response status: %d", resp.StatusCode)
	log.Printf("Groq response body: %s", string(bodyBytes2))

	var groqResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(bodyBytes2, &groqResp); err != nil {
		return nil, fmt.Errorf("failed to decode groq response: %w", err)
	}
	if len(groqResp.Choices) == 0 {
		return nil, fmt.Errorf("empty response from groq")
	}

	raw := groqResp.Choices[0].Message.Content
	var result ReviewResult
	if err := json.Unmarshal([]byte(raw), &result); err != nil {
		return nil, fmt.Errorf("failed to parse review json: %w", err)
	}

	return &result, nil
}

// Main

func main() {
    godotenv.Load()
    
	port := "8080"
	log.Printf("Backend running on http://localhost:%s", port)

	http.HandleFunc("/api/review", withCORS(handleReview))

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}