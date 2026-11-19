/**
 * QuizModal + the "Why did you choose this?" reasoning box.
 *
 * Regression: QuizModal (and the learning-path useQuiz hook) once called
 * useRef() at the top of the file, outside any component. React throws on
 * that as soon as the component renders/loads, which took down the student
 * Assignments page. These tests render the REAL modal (the page test mocks it).
 */
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { QuizModal } from '../QuizModal';
import type { Assignment } from '../../types';

jest.mock('../../../../../context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}));
jest.mock('../../../../../context/StudentDataContext', () => ({
  useStudentData: () => ({ studentId: 'stu-1' }),
}));

const COLORS: any = {
  bgDark: '#000', cardDark: '#111', cardHover: '#222', sidebarDark: '#111', borderColor: '#333',
  textMain: '#fff', textMuted: '#888', textDim: '#666', accentYellow: '#fa0', accentGreen: '#0a0',
  accentRed: '#f00', accentCyan: '#0ff', accentPurple: '#a0f',
};

function quiz(requireReasoning: 'off' | 'optional' | 'required'): Assignment {
  return {
    id: 'a1', title: 'Fractions', subject: 'Mathematics', chapter: 'Numbers', type: 'quiz',
    dueDate: '2099-01-01', status: 'pending', requireReasoning,
    quizQuestions: [{ id: 'q1', question: 'What is 2+2?', type: 'mcq', options: ['Three', 'Four'], correct: 'Four' }],
  } as any;
}

const realFetch = global.fetch;
afterEach(() => { global.fetch = realFetch; jest.restoreAllMocks(); });

test('the hook files load without calling React hooks at module level', () => {
  expect(() => require('../../../learning-paths/quiz/hooks/useQuiz')).not.toThrow();
});

test('renders and shows no reasoning box when the teacher turned reasoning off', async () => {
  const user = userEvent.setup();
  await render(<QuizModal assignment={quiz('off')} colors={COLORS} onClose={jest.fn()} onSubmitted={jest.fn()} />);
  await user.press(screen.getByText('Four'));
  expect(screen.queryByText('Why did you choose this?')).toBeNull();
});

test('"required": submit is blocked until the answered question has a reason', async () => {
  const user = userEvent.setup();
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  global.fetch = jest.fn() as any;
  await render(<QuizModal assignment={quiz('required')} colors={COLORS} onClose={jest.fn()} onSubmitted={jest.fn()} />);

  await user.press(screen.getByText('Four'));
  expect(screen.getByText('Why did you choose this?')).toBeTruthy();
  await user.press(screen.getByText('Review & Submit'));
  await user.press(screen.getByText('Submit Quiz'));

  expect(alertSpy).toHaveBeenCalledWith('Explain your thinking', expect.stringContaining('question 1'));
  expect(global.fetch).not.toHaveBeenCalled();
});

test('"required": with a reason, the answer and reason are sent to the server', async () => {
  const user = userEvent.setup();
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ score: 100, aiFeedback: '{}' }) }) as any;
  const onSubmitted = jest.fn();
  await render(<QuizModal assignment={quiz('required')} colors={COLORS} onClose={jest.fn()} onSubmitted={onSubmitted} />);

  await user.press(screen.getByText('Four'));
  await user.type(screen.getByPlaceholderText(/Required: explain your thinking/), '2 and 2 make 4');
  await user.press(screen.getByText('Review & Submit'));
  await user.press(screen.getByText('Submit Quiz'));

  await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
  const submitCall = (global.fetch as jest.Mock).mock.calls.find(c => String(c[0]).includes('/assignments/a1/submit'));
  expect(JSON.parse(submitCall[1].body).quizAnswers).toEqual([{ answer: 'Four', reasoning: '2 and 2 make 4' }]);
});
