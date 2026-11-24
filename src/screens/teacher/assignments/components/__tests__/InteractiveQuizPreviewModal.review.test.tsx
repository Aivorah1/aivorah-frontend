import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { InteractiveQuizPreviewModal } from '../InteractiveQuizPreviewModal';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
let mockWidth = 1280;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: mockWidth, height: 800, scale: 1, fontScale: 1 }),
}));

// Assignment Review (before publishing): one question per card with a
// numbered stepper, score pill, Check / Hint and Previous / Next.
const QUIZ = {
  title: 'Character Map of Dory & Dive into the Dictionary!',
  _previewHTML: '<html></html>',
  conversionReport: { overallStatus: 'COMPLETE', items: [] },
  tasks: [
    { title: 'Task 1: Character map', tier: 'MUST DO', questions: [
      { id: 'a', type: 'text', question: 'What colour is Dory?', answer: 'Blue', hint: 'Look at her scales.', imageUrl: 'https://img.test/dory.png' },
      { id: 'b', type: 'mcq', question: 'Dory is a…', options: ['shark', 'fish', 'whale'], answer: 'fish' },
    ] },
    { title: 'Task 2: Dictionary', tier: 'COULD DO', questions: [] },
  ],
};

beforeEach(() => {
  mockWidth = 1280;
  (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => '<html></html>', json: async () => ({}) });
});
afterEach(() => jest.restoreAllMocks());

test('title, meta line, stepper and one question card', async () => {
  await render(<InteractiveQuizPreviewModal quiz={QUIZ} setQuiz={jest.fn()} onClose={jest.fn()} meta={{ school: 'TSRA', grade: '8', subject: 'English' }} />);
  expect(screen.getByTestId('review-title')).toHaveTextContent('Character Map of Dory & Dive into the Dictionary!');
  expect(screen.getByTestId('review-meta')).toHaveTextContent('TSRA · Grade 8 · English');
  expect(screen.getByTestId('review-step-1')).toBeTruthy();
  expect(screen.getByTestId('review-step-3')).toBeTruthy(); // the empty task gets its own card
  expect(screen.getByTestId('review-score')).toHaveTextContent('0/2');
  expect(screen.getByTestId('review-question')).toHaveTextContent('a) What colour is Dory?');
  expect(screen.getByTestId('review-picture')).toBeTruthy();
  expect(screen.getByPlaceholderText('Type your answer here...')).toBeTruthy();
  // Laptop: every action is on the bar.
  for (const label of ['Preview', 'Edit', 'Refresh', 'Approve & Save', 'Close']) expect(screen.getByText(label)).toBeTruthy();
});

test('Check marks the answer and updates the score; Hint shows the hint', async () => {
  const user = userEvent.setup();
  await render(<InteractiveQuizPreviewModal quiz={QUIZ} setQuiz={jest.fn()} onClose={jest.fn()} />);
  await user.press(screen.getByTestId('review-hint'));
  expect(screen.getByTestId('review-hint-text')).toHaveTextContent('Look at her scales.');
  await user.type(screen.getByTestId('review-answer-input'), 'blue');
  await user.press(screen.getByTestId('review-check'));
  expect(screen.getByTestId('review-feedback-correct')).toBeTruthy();
  expect(screen.getByTestId('review-score')).toHaveTextContent('1/2');
});

test('Next / Previous move one card; a wrong option shows the right answer', async () => {
  const user = userEvent.setup();
  await render(<InteractiveQuizPreviewModal quiz={QUIZ} setQuiz={jest.fn()} onClose={jest.fn()} />);
  await user.press(screen.getByTestId('review-next'));
  expect(screen.getByTestId('review-question')).toHaveTextContent('b) Dory is a…');
  await user.press(screen.getByTestId('review-option-0'));
  await user.press(screen.getByTestId('review-check'));
  expect(screen.getByTestId('review-feedback-incorrect')).toHaveTextContent(/Answer: fish/);
  await user.press(screen.getByTestId('review-prev'));
  expect(screen.getByTestId('review-question')).toHaveTextContent('a) What colour is Dory?');
});

test('a task with no questions says so and offers Retry generation and Edit', async () => {
  const user = userEvent.setup();
  const onRegenerate = jest.fn();
  await render(<InteractiveQuizPreviewModal quiz={QUIZ} setQuiz={jest.fn()} onClose={jest.fn()} onRegenerate={onRegenerate} />);
  await user.press(screen.getByTestId('review-step-3'));
  expect(screen.getByTestId('review-missing')).toHaveTextContent(/No questions were generated for this task/);
  await user.press(screen.getByTestId('review-missing-retry'));
  expect(onRegenerate).toHaveBeenCalled();
});

test('a question with no answer key says so on Check', async () => {
  const user = userEvent.setup();
  const quiz = { ...QUIZ, tasks: [{ title: 'Task 1', questions: [{ question: 'Measure angle a', type: 'text', answer: null }] }] };
  await render(<InteractiveQuizPreviewModal quiz={quiz} setQuiz={jest.fn()} onClose={jest.fn()} />);
  await user.type(screen.getByTestId('review-answer-input'), '45');
  await user.press(screen.getByTestId('review-check'));
  expect(screen.getByTestId('review-feedback-no-key')).toBeTruthy();
  expect(screen.getByTestId('review-add-answer')).toBeTruthy();
});

test('mobile: Approve & Save stays on the bar, the rest move into the ⋯ menu', async () => {
  mockWidth = 390;
  const user = userEvent.setup();
  const onClose = jest.fn();
  await render(<InteractiveQuizPreviewModal quiz={QUIZ} setQuiz={jest.fn()} onClose={onClose} />);
  expect(screen.getByText('Approve & Save')).toBeTruthy();
  expect(screen.queryByText('Close')).toBeNull();
  await user.press(screen.getByTestId('review-more'));
  expect(screen.getByTestId('review-more-menu')).toBeTruthy();
  await user.press(screen.getByTestId('review-close-menu'));
  expect(onClose).toHaveBeenCalled();
});

test('when the pictures could not be read, the note says why and offers Retry', async () => {
  const user = userEvent.setup();
  const onRegenerate = jest.fn();
  const quiz = {
    ...QUIZ, visualUnderstandingAvailable: false,
    conversionReport: { overallStatus: 'REVIEW_REQUIRED', visionNote: 'The picture-reading AI could not be reached (Gemini was overloaded or timed out; Mistral is rate-limited), so this quiz was built from the worksheet\'s text only. Press Retry in a few minutes to read the pictures too.', items: [{ title: 'Task 2', status: 'REQUIRES_REVIEW', reason: 'x' }] },
  };
  await render(<InteractiveQuizPreviewModal quiz={quiz} setQuiz={jest.fn()} onClose={jest.fn()} onRegenerate={onRegenerate} />);
  expect(screen.getByTestId('quiz-preview-text-only-note')).toHaveTextContent(/Gemini was overloaded or timed out; Mistral is rate-limited/);
  await user.press(screen.getByTestId('review-notes-retry'));
  expect(onRegenerate).toHaveBeenCalled();
});
