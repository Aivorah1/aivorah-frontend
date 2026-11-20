import { useCallback, useEffect, useRef, useState } from 'react';
import { followupApi, FollowupApiError } from '../services/practiceFollowupApi';
import type { ExplainView, PracticeView, WrongQuestionRef } from '../services/practiceFollowupApi';
import type { ResultView } from '../types';

export type CoachMode = 'explain' | 'practice';

// What a typed chat message asks for. Messages are only matched here; they
// are never sent to the model as instructions.
export function coachIntent(text: string, mode: CoachMode): 'again' | 'another_way' | 'practice' | 'next_question' | 'next_wrong' | 'explain' | null {
  const t = String(text || '').toLowerCase();
  if (/next wrong|next question i got wrong|\bother wrong question|\bthe other question/.test(t)) return 'next_wrong';
  if (/another question|new question|one more|more questions?|next one|give me (a )?(different|new)|skip/.test(t)) return mode === 'practice' ? 'next_question' : 'practice';
  if (/practi[cs]e|test me|quiz me|give me a question|ask me/.test(t)) return mode === 'practice' ? 'next_question' : 'practice';
  if (/another way|different way|don'?t (understand|get it|like)|didn'?t (understand|get)|confus|not clear|makes no sense|explain (it )?differently/.test(t)) return 'another_way';
  if (/again|repeat|once more|say that again|simpler/.test(t)) return 'again';
  if (/explain|why|how does|teach me/.test(t)) return 'explain';
  return null;
}

