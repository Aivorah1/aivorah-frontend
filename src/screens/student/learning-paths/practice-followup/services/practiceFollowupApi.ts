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
  parentChild: (childId: string) =>
    call<{ childId: string; hasAssessments: boolean; followups: ParentFollowup[] }>(`/parent/children/${encodeURIComponent(childId)}`),
  teacherSupport: () => call<{ students: { studentId: string; topicHelp: TopicHelp[] }[] }>('/teacher/support'),
  teacherSkill: (studentId: string, skillId: string) => call<TeacherSkillView>(`/teacher/students/${encodeURIComponent(studentId)}/skills/${encodeURIComponent(skillId)}`),
};

export type { Teaching };

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
