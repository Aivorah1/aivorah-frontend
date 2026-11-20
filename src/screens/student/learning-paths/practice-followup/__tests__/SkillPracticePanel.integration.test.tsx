// Ask Aivorah → Practise This Skill panel against a mocked API (the server
// rules themselves are tested in aivorah-learning-paths-service).
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SkillPracticePanel from '../components/SkillPracticePanel';
import type { SessionView } from '../types';

jest.mock('../../../../../context/ThemeContext', () => ({
  useTheme: () => ({ colors: { textMain: '#111', textMuted: '#666', borderColor: '#ddd', bgDark: '#fff', cardDark: '#fff' }, isDark: false }),
}));

const mockApi = {
  session: jest.fn(), open: jest.fn(), answer: jest.fn(), clarify: jest.fn(), hint: jest.fn(), solution: jest.fn(), explainAnotherWay: jest.fn(),
};
jest.mock('../services/practiceFollowupApi', () => {
  class FollowupApiError extends Error { status: number; code?: string; constructor(m: string, s: number, c?: string) { super(m); this.status = s; this.code = c; } }
  return { FollowupApiError, followupApi: new Proxy({}, { get: (_t, k: string) => (...a: any[]) => (mockApi as any)[k](...a) }) };
});
const { FollowupApiError } = jest.requireMock('../services/practiceFollowupApi');

const COLORS: any = { accentGreen: '#5A8A70', accentYellow: '#B8860B', textMain: '#111', textMuted: '#666', borderColor: '#ddd', cardDark: '#fff', bgDark: '#fff' };

const teaching = (methodId = 'definition') => ({
  methodId, methodName: methodId === 'definition' ? 'Definition' : 'Side-by-side comparison', title: methodId === 'definition' ? 'What each one means' : 'Put them side by side',
  body: methodId === 'definition' ? 'A pun is a play on words…' : 'Puns are about MEANING. Alliteration is about SOUND.',
  examples: [{ label: 'Pun', text: '“I used to be a baker, but I couldn’t make enough dough.”' }], table: null, steps: null,
  confusion: 'In your test, the question asked for a pun, but you chose a sentence with alliteration.',
});
const mcq = { id: 'pa-mcq-01', type: 'mcq' as const, question: 'Which sentence contains a pun?', options: ['The bicycle was two-tired.', 'Busy birds built a nest.'], reasoningPrompt: 'Why did you choose that option?', number: 1, helpShown: 'none' as const, hint: null };
const fill = { id: 'pa-fill-01', type: 'fill_blank' as const, question: 'In “The calendar’s days are numbered,” the word numbered creates a ____.', reasoningPrompt: 'Why did you write that answer?', number: 2, helpShown: 'none' as const, hint: null };
const session = (over: Partial<SessionView> = {}): SessionView => ({
  followupId: 'f1', attemptId: 'a1', skill: { id: 's', label: 'Telling puns and alliteration apart', shortName: 'Puns and alliteration' },
  topic: 'A Concrete Example', subject: 'English', grade: 'Grade 8', originalScore: 80, status: 'in_progress',
  progress: { confirmed: 0, needed: 2 }, teaching: teaching(), question: mcq, clarification: null, unavailable: null, complete: null,
  outcome: { code: 'in_progress', label: 'In progress', text: '', parentText: '', confirmed: 0 }, answeredCount: 0, ...over,
});

beforeEach(() => {
  Object.values(mockApi).forEach((f) => f.mockReset());
  // Opening uses POST /open (with the lesson text); reloads use GET.
  mockApi.open.mockImplementation((...a: any[]) => mockApi.session(...a));
});

async function open(over: Partial<SessionView> = {}) {
  mockApi.session.mockResolvedValue(session(over));
  await render(<SkillPracticePanel followupId="f1" colors={COLORS} onBackToReport={jest.fn()} />);
  await waitFor(() => expect(screen.getByTestId('skill-practice')).toBeTruthy());
}

test('shows the skill, the teaching with the specific confusion, and an MCQ with its reasoning box', async () => {
  await open();
  expect(screen.getByText('Puns and alliteration')).toBeTruthy();
  expect(screen.getByText(/you chose a sentence with alliteration/)).toBeTruthy();
  expect(screen.getByText('Explain Another Way')).toBeTruthy();
  expect(screen.getByText('Question 1 of 2')).toBeTruthy();
  expect(screen.getByText('Why did you choose that option?')).toBeTruthy();
  expect(screen.getByTestId('skill-option-0').props.accessibilityRole).toBe('radio');
});

test('Explain Another Way swaps in a different saved method', async () => {
  await open();
  mockApi.explainAnotherWay.mockResolvedValue({ understood: true, session: session({ teaching: teaching('side_by_side') }) });
  await fireEvent.press(screen.getByTestId('explain-another-way'));
  await waitFor(() => expect(screen.getByText('Put them side by side')).toBeTruthy());
  // A typed "I don't understand" goes the same way
  await fireEvent.changeText(screen.getByTestId('teaching-message'), "I don't understand");
  await fireEvent.press(screen.getByTestId('teaching-message-send'));
  expect(mockApi.explainAnotherWay).toHaveBeenLastCalledWith('f1', "I don't understand");
});

