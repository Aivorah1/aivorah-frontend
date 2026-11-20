export type Question = {
  // 'spoken': the last question of every practice test - the student explains
  // the topic in their own words (speech-to-text), graded by
  // POST /ibpyp/evaluate-explanation.
  type: 'mcq' | 'fill_blank' | 'spoken';
  question: string;
  options: string[];
  correct: number | string; // index for mcq, string for fill_blank
  hint: string;
  explanation: string;
};

// 'hub': the Practice start page (Take a Test / History) - see QuizScreen.
export type QuizPhase = 'hub' | 'loading' | 'quiz' | 'result';

// POST /ibpyp/evaluate-explanation's answer for the spoken question.
export type SpokenEvaluation = {
  score: number;      // 0-10
  outOf: number;      // 10
  passed: boolean;    // score >= 6: counts as a correct answer
  verdict: 'excellent' | 'good' | 'partial' | 'needs_work';
  covered: string[];
  missing: string[];
  mistakes: string[];
  feedback: string;
};

export type SpokenStatus = 'idle' | 'checking' | 'error';

export type FillFeedback = 'idle' | 'wrong1' | 'wrong2' | 'revealed' | 'correct';

// One question's answer state on the all-questions page (see useQuiz).
export type QuestionAnswer = {
  mcqSelected: number | null;
  mcqAttempts: number;   // attempts on this MCQ
  showMcqHint: boolean;
  mcqDone: boolean;      // locked: answered right, or wrong twice
  fillInput: string;
  fillAttempts: number;
  fillFeedback: FillFeedback;
  fillValidating: boolean;
  explanation: string;
  loadingExplain: boolean;
  recorded: boolean;     // its result is saved: it counts as answered
  reasoning: string;     // student's reasoning ("why did you choose this?")
  reasoningListening: boolean; // voice input active state
  firstAnswer?: string;  // the first response, kept as separate evidence
};

export const emptyAnswer = (): QuestionAnswer => ({
  mcqSelected: null, mcqAttempts: 0, showMcqHint: false, mcqDone: false,
  fillInput: '', fillAttempts: 0, fillFeedback: 'idle', fillValidating: false,
  explanation: '', loadingExplain: false, recorded: false,
  reasoning: '', reasoningListening: false,
});
