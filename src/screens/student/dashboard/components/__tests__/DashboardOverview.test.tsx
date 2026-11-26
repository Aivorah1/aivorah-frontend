import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DashboardOverview } from '../DashboardOverview';
import { studentLightColors } from '../../../../../theme';

// The real context pulls in Firebase auth; the card only needs the level label.
jest.mock('../../../../../context/StudentDataContext', () => ({ formatLevel: (l: number) => `Level ${l}` }));

const goals = [
  { label: 'Study Time', val: '1h', target: '1h', pct: 1 },
  { label: 'Chapters', val: '2 / 5', target: '5 chapters', pct: 0.4 },
  { label: 'XP Earned', val: '4,000', target: '4,000 XP', pct: 1 },
];
const week = ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'].map((label, i) => ({ label, xp: i * 20 }));
const ref = { subject: 'English', chapter: { chapterNo: 3, title: 'A Tiger in the Zoo' }, topic: { name: 'A Tiger in the Zoo: Part 1' } };

function setup(over: Partial<React.ComponentProps<typeof DashboardOverview>> = {}) {
  const props: React.ComponentProps<typeof DashboardOverview> = {
    colors: studentLightColors,
    isDark: false,
    goals,
    masteryLine: '2 of 5 chapters mastered. Keep going!',
    stats: { level: 3, currentStreak: 4, xpPoints: 2480, todayXP: 120 },
    levelProgress: { current: 80, needed: 200 },
    maxLevel: 10,
    weekXP: week,
    resume: null,
    cta: null,
    ...over,
  };
  return render(<DashboardOverview {...props} />);
}

describe('DashboardOverview (Website Redesign, Phase 3)', () => {
  test('shows the three cards with live goal, XP and level figures', async () => {
    await setup();
    expect(screen.getByText('Study Goal')).toBeTruthy();
    expect(screen.getByText('2 of 3 completed')).toBeTruthy();
    expect(screen.getAllByLabelText('Done')).toHaveLength(2);
    expect(screen.getAllByLabelText('Not done yet')).toHaveLength(1);
    expect(screen.getByText('2,480 XP')).toBeTruthy();
    expect(screen.getByText('+120 XP today')).toBeTruthy();
    expect(screen.getByText('4 day streak')).toBeTruthy();
    expect(screen.getByText('120 more XP to Level 4')).toBeTruthy();
    expect(screen.getByText('Resume')).toBeTruthy();
    expect(screen.getByText('Continue where you left off.')).toBeTruthy();
    expect(screen.getByLabelText(/XP over the last 7 days: Thu 0, .* Wed 120/)).toBeTruthy();
  });

  test('the Resume card opens the lesson the student left off at', async () => {
    const onOpen = jest.fn();
    await setup({ resume: { ref, onOpen } });
    expect(screen.getByText('English · Chapter 3')).toBeTruthy();
    expect(screen.getByText('A Tiger in the Zoo')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('overview-resume-lesson'));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('overview-cta')).toBeNull();
  });

  test('with nothing started, the Resume card offers Start Learning', async () => {
    const onPress = jest.fn();
    await setup({ cta: { label: 'Start Learning', icon: 'play', onPress } });
    expect(screen.queryByTestId('overview-resume-lesson')).toBeNull();
    await fireEvent.press(screen.getByText('Start Learning'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('at the grade XP cap the level line says so', async () => {
    await setup({ stats: { level: 10, currentStreak: 0, xpPoints: 4000, todayXP: 0 } });
    expect(screen.getByText('Max level reached for this grade!')).toBeTruthy();
  });
});
