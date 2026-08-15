export interface Highlight {
  quote: string;
  comment: string;
  type: "strength" | "improvement";
}

export interface ReviewResult {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  highlights: Highlight[];
  rewriteSuggestion: string;
}
