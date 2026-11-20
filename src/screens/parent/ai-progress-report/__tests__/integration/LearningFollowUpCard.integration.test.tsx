import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import LearningFollowUpCard, { followUpSummary } from '../../components/LearningFollowUpCard';

const mockParentChild = jest.fn();
jest.mock('../../../../student/learning-paths/practice-followup/services/practiceFollowupApi', () => ({
  followupApi: { parentChild: (id: string) => mockParentChild(id) },
}));

const COLORS: any = { accentGreen: '#5A8A70', accentYellow: '#B8860B', textMain: '#111', textMuted: '#666', borderColor: '#ddd', cardDark: '#fff' };
const done = {
  followupId: 'f1', topic: 'A Concrete Example', subject: 'English', skill: 'Puns and alliteration', skillLabel: 'Telling puns and alliteration apart',
  originalScore: 80, status: 'completed', outcome: 'Later answered two new questions independently and explained both answers.', outcomeLabel: 'Practice complete', updatedAt: '2026-11-20',
};

beforeEach(() => mockParentChild.mockReset());

test('shows the selected child’s saved follow-up in plain English', async () => {
  mockParentChild.mockResolvedValue({ childId: 'c1', hasAssessments: true, followups: [done] });
  await render(<LearningFollowUpCard childId="c1" childName="Anaya Rao" colors={COLORS} />);
  await waitFor(() => expect(screen.getByText('Puns and alliteration')).toBeTruthy());
  expect(screen.getByText('Learning Follow-up')).toBeTruthy();
  expect(screen.getByText('English · A Concrete Example')).toBeTruthy();
  expect(screen.getByText('Practice complete')).toBeTruthy();
  expect(mockParentChild).toHaveBeenCalledWith('c1');
  expect(followUpSummary(done as any)).toBe('Puns and alliteration · Topic test 80% · Later answered two new questions independently and explained both answers.');
});

test('linked child with no assessment evidence gets an honest empty state', async () => {
  mockParentChild.mockResolvedValue({ childId: 'c2', hasAssessments: false, followups: [] });
  await render(<LearningFollowUpCard childId="c2" childName="Dev" colors={COLORS} />);
  await waitFor(() => expect(screen.getByTestId('learning-followup-empty')).toBeTruthy());
  expect(screen.getByText("Dev hasn't taken a practice test yet, so there's nothing to follow up on.")).toBeTruthy();
});

test('no child selected renders nothing (the "Go to My Kids" state stays as it is)', async () => {
  await render(<LearningFollowUpCard childId={undefined} colors={COLORS} />);
  expect(screen.queryByTestId('learning-followup-card')).toBeNull();
  expect(mockParentChild).not.toHaveBeenCalled();
});
