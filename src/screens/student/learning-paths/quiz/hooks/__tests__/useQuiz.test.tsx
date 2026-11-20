import React from 'react';
import { clearQuizResults } from '../../resultCache';
import { Text, TouchableOpacity } from 'react-native';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import { useQuiz } from '../useQuiz';

jest.setTimeout(15000);

function jsonRes(data: any, ok = true) {
  return Promise.resolve({ ok, json: async () => data });
}

// Q1's answer is B (index 1), Q2's is A (index 0); every test then ends with
// the spoken question, so the default test has 3 questions.
const mcqQuestions = [
  { type: 'mcq', question: 'Q1', options: ['A', 'B', 'C', 'D'], correct: 1, hint: 'h1', explanation: 'e1' },
  { type: 'mcq', question: 'Q2', options: ['A', 'B', 'C', 'D'], correct: 0, hint: 'h2', explanation: 'e2' },
];

// POST /ibpyp/evaluate-explanation for the spoken last question
const GOOD_EVAL = { score: 8, outOf: 10, passed: true, verdict: 'excellent', covered: ['the main idea'], missing: [], mistakes: [], feedback: 'Well explained!' };
const LOW_EVAL = { ...GOOD_EVAL, score: 3, passed: false, verdict: 'partial', feedback: 'Add the main idea next time.' };
const SPOKEN = 'Tenali Rama used his clever wit to make the king and queen friends again';

const fillQuestion = [
  { type: 'fill_blank', question: 'The cat sat on the ___', correct: 'mat', hint: 'h', explanation: 'e' },
];

function mockFetchRoutes(overrides: Record<string, any> = {}) {
  global.fetch = jest.fn((url: string, opts?: any) => {
    if (url.includes('/ibpyp/quiz')) return jsonRes(overrides.quiz ?? { questions: mcqQuestions });
    if (url.includes('/assignments/validate-fill-blank')) {
      const body = JSON.parse(opts.body);
      if (overrides.fillValidate) return overrides.fillValidate(body);
      return jsonRes({ correct: body.studentAnswer === 'mat' });
    }
    if (url.includes('/ibpyp/explain-wrong')) return jsonRes({ explanation: 'explained' });
    if (url.includes('/ibpyp/evaluate-explanation')) {
      if (overrides.evaluate) return overrides.evaluate(JSON.parse(opts.body));
      return jsonRes(GOOD_EVAL);
    }
    if (url.includes('/ibpyp/track-result')) return jsonRes({});
    if (url.includes('/student/track-attempt')) return jsonRes({});
    return jsonRes({});
  }) as any;
}

