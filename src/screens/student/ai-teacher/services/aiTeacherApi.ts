// AI Teacher — aivorah-learning-paths-service /ai-teacher (signed-in student).
import LEARNING_PATHS_SERVER_URL from '../../../../config/learningPathsServerUrl';
import { authHeader } from '../../../../services/authHeader';

export type BoardBlock =
  | { id: string; type: 'heading' | 'text' | 'note' | 'label'; text: string }
  | { id: string; type: 'steps'; items: string[] }
  | { id: string; type: 'equation'; lines: string[]; highlightLast?: boolean }
  | { id: string; type: 'image'; url: string; caption?: string }
  | { id: string; type: 'feedback'; text: string; correct: boolean };

export interface Segment { id: string; caption: string; speech: string; reveal: string[] }

export interface Practice { id: string; prompt: string; answerFormat: 'number' | 'text'; durationSeconds: number | null; released?: boolean }

export interface TeacherTopic { key: string | null; title: string; subject: string; grade: number | null; source: string | null; grounded: boolean }

export interface TurnResponse {
  kind: 'lesson' | 'example' | 'practice' | 'feedback' | 'solution' | 'clarify' | 'redirect' | 'safety' | 'smalltalk' | 'unclear' | 'info' | 'error' | 'repeat';
  language: 'en' | 'hi';
  board: 'replace' | 'keep';
  topic: TeacherTopic | null;
  segments: Segment[];
  blocks: BoardBlock[];
  practice: Practice | null;
  feedback: { correct: boolean | null; expected?: string; given?: string; message: string; revealed?: boolean } | null;
  state: Record<string, any>;
}

const BASE = `${LEARNING_PATHS_SERVER_URL}/ai-teacher`;

async function call<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: init.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    signal: init.signal,
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'AI Teacher is not available right now.');
  return data as T;
}

export const aiTeacherApi = {
  me: () => call<{ firstName: string; grade: string | null; curriculum: string | null }>('/me'),
  turn: (transcript: string, state: Record<string, any>, signal?: AbortSignal) =>
    call<TurnResponse>('/turn', { method: 'POST', body: { transcript, state }, signal }),
};
