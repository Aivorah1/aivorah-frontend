import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { renderLearningPathModal } from '../../components/modals/LearningPathModals';

const TILE = { icon: 'book-open', color: '#FFD700', stat: '1', label: 'Struggling', title: 'Need Support', body: 'x' };
const COLORS: any = { textDim: '#999', textMain: '#fff', textMuted: '#aaa', borderColor: '#222' };

function baseCtx(overrides: any = {}) {
  return {
    tile: TILE, students: [], allNeedsAttention: [], assignStats: [], challStats: [],
    classAvgScore: null, studentsWithSubmissions: 0, studentsWithChallenges: 0,
    studentsCompletedChallenge: 0, totalStudyMins: 0, styles: {}, colors: COLORS,
    onClose: jest.fn(),
    ...overrides,
  };
}

describe('renderLearningPathModal — case 0 (Struggling)', () => {
  test('empty allNeedsAttention shows the "no students need support" empty state', async () => {
    await render(<>{renderLearningPathModal(0, baseCtx())}</>);
    expect(screen.getByText('No students need support right now!')).toBeTruthy();
  });

  test('without topic-help data, lists inactive students with the Inactive reason', async () => {
    const students = [{ id: 's1', name: 'Bela Rao', progressPct: 15 }, { id: 's2', name: 'Aarav Sharma', progressPct: 5 }];
    await render(<>{renderLearningPathModal(0, baseCtx({ allNeedsAttention: students }))}</>);
    expect(screen.getByText('2 Students')).toBeTruthy();
    expect(screen.getAllByText('Inactive')).toHaveLength(2);
  });

  test('shows Student / Reason rows, both reasons for one student, and opens the progress view for the skill', async () => {
    const onViewProgress = jest.fn();
    const needSupport = [
      { student: { id: 'k', name: 'Kiran Rao', grade: 'Grade 8' }, reasons: [{ kind: 'topic_help', label: 'Needs topic help', detail: 'Puns and alliteration · repeated difficulty', skillId: 'en.figurative.pun-vs-alliteration' }] },
      { student: { id: 'd', name: 'Dev Shah', grade: 'Grade 8' }, reasons: [{ kind: 'inactive', label: 'Inactive', detail: 'No learning activity for 8 days' }] },
    ];
    await render(<>{renderLearningPathModal(0, baseCtx({ needSupport, onViewProgress }))}</>);
    expect(screen.getByText('Need Support (2)')).toBeTruthy();
    expect(screen.getByText('Student')).toBeTruthy();
    expect(screen.getByText('Reason')).toBeTruthy();
    expect(screen.getByText('Kiran')).toBeTruthy();
    expect(screen.getByText('No learning activity for 8 days')).toBeTruthy();
    fireEvent.press(screen.getByTestId('view-student-progress'));
    expect(onViewProgress).toHaveBeenCalledWith('k', 'en.figurative.pun-vs-alliteration');
  });
});

describe('renderLearningPathModal — case 1 (Top Performers)', () => {
  test('ranks students by progress descending, with per-subject column headers when scoped', async () => {
    const students = [
      { id: 's1', name: 'Aarav Sharma', progressPct: 80, scopedSubjects: ['Mathematics'], completedTopicsDetailed: [{ topic: 'Fractions', subject: 'Mathematics' }] },
      { id: 's2', name: 'Bela Rao', progressPct: 40, scopedSubjects: ['Mathematics'], completedTopicsDetailed: [] },
    ];
    await render(<>{renderLearningPathModal(1, baseCtx({ students }))}</>);
    expect(screen.getByText('Mathematics')).toBeTruthy(); // subject column header
    expect(screen.getByText('80%')).toBeTruthy();
  });

  test('with no scoped subjects, falls back to combined Today/Total columns', async () => {
    const students = [{ id: 's1', name: 'Aarav', progressPct: 50, scopedSubjects: [], learningPathTime: 30, learningPathTimeToday: 5 }];
    await render(<>{renderLearningPathModal(1, baseCtx({ students }))}</>);
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
  });
});

describe('renderLearningPathModal — case 2 (Inactive)', () => {
  test('filters to students inactive 3+ days and shows "Never" for one with no lastActive at all', async () => {
    const students = [
      { id: 's1', name: 'Aarav', lastActive: null, progressPct: 10 },
      { id: 's2', name: 'Bela', lastActive: new Date().toISOString(), progressPct: 90 }, // active today, excluded
    ];
    await render(<>{renderLearningPathModal(2, baseCtx({ students }))}</>);
    expect(screen.getByText('1 Students')).toBeTruthy();
    expect(screen.getByText('Never')).toBeTruthy();
  });

  test('shows a real "Nd ago" for inactive students with genuine, dated lastActive values, sorted oldest-active-date first', async () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString();
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();
    // 2+ students so the real sort comparator actually runs (Array.sort skips
    // it entirely for single-element arrays).
    const students = [
      { id: 's1', name: 'Aarav', lastActive: fiveDaysAgo, progressPct: 10 },
      { id: 's2', name: 'Bela', lastActive: tenDaysAgo, progressPct: 20 },
    ];
    await render(<>{renderLearningPathModal(2, baseCtx({ students }))}</>);
    expect(screen.getByText('5d ago')).toBeTruthy();
    expect(screen.getByText('10d ago')).toBeTruthy();
  });
});

describe('renderLearningPathModal — case 3 (Study Time)', () => {
  test('ranks students by learningPathTime descending', async () => {
    const students = [
      { id: 's1', name: 'Aarav', learningPathTime: 100, progressPct: 50 },
      { id: 's2', name: 'Bela', learningPathTime: 20, progressPct: 30 },
    ];
    await render(<>{renderLearningPathModal(3, baseCtx({ students, totalStudyMins: 120 }))}</>);
    expect(screen.getByText('2h')).toBeTruthy(); // formatStudyTime(120)
  });
});

test('an unknown tileIndex returns null, not a crash', async () => {
  const result = renderLearningPathModal(99, baseCtx());
  expect(result).toBeNull();
});
