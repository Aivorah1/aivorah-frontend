// The practice test with every question on one page: QuizScreen with the real
// useQuiz + QuizQuestionList + QuestionCard, against a mocked fetch. Covers the
// client's spec: all questions stacked as cards (number, text, MCQ tag, A-D),
// answered in any order, right/wrong colours and the explanation under each
// question, no re-answering, and the results once everything is answered.
// SpokenQuestion (browser speech) is stubbed: it has its own tests.

import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen, waitFor, userEvent, within } from '@testing-library/react-native';
import { clearQuizResults } from '../resultCache';
import QuizScreen from '../QuizScreen';
import { correctGreen } from '../components/QuestionCard';
import { darkColors } from '../../../../../theme';

jest.setTimeout(20000);

const mockColors = darkColors;
const GOLD = darkColors.accentYellow; // tapped, waiting for the result
const GREEN = correctGreen(true);        // right answer
const WRONG = '#C98A8A';              // wrong answer

jest.mock('../../../../../context/ThemeContext', () => ({
  useTheme: () => ({ colors: mockColors, isDark: true }),
}));

jest.mock('../../../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'a@a.com', role: 'student' } }),
}));

const mockCompleteLesson = jest.fn();
const mockRecordQuizResult = jest.fn();
jest.mock('../../../../../context/StudentDataContext', () => ({
  useStudentData: () => ({
    studentId: 'stu-1', completeLesson: mockCompleteLesson, addXP: jest.fn(),
    recordStudySeconds: jest.fn(), recordQuizResult: mockRecordQuizResult,
  }),
}));

jest.mock('../../../../../components/common/ScreenLayout', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: ({ children }: any) => <View>{children}</View> };
});

jest.mock('../../../../../components/common/Header', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ title, subtitle }: any) => <Text testID="header">{title} | {subtitle}</Text> };
});

jest.mock('../components/SpokenQuestion', () => {
  const { Text, TouchableOpacity } = require('react-native');
  return {
    __esModule: true,
    default: ({ setText, onSubmit }: any) => (
      <>
        <TouchableOpacity testID="spoken-say" onPress={() => setText('Tenali Rama used his wit to win hearts at court')}><Text>say</Text></TouchableOpacity>
        <TouchableOpacity testID="spoken-submit" onPress={onSubmit}><Text>submit</Text></TouchableOpacity>
      </>
    ),
  };
});

jest.mock('../components/QuizResult', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: (props: any) => <Text testID="quiz-result">score:{props.score}/{props.questions.length}</Text> };
});

const QUESTIONS = [
  { type: 'mcq', question: 'Which epic work was authored by King Krishnadeva Raya?', options: ['Jambavati Parinayam', 'Ashtadiggajas', 'Mahabharata', 'Ramayana'], correct: 0, hint: 'Think of his own Sanskrit play.', explanation: 'He wrote Jambavati Parinayam.' },
  { type: 'mcq', question: 'Q2 text', options: ['a2', 'b2', 'c2', 'd2'], correct: 1, hint: 'h2', explanation: 'e2' },
  { type: 'mcq', question: 'Q3 text', options: ['a3', 'b3', 'c3', 'd3'], correct: 2, hint: 'h3', explanation: 'e3' },
  { type: 'mcq', question: 'Q4 text', options: ['a4', 'b4', 'c4', 'd4'], correct: 3, hint: 'h4', explanation: 'e4' },
  { type: 'mcq', question: 'Q5 text', options: ['a5', 'b5', 'c5', 'd5'], correct: 0, hint: 'h5', explanation: 'e5' },
];

function jsonRes(data: any, ok = true) {
  return Promise.resolve({ ok, json: async () => data });
}

beforeEach(() => {
  clearQuizResults();
  jest.clearAllMocks();
  global.fetch = jest.fn((url: string) => {
    if (url.includes('/attempts')) return jsonRes({ attempts: [] });
    if (url.includes('/ibpyp/quiz')) return jsonRes({ questions: QUESTIONS });
    if (url.includes('/ibpyp/explain-wrong')) return jsonRes({ explanation: 'Krishnadeva Raya wrote Jambavati Parinayam, not the Mahabharata.' });
    if (url.includes('/ibpyp/evaluate-explanation')) {
      return jsonRes({ score: 8, outOf: 10, passed: true, verdict: 'good', covered: [], missing: [], mistakes: [], feedback: 'Nicely explained.' });
    }
    return jsonRes({});
  }) as any;
});

const route = { params: { topic: 'The Wit that Won Hearts', subject: 'English', grade: 'Grade 6', curriculum: 'CBSE' } };
const nav = () => ({ navigate: jest.fn(), openDrawer: jest.fn(), goBack: jest.fn() });
const rowStyle = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style);
const card = (i: number) => within(screen.getByTestId(`question-card-${i}`));

async function openTest(user: ReturnType<typeof userEvent.setup>) {
  await render(<QuizScreen navigation={nav()} route={route} />);
  await user.press(await screen.findByTestId('practice-take-test'));
  await screen.findByTestId('question-card-0');
}

