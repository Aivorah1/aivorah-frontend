import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { InteractiveQuizPreviewModal } from '../InteractiveQuizPreviewModal';

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));

// Website Redesign, Phase 4: the review toolbar from the board — breadcrumb,
// page title, Approve & Save / Open in Tab, an icon-only Close with its name,
// and the sun / moon switch within reach while review covers the navigation.
const quiz = (extra: any = {}) => ({
  title: 'Character Map of Dory',
  _normalized: true,
  _previewHTML: null,
  tasks: [{ tier: 'MUST DO', title: 'Task 1', questions: [{ id: 'a', question: 'Describe her appearance.', answer: '' }] }],
  ...extra,
});

beforeEach(() => {
  (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => '<html></html>', json: async () => ({}) });
});

test('Preview shows the breadcrumb, the page title and the review actions', async () => {
  await render(<InteractiveQuizPreviewModal quiz={quiz()} setQuiz={jest.fn()} onClose={jest.fn()} trail={['Assignments', 'New', 'Upload Worksheet']} />);
  expect(screen.getByTestId('quiz-review-trail')).toHaveTextContent('Assignments  ›  New  ›  Upload Worksheet  ›  Review');
  expect(screen.getByText('Preview Worksheet')).toBeTruthy();
  expect(screen.getByText('Review the uploaded worksheet, click the cards to try the questions.')).toBeTruthy();
  expect(screen.getByText('Approve & Save')).toBeTruthy();
  expect(screen.getByText('Open in Tab')).toBeTruthy();
  expect(screen.getByLabelText('Close')).toBeTruthy();
  expect(screen.getByTestId('portal-theme-switch')).toBeTruthy();
});

test('Edit shows the worksheet title and ends the breadcrumb with Edit', async () => {
  await render(<InteractiveQuizPreviewModal quiz={quiz({ _editMode: true })} setQuiz={jest.fn()} onClose={jest.fn()} trail={['Assignments', 'New', 'Upload Worksheet']} />);
  expect(screen.getByTestId('quiz-review-trail')).toHaveTextContent('Assignments  ›  New  ›  Upload Worksheet  ›  Edit');
  expect(screen.getByText('Character Map of Dory')).toBeTruthy();
  expect(screen.queryByText('Preview Worksheet')).toBeNull();
});
