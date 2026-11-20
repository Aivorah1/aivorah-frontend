// Ask Aivorah coach for one wrong question, against a mocked API (the server
// rules are tested in aivorah-learning-paths-service).
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import QuestionCoach from '../components/QuestionCoach';
import WrongQuestionActions from '../components/WrongQuestionActions';
import { coachIntent } from '../hooks/useQuestionCoach';

jest.mock('../../../../../context/ThemeContext', () => ({
  useTheme: () => ({ colors: { textMain: '#111', textMuted: '#666', borderColor: '#ddd', bgDark: '#fff', cardDark: '#fff' }, isDark: false }),
}));

const mockApi: Record<string, jest.Mock> = {
  explainQuestion: jest.fn(), practiseQuestion: jest.fn(), answer: jest.fn(), hint: jest.fn(), solution: jest.fn(), clarify: jest.fn(), working: jest.fn(),
};
jest.mock('../services/practiceFollowupApi', () => {
  class FollowupApiError extends Error { status: number; code?: string; constructor(m: string, s: number, c?: string) { super(m); this.status = s; this.code = c; } }
  return { FollowupApiError, followupApi: new Proxy({}, { get: (_t, k: string) => (...a: any[]) => mockApi[k](...a) }) };
});
const { FollowupApiError } = jest.requireMock('../services/practiceFollowupApi');

const COLORS: any = { accentGreen: '#5A8A70', accentYellow: '#B8860B', textMain: '#111', textMuted: '#666', borderColor: '#ddd', cardDark: '#fff', bgDark: '#fff' };
const WRONG = [{ index: 0, question: 'What is 1/4 + 1/6?' }, { index: 1, question: 'Write 3/4 with denominator 12' }];
const explainView = (index: number, method = 'rule', title = 'Find a common denominator') => ({
  mode: 'explain', attemptId: 'a1', questionIndex: index, followupId: 'f1',
  question: { index, text: WRONG.find((w) => w.index === index)!.question, yourAnswer: '2/10', correctAnswer: '5/12' },
  explanation: { title, body: 'Use the LCM.', method, variant: 'first', methodName: method === 'rule' ? 'The idea' : 'Step by step', steps: method === 'steps' ? ['Find the LCM', 'Rename', 'Add'] : null, at: '' },
  skillLabel: 'Adding fractions', methodsUsed: [method], repeated: false, wrongQuestions: WRONG,
});
const q1 = { id: 'gq-1', type: 'mcq', question: 'What is 1/3 + 1/6?', options: ['1/2', '2/9', '1/9'], reasoningPrompt: 'Why did you choose that option?', level: 2, levelName: 'standard', isMemoryCheck: false, helpShown: 'none', hint: null };
const practiceView = (over: any = {}) => ({ mode: 'practice', attemptId: 'a1', questionIndex: 0, followupId: 'f1', skillLabel: 'Adding fractions', question: q1, clarification: null, memoryCheck: null, wrongQuestions: WRONG, ...over });

beforeEach(() => Object.values(mockApi).forEach((f) => f.mockReset()));