// Drives Ask Aivorah for one wrong question of one test, in either mode.
// The server is the source of truth: every action returns saved state, and
// on any failure the last saved state stays on screen with a retry.
export function useQuestionCoach(params: { attemptId: string; questionIndex: number; mode: CoachMode; lessonText?: string }) {
  const { attemptId, lessonText } = params;
  const [mode, setMode] = useState<CoachMode>(params.mode);
  const [index, setIndex] = useState(params.questionIndex);
  const [explain, setExplain] = useState<ExplainView | null>(null);
  const [practice, setPractice] = useState<PracticeView | null>(null);
  const [wrong, setWrong] = useState<WrongQuestionRef[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [lastAction, setLastAction] = useState<null | (() => Promise<unknown>)>(null);
  const [result, setResult] = useState<ResultView | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [workingFeedback, setWorkingFeedback] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const busyRef = useRef(false);

  const run = useCallback(async (kind: string, fn: () => Promise<void>) => {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(kind); setError(''); setReply('');
    try {
      await fn();
      setLastAction(null);
      return true;
    } catch (e: any) {
      const err = e as FollowupApiError;
      setError(err?.message || 'Something went wrong. Please try again.');
      setLastAction(() => fn);
      return false;
    } finally {
      busyRef.current = false; setBusy(null);
    }
  }, []);

  const doExplain = useCallback((i: number, action: 'first' | 'again' | 'another_way') => run(`explain:${action}`, async () => {
    const v = await followupApi.explainQuestion(attemptId, i, action, lessonText);
    setExplain(v); setWrong(v.wrongQuestions); setIndex(i); setMode('explain');
    setResult(null); setSolution(null); setWorkingFeedback(null);
    if (v.repeated) setReply("You've seen every way I have — here is one of them again, said differently.");
  }), [attemptId, lessonText, run]);

  const doPractise = useCallback((i: number, action: 'start' | 'next') => run(`practice:${action}`, async () => {
    const v = await followupApi.practiseQuestion(attemptId, i, action, lessonText);
    setPractice(v); setWrong(v.wrongQuestions); setIndex(i); setMode('practice');
    setResult(null); setSolution(null); setWorkingFeedback(null); setHint(v.question?.hint ?? null);
  }), [attemptId, lessonText, run]);

  // Open in the requested mode on the question the student clicked.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new request resets the coach
    setExplain(null); setPractice(null); setMode(params.mode); setIndex(params.questionIndex);
    if (params.mode === 'explain') doExplain(params.questionIndex, 'first');
    else doPractise(params.questionIndex, 'start');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, params.questionIndex, params.mode]);

  const nextWrongIndex = (() => {
    if (wrong.length < 2) return null;
    const at = wrong.findIndex((w) => w.index === index);
    return wrong[(at + 1) % wrong.length].index;
  })();

  const fid = practice?.followupId;
  const qid = practice?.question?.id;
  const clarQid = practice?.clarification?.questionId;
  const resultQid = result?.questionId;

  const submitAnswer = useCallback((answer: number | string, reasoning: string) => run('answer', async () => {
    if (!fid || !qid) return;
    const r = await followupApi.answer(fid, qid, answer, reasoning);
    setResult(r.result);
    // The question is finished; the student asks for the next one.
    setPractice((p) => (p ? { ...p, question: null, clarification: (r.session.clarification as PracticeView['clarification']) ?? null } : p));
    setHint(null);
  }), [fid, qid, run]);

  const submitClarification = useCallback((reasoning: string) => run('clarify', async () => {
    if (!fid || !clarQid) return;
    const r = await followupApi.clarify(fid, clarQid, reasoning);
    setResult(r.result);
    setPractice((p) => (p ? { ...p, clarification: null } : p));
  }), [fid, clarQid, run]);

  const showHint = useCallback(() => run('hint', async () => {
    if (!fid || !qid) return;
    const r = await followupApi.hint(fid, qid);
    setHint(r.hint);
  }), [fid, qid, run]);

  const showSolution = useCallback(() => run('solution', async () => {
    if (!fid || !qid) return;
    const r = await followupApi.solution(fid, qid);
    setSolution(r.solution);
    setPractice((p) => (p ? { ...p, question: null } : p));
  }), [fid, qid, run]);

  const sendWorking = useCallback((working: string) => run('working', async () => {
    if (!fid || !resultQid) return;
    const r = await followupApi.working(fid, resultQid, working);
    setWorkingFeedback(r.feedback);
  }), [fid, resultQid, run]);

  // A typed message, matched to one of the actions above.
  const sendMessage = useCallback(async (text: string) => {
    const intent = coachIntent(text, mode);
    if (intent === 'again') return doExplain(index, explain ? 'again' : 'first');
    if (intent === 'another_way') return doExplain(index, explain ? 'another_way' : 'first');
    if (intent === 'explain') return doExplain(index, 'first');
    if (intent === 'practice') return doPractise(index, 'start');
    if (intent === 'next_question') return doPractise(index, 'next');
    if (intent === 'next_wrong' && nextWrongIndex != null) return mode === 'explain' ? doExplain(nextWrongIndex, 'first') : doPractise(nextWrongIndex, 'start');
    setReply(mode === 'explain'
      ? 'I can explain it again, explain it another way, give you a practice question, or move to your next wrong question.'
      : 'I can give you another question, explain this question, or move to your next wrong question.');
    return false;
  }, [mode, index, explain, nextWrongIndex, doExplain, doPractise]);

  return {
    mode, index, explain, practice, wrong, nextWrongIndex, busy, error, reply, result, solution, hint, workingFeedback,
    retry: () => (lastAction ? run('retry', lastAction as () => Promise<void>) : Promise.resolve(false)),
    explainAgain: () => doExplain(index, 'again'),
    explainAnotherWay: () => doExplain(index, 'another_way'),
    explainThis: () => doExplain(index, 'first'),
    practiceQuestion: () => doPractise(index, mode === 'practice' && (practice?.question || result || solution) ? 'next' : 'start'),
    nextQuestion: () => doPractise(index, 'next'),
    nextWrong: () => (nextWrongIndex == null ? Promise.resolve(false) : mode === 'explain' ? doExplain(nextWrongIndex, 'first') : doPractise(nextWrongIndex, 'start')),
    submitAnswer, submitClarification, showHint, showSolution, sendWorking, sendMessage,
  };
}
