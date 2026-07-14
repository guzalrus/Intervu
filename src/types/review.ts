export interface Highlight {
  quote: string;
  comment: string;
  type: "strength" | "improvement";
}

export interface ReviewResult {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  highlights: Highlight[];
}
