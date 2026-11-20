// "Practise This Skill" — shapes returned by aivorah-learning-paths-service
// /practice-followup (routes/practiceFollowup.js). Answer keys never reach the client.

export type FollowupStatus = 'available' | 'in_progress' | 'completed';

export interface FollowupOutcome {
  code: 'available' | 'in_progress' | 'needs_explanation' | 'confirmed_partial' | 'assisted' | 'reviewed_solution' | 'reasoning_to_work_on' | 'keep_practising' | 'completed';
  label: string;
  text: string;
  parentText: string;
  confirmed: number;
}

export interface Recommendation {
  followupId: string;
  skillId: string;
  label: string;
  shortName: string;
  status: FollowupStatus;
  evidenceCount: number;
  outcome: FollowupOutcome;
  answeredCount: number;
}

export interface Teaching {
  methodId: string;
  methodName: string;
  title: string;
  body: string;
  examples: { label: string; text: string }[];
  table: string[][] | null;
  steps: string[] | null;
  confusion: string | null;
}

export interface PublicQuestion {
  id: string;
  type: 'mcq' | 'fill_blank';
  question: string;
  options?: string[];
  reasoningPrompt: string;
}

export interface SessionView {
  followupId: string;
  attemptId: string;
  skill: { id: string; label: string; shortName: string };
  topic: string;
  subject: string;
  grade: string;
  originalScore: number | null;
  status: FollowupStatus;
  progress: { confirmed: number; needed: number };
  teaching: Teaching;
  question: (PublicQuestion & { number: number; helpShown: 'none' | 'hint' | 'solution'; hint: string | null }) | null;
  clarification: { questionId: string; question: PublicQuestion; yourAnswer: string; prompt: string } | null;
  unavailable: string | null;
  complete: { title: string; body: string } | null;
  outcome: FollowupOutcome;
  answeredCount: number;
}

export interface ResultView {
  code: 'independent' | 'assisted' | 'clarify' | 'solution' | 'incorrect' | 'misconception' | 'unclear';
  message: string;
  questionId: string;
  type: 'mcq' | 'fill_blank';
  question: string;
  correctAnswer: string | null;
}

export interface DetailQuestion {
  seq: number;
  questionId: string;
  type: 'mcq' | 'fill_blank';
  question: string;
  options: string[] | null;
  yourAnswer: string | null;
  yourReasoning: string | null;
  clarification: string | null;
  helpUsed: 'none' | 'hint' | 'solution';
  correct: boolean;
  gradingOutcome: 'correct' | 'incorrect' | 'not_answered';
  reasoningOutcome: string;
  credit: 'independent' | 'assisted' | 'none' | 'pending_clarification';
  feedback: string | null;
  correctAnswer: string | null;
  answeredAt: string;
}

export interface PracticeDetails {
  followupId: string;
  skill: { id: string; label: string; shortName: string };
  topic: string;
  outcome: FollowupOutcome;
  questions: DetailQuestion[];
}