test('shows every question at once, stacked in order, each in its own card', async () => {
  const user = userEvent.setup();
  await openTest(user);

  // 5 MCQs + the spoken question that ends every test = 6 cards
  for (let i = 0; i < 6; i++) expect(screen.getByTestId(`question-card-${i}`)).toBeTruthy();
  expect(screen.queryByTestId('question-card-6')).toBeNull();
  expect(screen.getByTestId('header').props.children.join('')).toBe('English Practice | The Wit that Won Hearts');
  expect(screen.getByTestId('answered-count').props.children.join('')).toBe('0 of 6 answered');

  // card 1: number, question, MCQ tag, options A-D
  expect(card(0).getByText('1')).toBeTruthy();
  expect(card(0).getByText('Which epic work was authored by King Krishnadeva Raya?')).toBeTruthy();
  expect(card(0).getByText('MCQ')).toBeTruthy();
  ['A', 'B', 'C', 'D'].forEach((l) => expect(card(0).getByText(l)).toBeTruthy());
  ['Jambavati Parinayam', 'Ashtadiggajas', 'Mahabharata', 'Ramayana'].forEach((o) => expect(card(0).getByText(o)).toBeTruthy());

  expect(card(4).getByText('5')).toBeTruthy();
  expect(card(4).getByText('Q5 text')).toBeTruthy();
  expect(card(5).getByText('Speak')).toBeTruthy();

  // nothing is locked: every option of every MCQ can be pressed
  for (let q = 0; q < 5; q++) {
    for (let o = 0; o < 4; o++) expect(screen.getByTestId(`option-${q}-${o}`).props.accessibilityState.disabled).toBe(false);
  }
  expect(screen.getByTestId('see-results').props.accessibilityState.disabled).toBe(true);
  expect(screen.getByText('Answer all 6 questions to see your results')).toBeTruthy();
});

test('answers in any order: right is highlighted, wrong is marked with the right one, explanation under that question', async () => {
  const user = userEvent.setup();
  await openTest(user);

  // Q3 first, right answer
  await user.press(screen.getByTestId('option-2-2'));
  await waitFor(() => expect(card(2).getByText(/Well done!/)).toBeTruthy());
  expect(card(2).getByText(/e3/)).toBeTruthy();
  expect(rowStyle('option-2-2').borderLeftColor).toBe(GREEN);
  expect(screen.getByTestId('answered-count').props.children.join('')).toBe('1 of 6 answered');

  // Q1: wrong (Mahabharata) -> hint + retry, then wrong again -> locked
  await user.press(screen.getByTestId('option-0-2'));
  expect(rowStyle('option-0-2').borderLeftColor).toBe(GOLD); // selected
  await waitFor(() => expect(card(0).getByText(/Aivorah's Hint/)).toBeTruthy(), { timeout: 3000 });
  expect(card(0).getByText('Think of his own Sanskrit play.')).toBeTruthy();
  await user.press(screen.getByTestId('option-0-3')); // Ramayana, wrong again
  await waitFor(() => expect(card(0).getByText(/Krishnadeva Raya wrote Jambavati Parinayam/)).toBeTruthy());
  expect(card(0).getByText(/Aivorah:/)).toBeTruthy();
  expect(rowStyle('option-0-3').borderLeftColor).toBe(WRONG);
  expect(rowStyle('option-0-0').borderLeftColor).toBe(GREEN); // the right answer is shown in green
  expect(screen.getByTestId('answered-count').props.children.join('')).toBe('2 of 6 answered');

  // answered questions are locked; the others are still open
  [0, 1, 2, 3].forEach((o) => {
    expect(screen.getByTestId(`option-0-${o}`).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId(`option-2-${o}`).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId(`option-1-${o}`).props.accessibilityState.disabled).toBe(false);
  });
  // unanswered cards show no feedback
  expect(screen.queryByTestId('explanation-1')).toBeNull();
  expect(screen.queryByTestId('explanation-4')).toBeNull();
});

test('See Results opens the results once every question is answered, with the score and lesson completion as before', async () => {
  const user = userEvent.setup();
  await openTest(user);

  // spoken one first, then the MCQs bottom-up, all right
  await user.press(screen.getByTestId('spoken-say'));
  await user.press(screen.getByTestId('spoken-submit'));
  await waitFor(() => expect(card(5).getByText(/Nicely explained/)).toBeTruthy());
  for (const [q, o] of [[4, 0], [3, 3], [2, 2], [1, 1]]) await user.press(screen.getByTestId(`option-${q}-${o}`));
  expect(screen.getByTestId('see-results').props.accessibilityState.disabled).toBe(true);
  await user.press(screen.getByTestId('option-0-0'));

  await waitFor(() => expect(screen.getByTestId('answered-count').props.children.join('')).toBe('6 of 6 answered'));
  expect(screen.getByTestId('see-results').props.accessibilityState.disabled).toBe(false);
  expect(screen.queryByTestId('quiz-result')).toBeNull(); // not until the student asks

  await user.press(screen.getByTestId('see-results'));
  expect(await screen.findByText('score:6/6')).toBeTruthy();
  expect(mockCompleteLesson).toHaveBeenCalledWith('The Wit that Won Hearts', 'English', 'Grade 6', 'CBSE');
  expect(mockRecordQuizResult).toHaveBeenCalledWith('The Wit that Won Hearts', 100, 'English');
  const attempt = (global.fetch as jest.Mock).mock.calls.find(([u]) => String(u).includes('/student/track-attempt'));
  expect(JSON.parse(attempt[1].body)).toMatchObject({ studentId: 'stu-1', totalQuestions: 6, correctAnswers: 6, score: 100 });
});
