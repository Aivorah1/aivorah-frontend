import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Platform } from 'react-native';
import ASSIGNMENTS_SERVER_URL from '../../../../../config/assignmentsServerUrl';
import LEARNING_PATHS_SERVER_URL from '../../../../../config/learningPathsServerUrl';
import LEADERBOARD_SERVICE_URL from '../../../../../config/leaderboardServiceUrl';
import { computeCappedQuizSeconds } from '../../../../../services/studyTime';
import { normalizeQuizQuestions, playSound, withSpokenQuestion, countWords, MIN_SPOKEN_WORDS } from '../utils';
import { emptyAnswer } from '../types';
import type { Question, QuestionAnswer, QuizPhase, SpokenStatus } from '../types';
import { saveQuizResult } from '../resultCache';

export function useQuiz(params: {
  topic: string; grade: string; subject: string; curriculum: string;
  passageText?: string; topicId?: string;
  // The topic's "What you'll learn" points: what the spoken answer is graded on.
  keyPoints?: string[];
  // Teacher-authored practice questions (Phase 2/4) — when present, skip
  // /ibpyp/quiz generation and use these directly.
  practiceQuiz?: any[];
  userEmail?: string; userRole?: string; studentId?: string;
  navigation: any;
  completeLesson: (topic: string, subject: string, grade: string, curriculum: string) => void;
  addXP: (xp: number) => void;
  recordStudySeconds: (seconds: number, source?: "assignment" | "challenge" | "learningPath" | "other", subject?: string) => void;
  // Optional so existing callers/tests keep working — see StudentDataContext.
  recordQuizResult?: (topic: string, score: number, subject?: string) => void;
}) {
  const { topic, grade, subject, curriculum, passageText, topicId, keyPoints, practiceQuiz, userEmail, userRole, studentId, navigation, completeLesson, recordStudySeconds, recordQuizResult } = params;

  // Opens on the Practice start page; a test starts with startTest().
  const [phase, setPhase] = useState<QuizPhase>('hub');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [score, setScore] = useState(0);

  // All questions are on one page, so each keeps its own answer state
  // (QuestionAnswer, by question index). The ref mirrors the state so
  // handlers always see the latest values, even before a re-render.
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const answersRef = useRef<QuestionAnswer[]>([]);
  const patchAnswer = useCallback((i: number, p: Partial<QuestionAnswer>) => {
    const next = answersRef.current.slice();
    next[i] = { ...(next[i] ?? emptyAnswer()), ...p };
    answersRef.current = next;
    setAnswers(next);
  }, []);
  const answerAt = (i: number) => answersRef.current[i] ?? emptyAnswer();

  // Spoken question (the last one): what the student said, and grading progress
  const [spokenText, setSpokenText] = useState('');
  const [spokenStatus, setSpokenStatus] = useState<SpokenStatus>('idle');
  const [spokenError, setSpokenError] = useState('');

  // Issue #121 — attempt tracking, time tracking, per-question results
  const [attemptNumber, setAttemptNumber] = useState(1);
  const perQuestionResultsRef = useRef<any[]>([]);
  const explanationsRef = useRef<Record<number, string>>({});
  const [initialStartTime] = useState(() => Date.now());
  const quizStartTimeRef = useRef(initialStartTime);
  // Questions can be answered in any order, so each answer's time is counted
  // from the previous answer (or the start of the test): the per-question
  // times add up to the time spent on the test.
  const lastAnswerAtRef = useRef(initialStartTime);

  // The saved topic_attempts row for the finished test (from track-attempt),
  // so the results screen can load Practise This Skill recommendations.
  const [savedAttemptId, setSavedAttemptId] = useState<string | null>(null);
  const [attemptSaveFailed, setAttemptSaveFailed] = useState(false);

  // Issue #106 — auto-loaded explanations in result screen
  const [resultExplanations, setResultExplanations] = useState<Record<number, string>>({});

  // Optional reasoning box per question ("Why did you choose this?") + voice input
  const [reasoningByIndex, setReasoningByIndex] = useState<Record<number, string>>({});
  const reasoningByIndexRef = useRef<Record<number, string>>({});
  const [listeningIndex, setListeningIndex] = useState<number | null>(null);
  // Speech recognition for the reasoning box's mic. Must live inside the hook:
  // a hook called at module level throws as soon as this file loads.
  const recognitionRef = useRef<any>(null);
  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch { /* already stopped */ } }, []);

  const patchReasoning = useCallback((i: number, text: string) => {
    const next = { ...reasoningByIndexRef.current, [i]: text };
    reasoningByIndexRef.current = next;
    setReasoningByIndex(next);
  }, []);

  const toggleReasoningVoice = useCallback((i: number) => {
    if (Platform.OS !== 'web') {
      Alert.alert('Not Supported', 'Voice input is only available in Chrome on web.');
      return;
    }
    if (listeningIndex === i) {
      // stop listening — handled by recognition.onend
      setListeningIndex(null);
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Alert.alert('Not Supported', 'Voice input is not supported in this browser. Try Chrome.');
      return;
    }
    // stop any current listening
    if (listeningIndex !== null) {
      recognitionRef.current?.stop();
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    // Keeps listening until the mic is tapped again; what is spoken is added
    // after what the student already typed (never replaces it).
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    const typed = (reasoningByIndexRef.current[i] || '').trim();
    const withTyped = (spoken: string) => [typed, spoken.trim()].filter(Boolean).join(' ');
    let finalTranscript = '';
    recognition.onstart = () => setListeningIndex(i);
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let idx = event.resultIndex; idx < event.results.length; idx++) {
        const transcript = event.results[idx][0].transcript;
        if (event.results[idx].isFinal) finalTranscript += transcript;
        else interim += transcript;
      }
      patchReasoning(i, withTyped(`${finalTranscript} ${interim}`));
    };
    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setListeningIndex(null);
      if (event.error === 'not-allowed') {
        Alert.alert('Microphone Access', 'Please allow microphone access in your browser settings.');
      }
    };
    recognition.onend = () => {
      setListeningIndex(null);
      patchReasoning(i, withTyped(finalTranscript));
    };
    recognition.start();
  }, [listeningIndex, patchReasoning]);

  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // Auto-fetch explanations for all wrong answers when results load
  useEffect(() => {
    if (phase !== 'result') return;
    perQuestionResultsRef.current.forEach((r, i) => {
      if (!r || r.isCorrect || r.type === 'spoken') return; // the spoken answer has its own feedback
      if (explanationsRef.current[i]) return; // already have it
      fetch(`${LEARNING_PATHS_SERVER_URL}/ibpyp/explain-wrong`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, subject, grade, question: r.question, wrongAnswer: r.studentAnswer, correctAnswer: r.correctAnswer }),
      })
        .then(res => res.json())
        .then(data => {
          const text = data.explanation || 'The correct answer is shown above.';
          explanationsRef.current[i] = text;
          setResultExplanations(prev => ({ ...prev, [i]: text }));
        })
        .catch(() => {
          setResultExplanations(prev => ({ ...prev, [i]: 'The correct answer is shown above.' }));
        });
    });
  }, [phase]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    if (phase !== 'quiz') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert('Leave Quiz?', 'Your progress will be lost.',
        [{ text: 'Stay', style: 'cancel' }, { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() }]);
      return true;
    });
    return () => handler.remove();
  }, [phase]);

  const fetchQuiz = useCallback(async (isRetake = false) => {
    setPhase('loading');
    setScore(0);
    answersRef.current = [];
    setAnswers([]);
    perQuestionResultsRef.current = [];
    explanationsRef.current = {};
    setResultExplanations({});
    reasoningByIndexRef.current = {};
    setReasoningByIndex({});
    setListeningIndex(null);
    recognitionRef.current?.stop();
    quizStartTimeRef.current = Date.now();
    lastAnswerAtRef.current = Date.now();
    if (isRetake) setAttemptNumber(n => n + 1);
    setSavedAttemptId(null); setAttemptSaveFailed(false);
    setSpokenText(''); setSpokenStatus('idle'); setSpokenError('');
    if (practiceQuiz?.length) {
      setQuestions(withSpokenQuestion(normalizeQuizQuestions(practiceQuiz), topic));
      setPhase('quiz');
      return;
    }
    try {
      const res = await fetch(`${LEARNING_PATHS_SERVER_URL}/ibpyp/quiz`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, grade, subject, curriculum, passageText, topicId, userEmail, role: userRole }),
      });
      const data = await res.json();
      if (!data.questions?.length) throw new Error('No questions');
      setQuestions(withSpokenQuestion(normalizeQuizQuestions(data.questions), topic));
      setPhase('quiz');
    } catch {
      Alert.alert('Error', 'Could not generate quiz. Please try again.');
      navigation.goBack();
    }
  }, [topic, grade, subject, curriculum, passageText, userEmail, practiceQuiz]);

  // Take a Test from the start page: a new test, numbered after the past ones.
  function startTest(nextAttemptNumber?: number) {
    if (nextAttemptNumber && nextAttemptNumber > 0) setAttemptNumber(nextAttemptNumber);
    fetchQuiz(false);
  }

  // Back to the start page (e.g. from the results to History).
  function backToHub() {
    setPhase('hub');
  }

  function finishQuiz(finalScore: number) {
    const pct = Math.round((finalScore / questions.length) * 100);
    const totalTimeSeconds = Math.round((Date.now() - quizStartTimeRef.current) / 1000);

    // Legacy analytics + persist reasoning to topic_attempts
    const reasoningSnapshot = reasoningByIndexRef.current;
    const perQuestionResultsWithReasoning = perQuestionResultsRef.current.map((r, i) => ({
      ...(r || {}),
      reasoning: reasoningSnapshot[i] || '',
    }));
    fetch(`${LEARNING_PATHS_SERVER_URL}/ibpyp/track-result`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail, role: userRole, topic, subject, grade, score: pct,
        totalQuestions: questions.length, correctAnswers: finalScore,
        firstAttemptCorrect: finalScore, attemptNumber, perQuestionAttempts: [],
        studentId,
        perQuestionResults: perQuestionResultsWithReasoning,
      }),
    }).catch(() => {});

    // Local copy of the result, so the dashboard shows it the moment the
    // student returns even if the fire-and-forget track-result write below
    // hasn't reached GET /performance yet.
    recordQuizResult?.(topic, pct, subject);

    // Issue #121 — detailed attempt tracking
    if (studentId) {
      fetch(`${LEADERBOARD_SERVICE_URL}/student/track-attempt`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          topic, subject, grade, curriculum,
          totalQuestions: questions.length,
          correctAnswers: finalScore,
          score: pct,
          timeSpentSeconds: totalTimeSeconds,
          // With the optional reasoning and each question's first answer,
          // tries and hint shown (Practise This Skill evidence).
          perQuestionResults: perQuestionResultsWithReasoning,
          attemptNumber,
        }),
      })
        .then((r: any) => (r?.ok ? r.json() : Promise.reject(new Error('track-attempt failed'))))
        .then((d: any) => { if (d?.attempt?.id) setSavedAttemptId(String(d.attempt.id)); else setAttemptSaveFailed(true); })
        .catch(() => setAttemptSaveFailed(true));
    } else if (__DEV__) {
      // B004: this should be unreachable once logged in (studentId resolves
      // before a quiz is reachable) — if it fires, tracking was silently
      // skipped, same failure mode as the original bug. Surface it instead
      // of swallowing it quietly.
      console.warn('[useQuiz] track-attempt skipped: no studentId resolved yet');
    }

    // Bug #22 ("XP inconsistent between pages"): this used to ALSO call
    // addXP(pct>=80?100:pct>=60?60:30) here — a separate, purely local-only
    // XP bump never sent to any server, on top of completeLesson()'s real,
    // server-persisted, idempotent flat-150 award. That meant: a first
    // pass showed 150+60/100 XP but only 150 was ever persisted (the extra
    // vanished on any refetch); a REPEAT pass of an already-done topic kept
    // adding local XP every single retry with no idempotency; and a failing
    // attempt (pct<60, completeLesson not even called) showed +30 XP that
    // was 100% fake. completeLesson() is now the only XP source for this
    // event, so what's shown always matches what a fresh page load shows.
    if (pct >= 60) completeLesson(topic, subject, grade, curriculum);

    // Quiz time is real learning time too — a student who skips straight to the
    // quiz (no lesson-reading session beforehand) was getting 0 study time
    // recorded even though they spent real minutes on it. Use the SUM of
    // per-question times (each capped), not raw quiz-start-to-now wall-clock
    // time — a question left open/backgrounded for hours must not leak that
    // idle gap into recorded study time.
    recordStudySeconds(computeCappedQuizSeconds(perQuestionResultsRef.current), 'learningPath', subject);

    // Sound effect based on score tier
    playSound(pct >= 80 ? 'gold' : pct >= 60 ? 'silver' : 'bronze');

    saveQuizResult(studentId, subject, topic, {
      questions, perQuestionResults: perQuestionResultsRef.current, score: finalScore,
      attemptNumber, timeSpentSeconds: totalTimeSeconds, explanations: explanationsRef.current,
    });

    setScore(finalScore);
    setPhase('result');
  }

  // Records a question's final result once (an answered question can't be
  // answered again) and updates the score.
  function recordResult(i: number, isCorrect: boolean, studentAnswer: string, extra: Record<string, any> = {}) {
    if (perQuestionResultsRef.current[i]) return;
    const q = questions[i];
    const now = Date.now();
    const correctAnswer = q.type === 'fill_blank'
      ? String(q.correct)
      : q.type === 'spoken' ? '' : q.options[q.correct as number];
    // By index, not push: each question is recorded exactly once.
    perQuestionResultsRef.current[i] = {
      question: q.question,
      studentAnswer,
      correctAnswer,
      isCorrect,
      timeSeconds: Math.round((now - lastAnswerAtRef.current) / 1000),
      ...extra,
    };
    lastAnswerAtRef.current = now;
    const newScore = perQuestionResultsRef.current.filter((r) => r?.isCorrect).length;
    scoreRef.current = newScore;
    setScore(newScore);
    patchAnswer(i, { recorded: true });
  }

  const answeredCount = answers.filter((a) => a?.recorded).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  // "See Results": only once every question has been answered.
  const finishingRef = useRef(false);
  useEffect(() => { if (phase !== 'quiz') finishingRef.current = false; }, [phase]);
  function finish() {
    if (phase !== 'quiz' || finishingRef.current) return;
    if (!questions.length || questions.some((_, i) => !perQuestionResultsRef.current[i])) return;
    finishingRef.current = true;
    finishQuiz(scoreRef.current);
  }

  // ── Spoken question ───────────────────────────────────────────
  // Grades what the student said against the topic's key points and records
  // it like any other answer (correct at 6/10 or more).
  async function submitSpoken() {
    const text = spokenText.trim();
    const i = questions.findIndex((q) => q.type === 'spoken');
    if (i < 0 || perQuestionResultsRef.current[i]) return;
    if (spokenStatus === 'checking' || countWords(text) < MIN_SPOKEN_WORDS) return;
    setSpokenStatus('checking'); setSpokenError('');
    try {
      const res = await fetch(`${LEARNING_PATHS_SERVER_URL}/ibpyp/evaluate-explanation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, subject, grade, curriculum, topicId, keyPoints, passageText, transcript: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data?.score !== 'number') {
        throw new Error(data?.error || 'Could not check your explanation. Check your connection and try again.');
      }
      setExplanationFor(i, data.feedback || '');
      recordResult(i, !!data.passed, text, { type: 'spoken', evaluation: data });
      setSpokenStatus('idle');
    } catch (e: any) {
      setSpokenStatus('error');
      setSpokenError(e?.message || 'Could not check your explanation. Please try again.');
    }
  }

  function setExplanationFor(i: number, text: string) {
    patchAnswer(i, { explanation: text });
    explanationsRef.current[i] = text;
    setResultExplanations(prev => ({ ...prev, [i]: text }));
  }

  async function fetchExplanation(i: number, q: Question, wrong: string, correct: string, wasCorrect: boolean) {
    if (wasCorrect) {
      setExplanationFor(i, q.explanation || 'Great job! That\'s correct!');
      return;
    }
    patchAnswer(i, { loadingExplain: true });
    try {
      const res = await fetch(`${LEARNING_PATHS_SERVER_URL}/ibpyp/explain-wrong`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, subject, grade, question: q.question, wrongAnswer: wrong, correctAnswer: correct }),
      });
      const data = await res.json();
      setExplanationFor(i, data.explanation || q.explanation || 'The correct answer is highlighted above.');
    } catch {
      setExplanationFor(i, q.explanation || 'The correct answer is highlighted above. Keep going!');
    } finally {
      patchAnswer(i, { loadingExplain: false });
    }
  }

  // ── MCQ handlers ────────────────────────────────────────────────
  // Same rules as before, now per question: correct → locked; 1st wrong →
  // retry with a hint; 2nd wrong → locked with the explanation.
  function handleMcqAnswer(i: number, optIdx: number) {
    const a = answerAt(i);
    if (a.mcqDone || a.mcqSelected !== null) return;
    const q = questions[i];
    const isCorrect = optIdx === (q.correct as number);
    const attempts = a.mcqAttempts + 1;
    patchAnswer(i, { mcqSelected: optIdx, mcqAttempts: attempts });

    // Evidence kept apart from the score: the first response, how many tries
    // it took, and whether the hint was shown (it shows after a wrong try).
    const evidence = { attempts, firstAnswer: a.firstAnswer ?? q.options[optIdx], hintShown: a.showMcqHint };
    if (attempts === 1) patchAnswer(i, { firstAnswer: q.options[optIdx] });

    if (isCorrect) {
      patchAnswer(i, { mcqDone: true });
      recordResult(i, true, q.options[optIdx], evidence);
      // fetch explanation for correct answer too
      fetchExplanation(i, q, q.options[optIdx], q.options[q.correct as number], true);
    } else if (attempts < 2) {
      // 1st wrong — allow retry with hint available
      setTimeout(() => {
        patchAnswer(i, { mcqSelected: null, showMcqHint: true }); // unlock for retry
      }, 900);
    } else {
      // 2nd wrong — lock and show explanation
      patchAnswer(i, { mcqDone: true });
      recordResult(i, false, q.options[optIdx], evidence);
      fetchExplanation(i, q, q.options[optIdx], q.options[q.correct as number], false);
    }
  }

  // ── Fill-blank handlers ─────────────────────────────────────────
  function setFillInput(i: number, text: string) {
    patchAnswer(i, { fillInput: text });
  }

  async function handleFillSubmit(i: number) {
    const a = answerAt(i);
    const input = a.fillInput.trim();
    if (!input || a.fillValidating || a.fillFeedback === 'correct' || a.fillFeedback === 'revealed') return;
    const q = questions[i];
    patchAnswer(i, { fillValidating: true });
    try {
      const resp = await fetch(`${ASSIGNMENTS_SERVER_URL}/assignments/validate-fill-blank`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentAnswer: input, correctAnswer: q.correct, question: q.question }),
      });
      const { correct } = await resp.json();
      const tries = a.fillAttempts + 1;
      // Evidence kept apart from the score: first response, tries, and whether
      // the hint was shown (it shows after the second wrong try).
      const evidence = { attempts: tries, firstAnswer: a.firstAnswer ?? input, hintShown: a.fillAttempts >= 2 };
      if (tries === 1) patchAnswer(i, { firstAnswer: input });
      if (correct) {
        patchAnswer(i, { fillFeedback: 'correct' });
        setExplanationFor(i, q.explanation || 'Excellent! That\'s correct!');
        recordResult(i, true, input, evidence);
      } else {
        const attempts = answerAt(i).fillAttempts + 1;
        if (attempts === 1) patchAnswer(i, { fillAttempts: attempts, fillFeedback: 'wrong1' });
        else if (attempts === 2) patchAnswer(i, { fillAttempts: attempts, fillFeedback: 'wrong2' });
        else {
          patchAnswer(i, { fillAttempts: attempts, fillFeedback: 'revealed' });
          setExplanationFor(i, q.explanation || '');
          recordResult(i, false, input, evidence);
        }
      }
    } catch {
      patchAnswer(i, { fillFeedback: 'correct' }); // network error — give benefit of doubt
      setExplanationFor(i, q.explanation || '');
      recordResult(i, true, input);
    } finally {
      patchAnswer(i, { fillValidating: false });
    }
  }

  return {
    phase, questions, score,
    answers, answeredCount, allAnswered,
    attemptNumber, perQuestionResultsRef, explanationsRef, quizStartTimeRef,
    resultExplanations,
    fetchQuiz, startTest, backToHub, finish, handleMcqAnswer, setFillInput, handleFillSubmit,
    spokenText, setSpokenText, spokenStatus, spokenError, submitSpoken,
    reasoningByIndex, setReasoning: patchReasoning, toggleReasoningVoice, listeningIndex,
    savedAttemptId, attemptSaveFailed,
  };
}