function Harness({ studentId, practiceQuiz, keyPoints, autoStart = true }: { studentId?: string; practiceQuiz?: any[]; keyPoints?: string[]; autoStart?: boolean } = {}) {
  const completeLesson = React.useMemo(() => jest.fn(), []);
  const addXP = React.useMemo(() => jest.fn(), []);
  const recordStudySeconds = React.useMemo(() => jest.fn(), []);
  const recordQuizResult = React.useMemo(() => jest.fn(), []);
  const navigation = React.useMemo(() => ({ goBack: jest.fn(), navigate: jest.fn() }), []);
  React.useEffect(() => {
    (globalThis as any).__lastMocks = { completeLesson, addXP, recordStudySeconds, recordQuizResult, navigation };
  }, [completeLesson, addXP, recordStudySeconds, recordQuizResult, navigation]);

  const h = useQuiz({
    topic: 'Topic', grade: 'Grade 6', subject: 'English', curriculum: 'CBSE',
    // Default here matches the REAL StudentDataContext.studentId shape (a
    // resolved id string) — distinct from AuthContext's user.id, which the
    // real app never populates (B004's root cause). studentId is explicitly
    // undefined-able per-test to cover that missing case.
    userEmail: 'a@a.com', userRole: 'student', studentId, practiceQuiz, keyPoints,
    navigation,
    completeLesson,
    addXP,
    recordStudySeconds,
    recordQuizResult,
  });

  // The screen starts a test from the Practice start page ("Take a Test").
  const started = React.useRef(false);
  React.useEffect(() => {
    if (autoStart && !started.current && h.phase === 'hub') { started.current = true; h.startTest(); }
  });

  const a0 = h.answers[0];
  return (
    <>
      <Text testID="phase">{h.phase}</Text>
      <Text testID="score">{h.score}</Text>
      <Text testID="answered">{h.answeredCount}</Text>
      <Text testID="allAnswered">{String(h.allAnswered)}</Text>
      <Text testID="answers">{JSON.stringify(h.answers)}</Text>
      {/* question 1's state, for the single-question tests */}
      <Text testID="mcqSelected">{String(a0?.mcqSelected ?? null)}</Text>
      <Text testID="mcqDone">{String(!!a0?.mcqDone)}</Text>
      <Text testID="showMcqHint">{String(!!a0?.showMcqHint)}</Text>
      <Text testID="fillFeedback">{a0?.fillFeedback ?? 'idle'}</Text>
      <Text testID="explanation">{a0?.explanation ?? ''}</Text>
      {[0, 1].map((q) => [0, 1, 2, 3].map((o) => (
        <TouchableOpacity key={'q' + q + o} testID={'q' + q + '-opt' + o} onPress={() => h.handleMcqAnswer(q, o)}><Text>x</Text></TouchableOpacity>
      )))}
      <TouchableOpacity testID="setFillMat" onPress={() => h.setFillInput(0, 'mat')}><Text>x</Text></TouchableOpacity>
      <TouchableOpacity testID="setFillWrong" onPress={() => h.setFillInput(0, 'wrong')}><Text>x</Text></TouchableOpacity>
      <TouchableOpacity testID="submitFill" onPress={() => h.handleFillSubmit(0)}><Text>x</Text></TouchableOpacity>
      <TouchableOpacity testID="finish" onPress={() => h.finish()}><Text>x</Text></TouchableOpacity>
      <Text testID="types">{h.questions.map((q) => q.type).join(',')}</Text>
      <Text testID="qCount">{h.questions.length}</Text>
      <Text testID="spokenStatus">{h.spokenStatus}</Text>
      <Text testID="spokenError">{h.spokenError}</Text>
      <Text testID="results">{JSON.stringify(h.perQuestionResultsRef.current)}</Text>
      <Text testID="savedAttemptId">{String(h.savedAttemptId)}</Text>
      <TouchableOpacity testID="setSpoken" onPress={() => h.setSpokenText(SPOKEN)}><Text>x</Text></TouchableOpacity>
      <TouchableOpacity testID="setSpokenShort" onPress={() => h.setSpokenText('um ok')}><Text>x</Text></TouchableOpacity>
      <TouchableOpacity testID="submitSpoken" onPress={() => h.submitSpoken()}><Text>x</Text></TouchableOpacity>
    </>
  );
}

type User = ReturnType<typeof userEvent.setup>;
const text = (id: string) => screen.getByTestId(id).props.children;
const mocks = () => (globalThis as any).__lastMocks;
const fetchCalls = (part: string) => (global.fetch as jest.Mock).mock.calls.filter(([url]) => String(url).includes(part));

async function answerSpoken(user: User) {
  await user.press(screen.getByTestId('setSpoken'));
  await user.press(screen.getByTestId('submitSpoken'));
}

// Q1 and Q2 right on the first try.
async function answerBothMcqRight(user: User) {
  await user.press(screen.getByTestId('q0-opt1'));
  await user.press(screen.getByTestId('q1-opt0'));
}

async function pressSeeResults(user: User) {
  await waitFor(() => expect(text('allAnswered')).toBe('true'));
  await user.press(screen.getByTestId('finish'));
  await waitFor(() => expect(text('phase')).toBe('result'));
}

// Everything right (spoken passed), then See Results.
async function answerAllAndFinish(user: User) {
  await answerBothMcqRight(user);
  await answerSpoken(user);
  await pressSeeResults(user);
}

async function startQuiz(props: React.ComponentProps<typeof Harness> = {}) {
  await render(<Harness {...props} />);
  await waitFor(() => expect(text('phase')).toBe('quiz'));
}

beforeEach(() => {
  clearQuizResults();
  jest.clearAllMocks();
  mockFetchRoutes();
});

describe('useQuiz — start page', () => {
  test('opens on the start page and generates nothing until a test is started', async () => {
    await render(<Harness autoStart={false} />);
    expect(text('phase')).toBe('hub');
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchCalls('/ibpyp/quiz')).toHaveLength(0);
  });
});

