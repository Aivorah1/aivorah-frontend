// Calls aivorah-learning-paths-service /practice-followup with the signed-in
// user's Firebase token. The server checks who may see what.
import LEARNING_PATHS_SERVER_URL from '../../../../../config/learningPathsServerUrl';
import { authHeader } from '../../../../../services/authHeader';
import type { PracticeDetails, Recommendation, ResultView, SessionView, Teaching } from '../types';

export class FollowupApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const BASE = `${LEARNING_PATHS_SERVER_URL}/practice-followup`;
const NETWORK_MESSAGE = "Couldn't reach Aivorah. Check your connection and try again.";

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init?.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    });
  } catch {
    throw new FollowupApiError(NETWORK_MESSAGE, 0, 'network');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new FollowupApiError(data?.error || 'Something went wrong. Please try again.', res.status, data?.code);
  return data as T;
}

export const followupApi = {
  recommendations: (attemptId: string, topicId?: string) =>
    call<{ attemptId: string; originalScore: number; recommendations: Recommendation[]; unmappedQuestions: number }>(
      `/attempts/${encodeURIComponent(attemptId)}${topicId ? `?topicId=${encodeURIComponent(topicId)}` : ''}`),
  session: (id: string) => call<SessionView>(`/${encodeURIComponent(id)}`),
  // Opens (and, for a topic skill, builds once from this lesson text) the session.
  open: (id: string, lessonText?: string) => call<SessionView>(`/${encodeURIComponent(id)}/open`, { method: 'POST', body: { lessonText: lessonText || '' } }),
  // The follow-up Ask Aivorah should show for a topic (from the newest test on it).
  forTopic: (topic: string, subject?: string, topicId?: string) =>
    call<{ followupId: string | null; attemptId: string | null; completed?: boolean; hasTest?: boolean }>(
      `/for-topic?${new URLSearchParams({ topic, ...(subject ? { subject } : {}), ...(topicId ? { topicId } : {}) }).toString()}`),
  explainAnotherWay: (id: string, message?: string) =>
    call<{ understood: boolean; reply?: string; repeated?: boolean; session?: SessionView }>(`/${encodeURIComponent(id)}/explain-another-way`, { method: 'POST', body: { message } }),
  hint: (id: string, questionId: string) => call<{ questionId: string; hint: string }>(`/${encodeURIComponent(id)}/hint`, { method: 'POST', body: { questionId } }),
  solution: (id: string, questionId: string) =>
    call<{ solution: string; correctAnswer: string; message: string; session: SessionView }>(`/${encodeURIComponent(id)}/solution`, { method: 'POST', body: { questionId } }),
  answer: (id: string, questionId: string, answer: number | string, reasoning: string) =>
    call<{ result: ResultView; session: SessionView; duplicate?: boolean }>(`/${encodeURIComponent(id)}/answer`, { method: 'POST', body: { questionId, answer, reasoning } }),
  clarify: (id: string, questionId: string, reasoning: string) =>
    call<{ result: ResultView; session: SessionView; duplicate?: boolean }>(`/${encodeURIComponent(id)}/clarify`, { method: 'POST', body: { questionId, reasoning } }),
  details: (id: string) => call<PracticeDetails>(`/${encodeURIComponent(id)}/details`),
  // ── Explain This Question / Practise This Skill (one wrong question of one test) ──
  explainQuestion: (attemptId: string, index: number, action: 'first' | 'again' | 'another_way', lessonText?: string) =>
    call<ExplainView>(`/attempts/${encodeURIComponent(attemptId)}/questions/${index}/explain`, { method: 'POST', body: { action, lessonText: lessonText || '' } }),
  practiseQuestion: (attemptId: string, index: number, action: 'start' | 'next', lessonText?: string) =>
    call<PracticeView>(`/attempts/${encodeURIComponent(attemptId)}/questions/${index}/practice`, { method: 'POST', body: { action, lessonText: lessonText || '' } }),
  workedOn: (attemptId: string) => call<{ attemptId: string; questions: WorkedOn[] }>(`/attempts/${encodeURIComponent(attemptId)}/worked-on`),
  working: (id: string, questionId: string, working: string) =>
    call<{ identified: boolean; step?: string; feedback: string }>(`/${encodeURIComponent(id)}/working`, { method: 'POST', body: { questionId, working } }),
  learningReport: (studentId: string) => call<LearningReport>(`/report/students/${encodeURIComponent(studentId)}`),
  parentChild: (childId: string) =>
    call<{ childId: string; hasAssessments: boolean; followups: ParentFollowup[] }>(`/parent/children/${encodeURIComponent(childId)}`),
  teacherSupport: () => call<{ students: { studentId: string; topicHelp: TopicHelp[] }[] }>('/teacher/support'),
  teacherSkill: (studentId: string, skillId: string) => call<TeacherSkillView>(`/teacher/students/${encodeURIComponent(studentId)}/skills/${encodeURIComponent(skillId)}`),
};

