import { useCallback, useEffect, useRef, useState } from 'react';
import { followupApi, FollowupApiError } from '../services/practiceFollowupApi';
import type { ResultView, SessionView } from '../types';

// Drives one Practise This Skill session in Ask Aivorah. The server is the
// source of truth: every action returns the saved session, and on any failure
// (timeout, failed save, invalid AI output) the last saved state is reloaded
// and a retry message shown — a result is only shown after it was saved.
export function useSkillPractice(followupId: string | null | undefined, lessonText?: string) {
  const [session, setSession] = useState<SessionView | null>(null);
  const [loading, setLoading] = useState(!!followupId);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<null | 'answer' | 'clarify' | 'hint' | 'solution' | 'explain'>(null);
  const [actionError, setActionError] = useState('');
  const [result, setResult] = useState<ResultView | null>(null);
  const [solution, setSolution] = useState<{ text: string; correctAnswer: string } | null>(null);
  const [reply, setReply] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    if (!followupId) return;
    setLoading(true); setLoadError('');
    try {
      const s = await followupApi.open(followupId, lessonText);
      setSession(s);
      setHint(s.question?.hint ?? null);
    } catch (e: any) {
      setLoadError(e?.message || 'Could not open this practice.');
    } finally {
      setLoading(false);
    }
    // lessonText only grounds the first build; changing it must not reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followupId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- load the saved session when it changes
  useEffect(() => { setResult(null); setSolution(null); setReply(''); load(); }, [load]);

  // One action at a time (no double submit); restore saved state on failure.
  const run = useCallback(async <T,>(kind: NonNullable<typeof busy>, fn: () => Promise<T>): Promise<T | null> => {
    if (busyRef.current || !followupId) return null;
    busyRef.current = true; setBusy(kind); setActionError('');
    try {
      return await fn();
    } catch (e: any) {
      const err = e as FollowupApiError;
      setActionError(err?.message || 'Something went wrong. Please try again.');
      // Stale question / failed save: show what is actually saved.
      if (!err?.status || err.status >= 409) {
        try { const s = await followupApi.session(followupId); setSession(s); setHint(s.question?.hint ?? null); } catch { /* keep the current view */ }
      }
      return null;
    } finally {
      busyRef.current = false; setBusy(null);
    }
  }, [followupId]);

  const submitAnswer = useCallback((answer: number | string, reasoning: string) => run('answer', async () => {
    const qid = session?.question?.id;
    if (!qid) return false;
    const r = await followupApi.answer(followupId!, qid, answer, reasoning);
    setResult(r.result); setSession(r.session); setSolution(null); setHint(r.session.question?.hint ?? null);
    return true;
  }), [run, session, followupId]);

  const submitClarification = useCallback((reasoning: string) => run('clarify', async () => {
    const qid = session?.clarification?.questionId;
    if (!qid) return false;
    const r = await followupApi.clarify(followupId!, qid, reasoning);
    setResult(r.result); setSession(r.session); setHint(r.session.question?.hint ?? null);
    return true;
  }), [run, session, followupId]);

  const showHint = useCallback(() => run('hint', async () => {
    const qid = session?.question?.id;
    if (!qid) return false;
    const r = await followupApi.hint(followupId!, qid);
    setHint(r.hint);
    setSession((s) => (s && s.question ? { ...s, question: { ...s.question, helpShown: 'hint', hint: r.hint } } : s));
    return true;
  }), [run, session, followupId]);

  const showSolution = useCallback(() => run('solution', async () => {
    const qid = session?.question?.id;
    if (!qid) return false;
    const r = await followupApi.solution(followupId!, qid);
    setSolution({ text: r.solution, correctAnswer: r.correctAnswer });
    setResult(null); setSession(r.session); setHint(r.session.question?.hint ?? null);
    return true;
  }), [run, session, followupId]);

  const explainAnotherWay = useCallback((message?: string) => run('explain', async () => {
    const r = await followupApi.explainAnotherWay(followupId!, message);
    if (!r.understood) { setReply(r.reply || ''); return false; }
    setReply(r.repeated ? "You've seen every way I have — here's the first one again." : '');
    if (r.session) setSession(r.session);
    return true;
  }), [run, followupId]);

  return {
    session, loading, loadError, reload: load, busy, actionError, result, solution, hint, reply,
    submitAnswer, submitClarification, showHint, showSolution, explainAnotherWay,
    dismissSolution: () => setSolution(null),
  };
}