describe('Explain This Question', () => {
  test('explains the clicked (second) wrong question first, then moves to the other one', async () => {
    mockApi.explainQuestion.mockImplementation(async (_a: string, i: number) => explainView(i));
    await render(<QuestionCoach attemptId="a1" questionIndex={1} mode="explain" colors={COLORS} />);
    await waitFor(() => expect(screen.getByText('Write 3/4 with denominator 12')).toBeTruthy());
    expect(screen.getByText(/Wrong question 2 of 2/)).toBeTruthy();
    expect(mockApi.explainQuestion).toHaveBeenCalledWith('a1', 1, 'first', undefined);
    await fireEvent.press(screen.getByTestId('coach-next-wrong'));
    await waitFor(() => expect(screen.getByText('What is 1/4 + 1/6?')).toBeTruthy());
    expect(mockApi.explainQuestion).toHaveBeenLastCalledWith('a1', 0, 'first', undefined);
  });

  test('Explain Another Way / Again, typed requests, and Give Me a Practice Question', async () => {
    mockApi.explainQuestion.mockImplementation(async (_a: string, i: number, action: string) => (action === 'another_way' ? explainView(i, 'steps', 'Do it step by step') : explainView(i)));
    mockApi.practiseQuestion.mockResolvedValue(practiceView());
    await render(<QuestionCoach attemptId="a1" questionIndex={0} mode="explain" colors={COLORS} />);
    await waitFor(() => expect(screen.getByTestId('coach-explanation')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('coach-explain-another-way'));
    await waitFor(() => expect(screen.getByText('Do it step by step')).toBeTruthy());
    expect(screen.getByText('1. Find the LCM')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('coach-message'), "I still don't understand");
    await fireEvent.press(screen.getByTestId('coach-message-send'));
    await waitFor(() => expect(mockApi.explainQuestion).toHaveBeenLastCalledWith('a1', 0, 'another_way', undefined));
    await fireEvent.press(screen.getByTestId('coach-explain-again'));
    await waitFor(() => expect(mockApi.explainQuestion).toHaveBeenLastCalledWith('a1', 0, 'again', undefined));
    await fireEvent.press(screen.getByTestId('coach-practice'));
    await waitFor(() => expect(screen.getByTestId('coach-question')).toBeTruthy());
    expect(mockApi.practiseQuestion).toHaveBeenCalledWith('a1', 0, 'start', undefined);
  });

  test('an AI failure keeps what was shown and offers Try again', async () => {
    mockApi.explainQuestion.mockRejectedValueOnce(new FollowupApiError('Aivorah couldn’t prepare that just now.', 503, 'generation_failed')).mockResolvedValueOnce(explainView(0));
    await render(<QuestionCoach attemptId="a1" questionIndex={0} mode="explain" colors={COLORS} />);
    await waitFor(() => expect(screen.getByTestId('coach-error')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('coach-retry'));
    await waitFor(() => expect(screen.getByTestId('coach-explanation')).toBeTruthy());
  });
});

describe('Practise This Skill', () => {
  test('starts with a fresh question, records the answer, then gives another only when asked', async () => {
    mockApi.practiseQuestion.mockResolvedValueOnce(practiceView()).mockResolvedValueOnce(practiceView({ question: { ...q1, id: 'gq-2', question: 'What is 1/2 + 1/4?' } }));
    mockApi.answer.mockResolvedValue({ result: { code: 'independent', message: 'Correct — you got it right on your own.', questionId: 'gq-1', type: 'mcq', question: '', correctAnswer: '1/2' }, session: { clarification: null } });
    await render(<QuestionCoach attemptId="a1" questionIndex={0} mode="practice" colors={COLORS} />);
    await waitFor(() => expect(screen.getByText('What is 1/3 + 1/6?')).toBeTruthy());
    expect(screen.queryByTestId('coach-explanation')).toBeNull();
    expect(mockApi.explainQuestion).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('coach-option-0'));
    await fireEvent.changeText(screen.getByPlaceholderText(/Your reason or one working step/), 'LCM of 3 and 6 is 6');
    await fireEvent.press(screen.getByTestId('coach-submit'));
    await waitFor(() => expect(screen.getByText('Correct — you got it right on your own.')).toBeTruthy());
    expect(mockApi.answer).toHaveBeenCalledWith('f1', 'gq-1', 0, 'LCM of 3 and 6 is 6');
    expect(screen.queryByTestId('coach-question')).toBeNull();
    await fireEvent.changeText(screen.getByTestId('coach-message'), 'give me another question');
    await fireEvent.press(screen.getByTestId('coach-message-send'));
    await waitFor(() => expect(screen.getByText('What is 1/2 + 1/4?')).toBeTruthy());
    expect(mockApi.practiseQuestion).toHaveBeenLastCalledWith('a1', 0, 'next', undefined);
  });

  test('a wrong answer asks for one working step and shows the step Aivorah found', async () => {
    mockApi.practiseQuestion.mockResolvedValue(practiceView());
    mockApi.answer.mockResolvedValue({ result: { code: 'incorrect', message: 'Good try! Tell me one step of how you worked it out.', questionId: 'gq-1', type: 'mcq', question: '', correctAnswer: '1/2' }, session: { clarification: null } });
    mockApi.working.mockResolvedValue({ identified: true, step: 'finding the LCM', feedback: 'The LCM of 3 and 6 is 6, not 18.' });
    await render(<QuestionCoach attemptId="a1" questionIndex={0} mode="practice" colors={COLORS} />);
    await waitFor(() => expect(screen.getByTestId('coach-question')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('coach-option-1'));
    await fireEvent.press(screen.getByTestId('coach-submit'));
    await waitFor(() => expect(screen.getByText('Correct answer: 1/2')).toBeTruthy());
    await fireEvent.changeText(screen.getByPlaceholderText(/I found the LCM/), 'I used 18 as the LCM');
    await fireEvent.press(screen.getByTestId('coach-working-submit'));
    await waitFor(() => expect(screen.getByText('The LCM of 3 and 6 is 6, not 18.')).toBeTruthy());
  });

  test('memory check banner when coming back after a week', async () => {
    mockApi.practiseQuestion.mockResolvedValue(practiceView({ question: { ...q1, isMemoryCheck: true, level: 3, levelName: 'challenge' }, memoryCheck: { daysSince: 9 } }));
    await render(<QuestionCoach attemptId="a1" questionIndex={0} mode="practice" colors={COLORS} />);
    await waitFor(() => expect(screen.getByTestId('coach-memory-check')).toBeTruthy());
    expect(screen.getByText(/it has been 9 days/)).toBeTruthy();
    expect(screen.getByText('Fresh question · challenge')).toBeTruthy();
  });

  test('a hint is shown only after the server saved it', async () => {
    mockApi.practiseQuestion.mockResolvedValue(practiceView());
    mockApi.hint.mockResolvedValue({ questionId: 'gq-1', hint: 'Find the LCM first.' });
    await render(<QuestionCoach attemptId="a1" questionIndex={0} mode="practice" colors={COLORS} />);
    await waitFor(() => expect(screen.getByTestId('coach-question')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('coach-hint-btn'));
    await waitFor(() => expect(screen.getByText('Hint: Find the LCM first.')).toBeTruthy());
    expect(mockApi.hint).toHaveBeenCalledWith('f1', 'gq-1');
  });
});

describe('report actions and typed requests', () => {
  test('both actions under a wrong question, plus What you worked on from saved activity', async () => {
    const onExplain = jest.fn(); const onPractise = jest.fn();
    await render(<WrongQuestionActions index={2} ready workedOn={{ index: 2, question: 'q', skillLabel: 'x', hasActivity: true, lines: ['Ask Aivorah explained “x”. Explanation reviewed.', 'Practised 1 fresh question: 1 on your own.'], practice: {} as any, recurringMistakes: [], memoryChecks: [] }}
      onExplain={onExplain} onPractise={onPractise} colors={COLORS} />);
    await fireEvent.press(screen.getByText('Explain This Question'));
    await fireEvent.press(screen.getByText('Practise This Skill'));
    expect(onExplain).toHaveBeenCalledWith(2);
    expect(onPractise).toHaveBeenCalledWith(2);
    expect(screen.getByText('What you worked on')).toBeTruthy();
    expect(screen.getByText('Practised 1 fresh question: 1 on your own.')).toBeTruthy();
  });

  test('no saved activity: no box; not saved yet: buttons wait', async () => {
    await render(<WrongQuestionActions index={0} ready={false} saving workedOn={null} onExplain={jest.fn()} onPractise={jest.fn()} colors={COLORS} />);
    expect(screen.queryByText('What you worked on')).toBeNull();
    expect(screen.getByText('Saving your test…')).toBeTruthy();
  });

  test('typed messages map to the same actions', () => {
    expect(coachIntent('can you explain it another way', 'explain')).toBe('another_way');
    expect(coachIntent("I don't understand", 'explain')).toBe('another_way');
    expect(coachIntent('say that again', 'explain')).toBe('again');
    expect(coachIntent('give me a practice question', 'explain')).toBe('practice');
    expect(coachIntent('Give me another question', 'practice')).toBe('next_question');
    expect(coachIntent('next wrong question', 'explain')).toBe('next_wrong');
    expect(coachIntent('take me to the other question', 'practice')).toBe('next_wrong');
    expect(coachIntent('hello', 'practice')).toBeNull();
  });
});