export type { Teaching };

export interface WrongQuestionRef { index: number; question: string }

export interface ExplainView {
  mode: 'explain';
  attemptId: string;
  questionIndex: number;
  followupId: string;
  question: { index: number; text: string; yourAnswer: string; correctAnswer: string };
  explanation: { title: string; body: string; example?: string | null; steps?: string[] | null; table?: string[][] | null; methodName?: string; method: string; variant: string; at: string };
  skillLabel: string | null;
  methodsUsed: string[];
  repeated: boolean;
  wrongQuestions: WrongQuestionRef[];
}

export interface PracticeView {
  mode: 'practice';
  attemptId: string;
  questionIndex: number;
  followupId: string;
  skillLabel: string | null;
  question: (PublicQuestionLite & { level: number; levelName: string; isMemoryCheck: boolean; helpShown: 'none' | 'hint' | 'solution'; hint: string | null }) | null;
  clarification: { questionId: string; question: PublicQuestionLite; yourAnswer: string; prompt: string } | null;
  memoryCheck: { daysSince: number | null } | null;
  wrongQuestions: WrongQuestionRef[];
}

export interface PublicQuestionLite { id: string; type: 'mcq' | 'fill_blank'; question: string; options?: string[]; reasoningPrompt: string }

export interface WorkedOn {
  index: number;
  question: string;
  skillLabel: string | null;
  lines: string[];
  hasActivity: boolean;
  practice: { total: number; independent: number; assisted: number; incorrect: number; skipped: number; awaiting_verification: number; solution_shown: number };
  recurringMistakes: { step: string; questions: number }[];
  memoryChecks: { at: string; level: number | null; outcome: string; helpUsed: string }[];
}

export interface LearningReportTest {
  attemptId: string;
  subject: string;
  topic: string;
  takenAt: string;
  score: number | null;
  correct: number | null;
  total: number | null;
  skillsReviewed: string[];
  explanationsShown: number;
  practice: { total: number; independent: number; assisted: number; incorrect: number; skipped: number; awaiting_verification: number; solution_shown: number };
  recurringMistakes: { step: string; questions: number }[];
  memoryChecks: { at: string; level: number | null; outcome: string; helpUsed: string }[];
  hasFollowUp: boolean;
}

export interface LearningReport {
  student: { id: string; name?: string; grade?: string; curriculum?: string };
  generatedAt: string;
  tests: LearningReportTest[];
}

export interface ParentFollowup {
  followupId: string;
  topic: string;
  subject: string;
  skill: string;
  skillLabel: string;
  originalScore: number | null;
  status: 'available' | 'in_progress' | 'completed';
  outcome: string;
  outcomeLabel: string;
  updatedAt: string;
}

export interface TopicHelp {
  skillId: string;
  label: string;
  shortName: string;
  nextPractice: string | null;
  topic: string | null;
  subject: string | null;
  evidenceCount: number;
  lastEvidenceAt: string;
}

export interface TeacherSkillView {
  studentId: string;
  skill: { id: string; label: string; shortName: string; subject: string };
  needsTopicHelp: boolean;
  flag: TopicHelp | null;
  practiseNext: string;
  recentAttempts: { attemptId: string; topic: string; subject: string; score: number | null; takenAt: string; questions: { question: string; kind: string }[]; followupStatus: string; followupOutcome: string }[];
}