describe('useQuiz — fetching', () => {
  test('loads real questions from the server and moves to the real quiz phase', async () => {
    await startQuiz();
    expect(text('answered')).toBe(0);
  });

  test('a real fetch failure alerts and navigates back, never gets stuck loading', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('down')) as any;
    await render(<Harness />);
    await waitFor(() => expect(mocks().navigation.goBack).toHaveBeenCalled());
  });

  test('a real empty-questions response is treated as an error (alert + goBack)', async () => {
    mockFetchRoutes({ quiz: { questions: [] } });
    await render(<Harness />);
    await waitFor(() => expect(mocks().navigation.goBack).toHaveBeenCalled());
  });
});

describe('useQuiz — teacher-authored practiceQuiz (preset path)', () => {
  test('when practiceQuiz is provided, it is used directly and /ibpyp/quiz is never called', async () => {
    const preset = [{ type: 'mcq', question: 'Preset Q', options: ['A', 'B', 'C', 'D'], correct: 2, hint: 'h', explanation: 'e' }];
    await startQuiz({ practiceQuiz: preset });
    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/ibpyp/quiz'), expect.anything());
  });
});

describe('useQuiz — MCQ flow (per question, same rules as before)', () => {
  test('a correct first answer locks the question and shows its explanation', async () => {
    const user = userEvent.setup();
    await startQuiz();
    await user.press(screen.getByTestId('q0-opt1'));
    await waitFor(() => expect(text('mcqDone')).toBe('true'));
    await waitFor(() => expect(text('explanation')).toBe('e1'));
  });

  test('a first wrong answer unlocks for retry and shows the hint, does not lock yet', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await startQuiz();
    await user.press(screen.getByTestId('q0-opt0'));
    await waitFor(() => expect(text('showMcqHint')).toBe('true'));
    expect(text('mcqDone')).toBe('false');
    expect(text('mcqSelected')).toBe('null');
    expect(text('answered')).toBe(0);
    jest.useRealTimers();
  });

  test('a second wrong answer locks the question, records it wrong and fetches a wrong-answer explanation', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await startQuiz();
    await user.press(screen.getByTestId('q0-opt0')); // 1st wrong
    await waitFor(() => expect(text('showMcqHint')).toBe('true'));
    await user.press(screen.getByTestId('q0-opt2')); // 2nd wrong
    await waitFor(() => expect(text('mcqDone')).toBe('true'));
    await waitFor(() => expect(text('explanation')).toBe('explained'));
    expect(text('answered')).toBe(1);
    expect(text('score')).toBe(0);
    expect(JSON.parse(text('results'))[0]).toMatchObject({ studentAnswer: 'C', correctAnswer: 'B', isCorrect: false });
    jest.useRealTimers();
  });

  test('a right answer on the retry counts as correct', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await startQuiz();
    await user.press(screen.getByTestId('q0-opt0')); // 1st wrong
    await waitFor(() => expect(text('showMcqHint')).toBe('true'));
    await user.press(screen.getByTestId('q0-opt1')); // right
    await waitFor(() => expect(text('answered')).toBe(1));
    expect(text('score')).toBe(1);
    jest.useRealTimers();
  });
});

describe('useQuiz — fill-blank flow', () => {
  test('a correct answer sets fillFeedback to "correct" with its explanation and records it', async () => {
    mockFetchRoutes({ quiz: { questions: fillQuestion } });
    const user = userEvent.setup();
    await startQuiz();
    await user.press(screen.getByTestId('setFillMat'));
    await user.press(screen.getByTestId('submitFill'));
    await waitFor(() => expect(text('fillFeedback')).toBe('correct'));
    expect(text('explanation')).toBe('e');
    expect(JSON.parse(text('results'))[0]).toMatchObject({ studentAnswer: 'mat', correctAnswer: 'mat', isCorrect: true });
  });

  test('a 1st wrong answer sets "wrong1", a 2nd sets "wrong2", a 3rd reveals it (recorded wrong)', async () => {
    mockFetchRoutes({ quiz: { questions: fillQuestion } });
    const user = userEvent.setup();
    await startQuiz();

    await user.press(screen.getByTestId('setFillWrong'));
    await user.press(screen.getByTestId('submitFill'));
    await waitFor(() => expect(text('fillFeedback')).toBe('wrong1'));

    await user.press(screen.getByTestId('submitFill'));
    await waitFor(() => expect(text('fillFeedback')).toBe('wrong2'));
    expect(text('answered')).toBe(0);

    await user.press(screen.getByTestId('submitFill'));
    await waitFor(() => expect(text('fillFeedback')).toBe('revealed'));
    expect(text('answered')).toBe(1);
    expect(text('score')).toBe(0);
  });

  test('a network failure on validation gives the student the benefit of the doubt ("correct")', async () => {
    mockFetchRoutes({ quiz: { questions: fillQuestion }, fillValidate: () => Promise.reject(new Error('down')) });
    const user = userEvent.setup();
    await startQuiz();
    await user.press(screen.getByTestId('setFillWrong'));
    await user.press(screen.getByTestId('submitFill'));
    await waitFor(() => expect(text('fillFeedback')).toBe('correct'));
    expect(text('score')).toBe(1);
  });
});

