// Calls the Current Affairs admin API (/current-affairs/admin/*). Only the
// Aivorah team's accounts are allowed; the service checks the sign-in.
import CURRENT_AFFAIRS_SERVER_URL from '../../../../config/currentAffairsServerUrl';
import { authHeader } from '../../../../services/authHeader';
import type { BulkResult, CaAnalytics, ContentStatus, HistoryEntry, QuizQuestion, QuizWeek, Story, StorySummary } from '../types';

const BASE = `${CURRENT_AFFAIRS_SERVER_URL}/current-affairs/admin`;

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}, fallbackError = 'Something went wrong. Please try again.'): Promise<T> {
  const headers: Record<string, string> = { ...(await authHeader()) };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}`, {
    method: init.method || 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || fallbackError);
  return data as T;
}

const qs = (params: Record<string, string | undefined>) => {
  const parts = Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

export const listStories = (status?: ContentStatus) =>
  call<{ stories: StorySummary[] }>(`/stories${qs({ status })}`, {}, 'Could not load stories').then((d) => d.stories);

export const getStory = (id: string) => call<{ story: Story }>(`/stories/${id}`, {}, 'Could not load the story').then((d) => d.story);

export const createStory = (fields: Partial<Story> & { publish?: boolean }) =>
  call<{ story: Story }>('/stories', { method: 'POST', body: fields }, 'Could not save the story').then((d) => d.story);

export const updateStory = (id: string, fields: Partial<Story>) =>
  call<{ story: Story }>(`/stories/${id}`, { method: 'PATCH', body: fields }, 'Could not save the story').then((d) => d.story);

// Optimistic-concurrency variant: sends updated_at so the service rejects with
// HTTP 409 if the story changed since it was loaded. Callers can catch the
// error and prompt the editor to reload.
export const updateStoryOptimistic = (id: string, fields: Partial<Story> & { updated_at?: string }) =>
  call<{ story: Story }>(`/stories/${id}`, { method: 'PATCH', body: fields }, 'Could not save the story').then((d) => d.story);

/**
 * Asks the AI to rewrite a story (both age versions) from its source page,
 * with an optional instruction. The result is saved for review, never published.
 * Can take up to a minute.
 */
export const regenerateStory = (id: string, request?: string) =>
  call<{ story: Story }>(`/stories/${id}/regenerate`, { method: 'POST', body: { request: request || '' } }, 'Could not rewrite the story')
    .then((d) => d.story);

/** A story's approval history, newest first. available is false until the history table exists. */
export const getStoryHistory = (id: string) =>
  call<{ available: boolean; entries: HistoryEntry[] }>(`/stories/${id}/history`, {}, 'Could not load the history');

const BULK_SIZE = 20; // the service takes up to 20 stories per call
/**
 * Approves (or rejects) many stories at once, e.g. a whole day's digest.
 * publishDate: 'today', 'tomorrow' or YYYY-MM-DD; without it each story keeps its own date.
 */
export async function bulkStoryStatus(ids: string[], status: 'published' | 'rejected' | 'draft', publishDate?: string): Promise<BulkResult[]> {
  const results: BulkResult[] = [];
  for (let i = 0; i < ids.length; i += BULK_SIZE) {
    const d = await call<{ updated: number; results: BulkResult[] }>('/stories/bulk-status', {
      method: 'POST', body: { ids: ids.slice(i, i + BULK_SIZE), status, ...(publishDate ? { publishDate } : {}) },
    }, 'Could not change the stories');
    results.push(...d.results);
  }
  return results;
}

export const setStoryStatus = (id: string, status: ContentStatus) =>
  call<{ story: Story }>(`/stories/${id}/status`, { method: 'POST', body: { status } }, 'Could not change the story').then((d) => d.story);

export const listQuizWeeks = () => call<{ currentWeek: string; weeks: QuizWeek[] }>('/quiz/weeks', {}, 'Could not load quiz weeks');

export const getQuiz = (weekStart: string, ageGroup: string) =>
  call<{ questions: QuizQuestion[] }>(`/quiz${qs({ weekStart, ageGroup })}`, {}, 'Could not load the quiz').then((d) => d.questions);

export const updateQuestion = (id: string, fields: Partial<QuizQuestion>) =>
  call<{ question: QuizQuestion }>(`/quiz/${id}`, { method: 'PATCH', body: fields }, 'Could not save the question').then((d) => d.question);

export const addQuestion = (fields: Partial<QuizQuestion>) =>
  call<{ question: QuizQuestion }>('/quiz', { method: 'POST', body: fields }, 'Could not add the question').then((d) => d.question);

export const setQuestionStatus = (id: string, status: ContentStatus) =>
  call<{ question: QuizQuestion }>(`/quiz/${id}/status`, { method: 'POST', body: { status } }, 'Could not change the question').then((d) => d.question);

export const publishQuiz = (weekStart: string, ageGroup: string) =>
  call<{ published: number }>('/quiz/publish', { method: 'POST', body: { weekStart, ageGroup } }, 'Could not publish the quiz');

export const getAnalytics = (from: string, to: string, ageGroup: string) =>
  call<CaAnalytics>(`/analytics${qs({ from, to, ageGroup })}`, {}, 'Could not load the insights');