test('submits answer and reasoning together; shows the saved result and the next (fill-in) question', async () => {
  await open();
  mockApi.answer.mockResolvedValue({
    result: { code: 'independent', message: 'Correct — you got it right on your own.', questionId: mcq.id, type: 'mcq', question: mcq.question, correctAnswer: mcq.options[0] },
    session: session({ question: fill, progress: { confirmed: 1, needed: 2 } }),
  });
  await fireEvent.press(screen.getByTestId('skill-option-0'));
  await fireEvent.changeText(screen.getByPlaceholderText(/Explain your thinking/), 'two-tired sounds like too tired');
  await fireEvent.press(screen.getByTestId('skill-submit'));
  await waitFor(() => expect(screen.getByText('Correct — you got it right on your own.')).toBeTruthy());
  expect(mockApi.answer).toHaveBeenCalledWith('f1', 'pa-mcq-01', 0, 'two-tired sounds like too tired');
  expect(screen.getByText('1 of 2 confirmed')).toBeTruthy();
  expect(screen.getByText('Question 2 of 2')).toBeTruthy();
  expect(screen.getByText('Why did you write that answer?')).toBeTruthy();
  expect(screen.getByTestId('skill-fill-input')).toBeTruthy();
});

test('a correct answer with an unclear reason asks for a short clarification', async () => {
  await open();
  mockApi.answer.mockResolvedValue({
    result: { code: 'clarify', message: 'Correct! Now tell me a little more: why is that the answer? Use your own words.', questionId: mcq.id, type: 'mcq', question: mcq.question, correctAnswer: null },
    session: session({ question: null, clarification: { questionId: mcq.id, question: mcq, yourAnswer: mcq.options[0], prompt: 'Correct! Now tell me a little more: why is that the answer? Use your own words.' } }),
  });
  await fireEvent.press(screen.getByTestId('skill-option-0'));
  await fireEvent.press(screen.getByTestId('skill-submit'));
  await waitFor(() => expect(screen.getByTestId('skill-clarification')).toBeTruthy());
  expect(screen.getByText('Your answer: The bicycle was two-tired.')).toBeTruthy();
});

test('hint: shown only after the server saved it', async () => {
  await open();
  mockApi.hint.mockResolvedValue({ questionId: mcq.id, hint: 'Look for a word that sounds like another word.' });
  await fireEvent.press(screen.getByTestId('skill-hint-btn'));
  await waitFor(() => expect(screen.getByText('Hint: Look for a word that sounds like another word.')).toBeTruthy());
  expect(mockApi.hint).toHaveBeenCalledWith('f1', 'pa-mcq-01');
});

test('AI timeout / failed save: a useful retry, the last saved state, and the inputs kept', async () => {
  await open();
  mockApi.answer.mockRejectedValue(new FollowupApiError("I couldn't check your explanation just now. Nothing has been saved yet — please try again.", 503, 'evaluation_unavailable'));
  await fireEvent.press(screen.getByTestId('skill-option-0'));
  await fireEvent.press(screen.getByTestId('skill-submit'));
  await waitFor(() => expect(screen.getByTestId('skill-action-error')).toBeTruthy());
  expect(screen.queryByTestId('skill-result')).toBeNull();
  expect(mockApi.session).toHaveBeenCalledTimes(2); // reloaded the saved state
  expect(screen.getByTestId('skill-option-0').props.accessibilityState).toMatchObject({ checked: true });
});

test('complete: Practice complete and Back to Test Report for the exact attempt', async () => {
  const onBack = jest.fn();
  mockApi.session.mockResolvedValue(session({ status: 'completed', question: null, complete: { title: 'Practice complete', body: 'You answered two new questions correctly on your own and explained your thinking.' } }));
  await render(<SkillPracticePanel followupId="f1" colors={COLORS} onBackToReport={onBack} />);
  await waitFor(() => expect(screen.getByText('Practice complete')).toBeTruthy());
  expect(screen.getByText('You answered two new questions correctly on your own and explained your thinking.')).toBeTruthy();
  await fireEvent.press(screen.getByText('Back to Test Report'));
  expect(onBack).toHaveBeenCalledWith('a1');
});

test('no fresh question: unavailable state, check left incomplete', async () => {
  await open({ question: null, unavailable: "I don't have another new question for this skill right now, so this check isn't finished yet." });
  expect(screen.getByTestId('skill-unavailable')).toBeTruthy();
  expect(screen.queryByTestId('skill-complete')).toBeNull();
});

test('a load failure offers a retry', async () => {
  mockApi.session.mockRejectedValueOnce(new FollowupApiError('Not found', 404)).mockResolvedValueOnce(session());
  await render(<SkillPracticePanel followupId="f1" colors={COLORS} onBackToReport={jest.fn()} />);
  await waitFor(() => expect(screen.getByTestId('skill-practice-load-error')).toBeTruthy());
  await fireEvent.press(screen.getByText('Try again'));
  await waitFor(() => expect(screen.getByTestId('skill-practice')).toBeTruthy());
});