describe('useQuiz — all questions on one page', () => {
  test('every question is answerable straight away, in any order', async () => {
    const user = userEvent.setup();
    await startQuiz();

    await user.press(screen.getByTestId('q1-opt0')); // Q2 first (right)
    await waitFor(() => expect(text('answered')).toBe(1));
    await user.press(screen.getByTestId('q0-opt1')); // then Q1 (right)
    await waitFor(() => expect(text('answered')).toBe(2));

    const answers = JSON.parse(text('answers'));
    expect(answers[0]).toMatchObject({ mcqSelected: 1, mcqDone: true, recorded: true });
    expect(answers[1]).toMatchObject({ mcqSelected: 0, mcqDone: true, recorded: true });
    expect(text('score')).toBe(2);
    // recorded by question number, whatever order they were answered in
    const results = JSON.parse(text('results'));
    expect(results[0]).toMatchObject({ question: 'Q1', studentAnswer: 'B', correctAnswer: 'B', isCorrect: true });
    expect(results[1]).toMatchObject({ question: 'Q2', studentAnswer: 'A', correctAnswer: 'A', isCorrect: true });
  });

  test('answering one question leaves the others untouched', async () => {
    const user = userEvent.setup();
    await startQuiz();
    await user.press(screen.getByTestId('q0-opt1'));
    await waitFor(() => expect(text('mcqDone')).toBe('true'));
    expect(JSON.parse(text('answers'))[1] ?? null).toBeNull();
  });

  test('an answered question cannot be answered again or counted twice', async () => {
    const user = userEvent.setup();
    await startQuiz();
    await user.press(screen.getByTestId('q0-opt1')); // right
    await user.press(screen.getByTestId('q0-opt2')); // ignored
    await user.press(screen.getByTestId('q0-opt1')); // ignored
    expect(text('mcqSelected')).toBe('1');
    expect(text('answered')).toBe(1);
    expect(text('score')).toBe(1);
    expect(JSON.parse(text('results')).filter(Boolean)).toHaveLength(1);
  });

  test('See Results does nothing until every question is answered', async () => {
    const user = userEvent.setup();
    await startQuiz();
    await answerBothMcqRight(user);
    await waitFor(() => expect(text('answered')).toBe(2));
    expect(text('allAnswered')).toBe('false');
    await user.press(screen.getByTestId('finish'));
    expect(text('phase')).toBe('quiz');
    expect(mocks().completeLesson).not.toHaveBeenCalled();
    expect(fetchCalls('/student/track-attempt')).toHaveLength(0);
  });

  test('the spoken question can be answered first; the results never open on their own', async () => {
    const user = userEvent.setup();
    await startQuiz();
    await answerSpoken(user);
    await waitFor(() => expect(text('answered')).toBe(1));
    await answerBothMcqRight(user);
    await waitFor(() => expect(text('allAnswered')).toBe('true'));
    expect(text('phase')).toBe('quiz'); // the student sees the last feedback first
    await pressSeeResults(user);
    expect(text('score')).toBe(3);
  });

  // Regression test for Bug #22 ("XP inconsistent between pages"):
  // completeLesson()'s real, idempotent, server-persisted XP is the ONLY XP
  // source for finishing a test — no separate local-only addXP() bump.
  test('finishing records real XP via completeLesson only, NOT a separate local-only addXP bump', async () => {
    const user = userEvent.setup();
    await startQuiz();
    await answerAllAndFinish(user);
    expect(mocks().completeLesson).toHaveBeenCalledWith('Topic', 'English', 'Grade 6', 'CBSE');
    expect(mocks().addXP).not.toHaveBeenCalled();
  });

  // Dashboard sync: the finished score is recorded locally right away, so the
  // dashboard shows it even before the track-result write is visible.
  test('finishing records the score locally for the dashboard (topic name + subject)', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await startQuiz();
    await user.press(screen.getByTestId('q0-opt1')); // Q1 right
    await user.press(screen.getByTestId('q1-opt1')); // Q2 wrong
    await waitFor(() => expect(JSON.parse(text('answers'))[1].showMcqHint).toBe(true));
    await user.press(screen.getByTestId('q1-opt2')); // Q2 wrong again
    await answerSpoken(user);
    await pressSeeResults(user);
    expect(mocks().recordQuizResult).toHaveBeenCalledTimes(1);
    // Q1 right, Q2 wrong, spoken explanation passed (8/10) -> 2 of 3
    expect(mocks().recordQuizResult).toHaveBeenCalledWith('Topic', 67, 'English');
    expect(mocks().completeLesson).toHaveBeenCalled(); // 67% >= 60%
    jest.useRealTimers();
  });

  test('a score under 60% does not complete the lesson', async () => {
    mockFetchRoutes({ evaluate: () => jsonRes(LOW_EVAL) });
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await startQuiz();
    await user.press(screen.getByTestId('q0-opt1')); // Q1 right
    await user.press(screen.getByTestId('q1-opt1')); // Q2 wrong
    await waitFor(() => expect(JSON.parse(text('answers'))[1].showMcqHint).toBe(true));
    await user.press(screen.getByTestId('q1-opt2')); // Q2 wrong again
    await answerSpoken(user); // low score -> wrong
    await pressSeeResults(user);
    expect(mocks().recordQuizResult).toHaveBeenCalledWith('Topic', 33, 'English');
    expect(mocks().completeLesson).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  // B004 regression: track-attempt uses StudentDataContext's resolved
  // studentId (AuthContext's user.id is never populated).
  test('a finished test sends track-attempt with the resolved studentId and every answer in question order', async () => {
    const user = userEvent.setup();
    await startQuiz({ studentId: 'real-resolved-student-id' });
    await answerAllAndFinish(user);
    const calls = fetchCalls('/student/track-attempt');
    expect(calls).toHaveLength(1);
    const body = JSON.parse(calls[0][1].body);
    expect(body.studentId).toBe('real-resolved-student-id');
    expect(body).toMatchObject({ totalQuestions: 3, correctAnswers: 3, score: 100 });
    expect(body.perQuestionResults.map((r: any) => r.question)).toEqual(['Q1', 'Q2', expect.stringContaining('Explain')]);
  });

  test('a missing studentId at finish time does not send track-attempt and does not throw', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const user = userEvent.setup();
    await startQuiz({ studentId: undefined });
    await answerAllAndFinish(user);
    expect(fetchCalls('/student/track-attempt')).toHaveLength(0);
    // completeLesson/XP must still work when tracking is skipped
    expect(mocks().completeLesson).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('pressing See Results twice still sends exactly one track-attempt call', async () => {
    const user = userEvent.setup();
    await startQuiz({ studentId: 'real-resolved-student-id' });
    await answerAllAndFinish(user);
    await user.press(screen.getByTestId('finish'));
    expect(fetchCalls('/student/track-attempt')).toHaveLength(1);
    expect(fetchCalls('/ibpyp/track-result')).toHaveLength(1);
  });

  test('records study time from the per-question times', async () => {
    const user = userEvent.setup();
    await startQuiz();
    await answerAllAndFinish(user);
    const results = JSON.parse(text('results'));
    expect(results.every((r: any) => typeof r.timeSeconds === 'number' && r.timeSeconds >= 0)).toBe(true);
    expect(mocks().recordStudySeconds).toHaveBeenCalledWith(expect.any(Number), 'learningPath', 'English');
  });
});

describe('useQuiz — the spoken last question', () => {
  test('every practice test ends with a spoken question after the generated ones', async () => {
    await startQuiz();
    expect(text('qCount')).toBe(3);
    expect(text('types')).toBe('mcq,mcq,spoken');
  });

  test('teacher-authored practice questions get it too', async () => {
    await startQuiz({ practiceQuiz: [{ type: 'mcq', question: 'T1', options: ['a', 'b'], correct: 0 }] });
    expect(text('qCount')).toBe(2);
  });

  test('submitting sends what was said, with the topic\'s key points, and records the evaluation', async () => {
    const user = userEvent.setup();
    await startQuiz({ studentId: 's1', keyPoints: ['Tenali Rama used wit'] });
    await answerAllAndFinish(user);

    const call = fetchCalls('/ibpyp/evaluate-explanation')[0];
    expect(JSON.parse(call[1].body)).toMatchObject({ topic: 'Topic', subject: 'English', grade: 'Grade 6', transcript: SPOKEN, keyPoints: ['Tenali Rama used wit'] });
    const results = JSON.parse(text('results'));
    expect(results).toHaveLength(3);
    expect(results[2]).toMatchObject({ type: 'spoken', studentAnswer: SPOKEN, isCorrect: true, evaluation: GOOD_EVAL });
    expect(text('score')).toBe(3);
    // the attempt saved for the dashboard carries the spoken answer and its evaluation
    const attempt = JSON.parse(fetchCalls('/student/track-attempt')[0][1].body);
    expect(attempt.totalQuestions).toBe(3);
    expect(attempt.perQuestionResults[2].evaluation.score).toBe(8);
  });

  test('the feedback shows on the spoken question once graded', async () => {
    const user = userEvent.setup();
    await startQuiz();
    await answerSpoken(user);
    await waitFor(() => expect(text('answered')).toBe(1));
    expect(JSON.parse(text('answers'))[2]).toMatchObject({ recorded: true, explanation: 'Well explained!' });
  });

  test('a low-scoring explanation counts as wrong and gets no extra "explain-wrong" call', async () => {
    mockFetchRoutes({ evaluate: () => jsonRes(LOW_EVAL) });
    const user = userEvent.setup();
    await startQuiz();
    await answerBothMcqRight(user);
    await answerSpoken(user);
    await pressSeeResults(user);
    expect(text('score')).toBe(2);
    expect(fetchCalls('/ibpyp/explain-wrong')).toHaveLength(0);
  });

  test('a grading failure keeps the question open with the student\'s text and a message', async () => {
    mockFetchRoutes({ evaluate: () => jsonRes({ error: 'Could not check your explanation. Please try again.' }, false) });
    const user = userEvent.setup();
    await startQuiz();
    await answerSpoken(user);
    await waitFor(() => expect(text('spokenStatus')).toBe('error'));
    expect(text('spokenError')).toMatch(/Could not check your explanation/);
    expect(text('phase')).toBe('quiz');
    expect(text('answered')).toBe(0); // not answered: the student can try again
  });

  test('too little said is not sent', async () => {
    const user = userEvent.setup();
    await startQuiz();
    await user.press(screen.getByTestId('setSpokenShort'));
    await user.press(screen.getByTestId('submitSpoken'));
    expect(fetchCalls('/ibpyp/evaluate-explanation')).toHaveLength(0);
  });

  test('a graded explanation cannot be sent again', async () => {
    const user = userEvent.setup();
    await startQuiz();
    await answerSpoken(user);
    await waitFor(() => expect(text('answered')).toBe(1));
    await user.press(screen.getByTestId('submitSpoken'));
    expect(fetchCalls('/ibpyp/evaluate-explanation')).toHaveLength(1);
  });
});

describe('Practise This Skill evidence', () => {
  test('each answer keeps its first response, tries and hint shown apart from the score; the saved attempt id comes back', async () => {
    const user = userEvent.setup();
    mockFetchRoutes();
    const base = global.fetch as jest.Mock;
    global.fetch = jest.fn((url: string, opts?: any) => (String(url).includes('/student/track-attempt')
      ? jsonRes({ ok: true, attempt: { id: 'attempt-42' } })
      : base(url, opts))) as any;
    await render(<Harness studentId="stu-1" />);
    await waitFor(() => expect(text('phase')).toBe('quiz'));
    await user.press(screen.getByTestId('q0-opt0')); // wrong first (A)
    await waitFor(() => expect(text('showMcqHint')).toBe('true'), { timeout: 3000 });
    await user.press(screen.getByTestId('q0-opt1')); // right on the second try, after the hint
    await user.press(screen.getByTestId('q1-opt0')); // right first time
    await answerSpoken(user);
    await pressSeeResults(user);
    expect(text('score')).toBe(3); // the score itself is unchanged by the evidence
    const body = JSON.parse(fetchCalls('/student/track-attempt')[0][1].body);
    expect(body.perQuestionResults[0]).toMatchObject({ isCorrect: true, attempts: 2, firstAnswer: 'A', hintShown: true });
    expect(body.perQuestionResults[1]).toMatchObject({ isCorrect: true, attempts: 1, firstAnswer: 'A', hintShown: false });
    expect(body.perQuestionResults[2]).not.toHaveProperty('attempts'); // voice question stays separate
    expect(body.perQuestionResults[0]).toHaveProperty('reasoning');
    await waitFor(() => expect(text('savedAttemptId')).toBe('attempt-42'));
  });
});
