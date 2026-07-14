type ReviewRequest struct {
	Question string `json:"question"`
	Transcript string `json:"transcript"`
}

type Heighlight struct {
	Quote string `json:"quote"`
	Comment string `json:"comment"`
	Type string `json:"type"`
}

type ReviewResult struct {
    OverallScore int         `json:"overallScore"`
    Summary      string      `json:"summary"`
    Strengths    []string    `json:"strengths"`
    Weaknesses   []string    `json:"weaknesses"`
    Highlights   []Highlight `json:"highlights"`
}

func handleReview(w http.ResponseWriter, r *http.Request) {
	var req ReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	result, err := callClaudeForReview(req.Question, req.Transcript)
	if err != nil {
		log.Printf("review generation failed %v", err)
		http.Error(w, "Failed to generate review", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

type claudeRequest struct {
    Model     string          `json:"model"`
    MaxTokens int             `json:"max_tokens"`
    System    string          `json:"system"`
    Messages  []claudeMessage `json:"messages"`
}

type claudeMessage struct {
    Role    string `json:"role"`
    Content string `json:"content"`
}

// prompt to Claude for review generation
func callClaudeForReview(question, transcript string) (*ReviewResult, error) {
    systemPrompt := `You are an expert interview coach evaluating behavioral 
interview answers using the STAR method...` // full prompt from Part 3

    userMessage := fmt.Sprintf(`Question: "%s"
Answer transcript: "%s"

Evaluate this answer using the STAR framework above.`, question, transcript)

    reqBody := claudeRequest{
        Model:     "claude-sonnet-4-6",
        MaxTokens: 1000,
        System:    systemPrompt,
        Messages: []claudeMessage{
            {Role: "user", Content: userMessage},
            {Role: "assistant", Content: "{"}, 
        },
    }

    bodyBytes, _ := json.Marshal(reqBody)
    httpReq, _ := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(bodyBytes))
    httpReq.Header.Set("Content-Type", "application/json")
    httpReq.Header.Set("x-api-key", os.Getenv("ANTHROPIC_API_KEY"))
    httpReq.Header.Set("anthropic-version", "2023-06-01")

    client := &http.Client{Timeout: 30 * time.Second}
    resp, err := client.Do(httpReq)
    if err != nil {
        return nil, fmt.Errorf("claude api request failed: %w", err)
    }
    defer resp.Body.Close()

    var claudeResp struct {
        Content []struct {
            Text string `json:"text"`
        } `json:"content"`
    }
    if err := json.NewDecoder(resp.Body).Decode(&claudeResp); err != nil {
        return nil, fmt.Errorf("failed to decode claude response: %w", err)
    }
    if len(claudeResp.Content) == 0 {
        return nil, fmt.Errorf("empty response from claude")
    }

    rawJSON := "{" + claudeResp.Content[0].Text

    var result ReviewResult
    if err := json.Unmarshal([]byte(rawJSON), &result); err != nil {
        return nil, fmt.Errorf("failed to parse review json: %w", err)
    }

    return &result, nil
}