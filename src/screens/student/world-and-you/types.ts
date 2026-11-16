export interface OnThisDay { year: number; fact: string }
export interface FunChallenge { question: string; answer: string }
export interface WorldData {
  onThisDay: OnThisDay[];
  funChallenge: FunChallenge;
  date: string;
  /** true = a ready-made puzzle while the AI is still writing today's. */
  partial?: boolean;
}

export interface GKFact {
  fact: string;
  category: string;
  /** Set when the fact comes from the important-days book ("Important Day"). */
  eventName?: string;
  /** MM-DD of that important day (today, or the next one when the book skips today). */
  eventDate?: string;
}

/** One important day from the GK book (GET /current-affairs/gk/date). */
export interface ImportantDayEvent {
  event_name: string;
  date: string;         // MM-DD
  month: string;
  day: number;
  description: string;  // What is it?
  why_special: string;
  how_celebrated: string;
  story: string;
  facts: string[];      // Did you know?
  quote: string;
}
export interface CurrentAffair {
  headline: string;
  summary: string;
}
export interface TidbitData {
  grade: string;
  date: string;
  gk: GKFact;
  /** Only when asked with currentAffairs=1 (the app no longer shows it). */
  currentAffairs?: CurrentAffair | null;
  /** true = a ready-made fact while the AI is still writing today's. */
  partial?: boolean;
}
