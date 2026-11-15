import React from 'react';
import { render, screen, waitFor, userEvent } from '@testing-library/react-native';
import CurrentAffairsAdminScreen from '../../CurrentAffairsAdminScreen';

jest.mock('../../../../../context/ThemeContext', () => ({
  useTheme: () => ({ isDark: false, colors: { primary: '#5E7566', accentGreen: '#5E7566', accentYellow: '#c90', accentRed: '#e33', textDim: '#999', textMain: '#111', textMuted: '#666', borderColor: '#ddd', cardDark: '#fff', bgDark: '#fafafa' } }),
}));
jest.mock('../../../../../components/common/Header', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ title }: any) => <Text>{title}</Text> };
});
jest.mock('../../../../../components/common/ScreenLayout', () => ({ __esModule: true, default: ({ children }: any) => children }));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('../../services/currentAffairsAdminService', () => ({
  listStories: jest.fn(), getStory: jest.fn(), createStory: jest.fn(), updateStory: jest.fn(), setStoryStatus: jest.fn(),
  listQuizWeeks: jest.fn(), getQuiz: jest.fn(), updateQuestion: jest.fn(), addQuestion: jest.fn(), setQuestionStatus: jest.fn(),
  publishQuiz: jest.fn(), getAnalytics: jest.fn(), bulkSetStoryStatus: jest.fn(), getPipelineLastRun: jest.fn(),
}));
import * as api from '../../services/currentAffairsAdminService';
const mocked = api as jest.Mocked<typeof api>;

const AGES = ['kid', 'teen'];
const PARTS = ['title', 'summary', 'what_happened', 'why_important'];
const story = (over: any = {}) => {
  const s: any = {
    id: 's1', category: 'science', publish_date: '2026-11-14', status: 'review', priority: 10,
    source: 'NASA', source_url: 'https://www.nasa.gov/x', review_notes: 'names not in source: Artemis', is_true_fact: false,
    reviewed_by: null, reviewed_at: null, did_you_know: 'A fact.', think_about_it: 'Why?',
    new_word_1: 'Orbit', def_1: 'A path.', new_word_2: null, def_2: null, new_word_3: null, def_3: null, image_url: null,
  };
  for (const p of PARTS) for (const a of AGES) s[`${p}_${a}`] = `${p} ${a}`;
  s.title_kid = 'NASA tests a new rocket';
  return { ...s, ...over };
};
const question = (n: number, over: any = {}) => ({
  id: `q${n}`, week_start: '2026-11-08', age_group: '7-12', category: 'india', question_type: 'mcq',
  question: `Question ${n}?`, options: ['A', 'B', 'C', 'D'], correct_index: 0, explanation: 'Because.', extra_fact: null,
  status: 'review', position: n, review_notes: null, ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  mocked.listStories.mockResolvedValue([story()]);
  mocked.getStory.mockResolvedValue(story());
  mocked.listQuizWeeks.mockResolvedValue({ currentWeek: '2026-11-08', weeks: [] });
  mocked.getQuiz.mockResolvedValue([question(1, { story_id: 'st1', story_title: 'NASA tests a new rocket' }), question(2)]);
  mocked.getPipelineLastRun.mockResolvedValue(null);
});

test('the review queue shows waiting stories with their check notes', async () => {
  await render(<CurrentAffairsAdminScreen />);
  expect(await screen.findByText('NASA tests a new rocket')).toBeTruthy();
  expect(screen.getByText('names not in source: Artemis')).toBeTruthy();
  expect(mocked.listStories).toHaveBeenCalledWith('review');
});

describe('review queue: bulk publish', () => {
  const queue = () => [
    story({ id: 's1', review_notes: 'AUTO: VERIFIED', title_kid: 'Verified one', what_happened_kid: 'a b c', what_happened_teen: 'a b c d e' }),
    story({ id: 's2', review_notes: 'AUTO: CHECK - check the figure against the RBI page.', title_kid: 'Needs a check' }),
    story({ id: 's3', review_notes: 'AUTO: VERIFIED', title_kid: 'Verified two' }),
  ];

  test('shows each story’s check result, word counts and the last automatic run', async () => {
    mocked.listStories.mockResolvedValue(queue());
    mocked.getPipelineLastRun.mockResolvedValue({ at: '2026-11-14T00:31:00Z', date: '2026-11-14', saved: 6, verified: 4 });
    await render(<CurrentAffairsAdminScreen />);
    expect(await screen.findByTestId('ca-story-verified-s1')).toBeTruthy();
    expect(screen.getByTestId('ca-story-autocheck-s2')).toBeTruthy();
    expect(screen.getByText('AUTO: CHECK - check the figure against the RBI page.')).toBeTruthy();
    expect(screen.getByTestId('ca-story-counts-s1').props.children.join('')).toBe('7–12: 3 words · 13–15: 5 words · Source:');
    expect(await screen.findByText(/^Last auto run: .* · 6 saved · 4 verified$/)).toBeTruthy();
  });

  test('select all verified, confirm, and they are published as today’s digest', async () => {
    const user = userEvent.setup();
    mocked.listStories.mockResolvedValue(queue());
    mocked.bulkSetStoryStatus.mockResolvedValue({ updated: 2, results: [{ id: 's1', ok: true }, { id: 's3', ok: true }] });
    await render(<CurrentAffairsAdminScreen />);
    await user.press(await screen.findByTestId('ca-select-verified'));
    expect(screen.getByText('2 selected')).toBeTruthy();
    await user.press(screen.getByTestId('ca-publish-selected'));
    expect(screen.getByTestId('ca-publish-confirm')).toBeTruthy();
    expect(mocked.bulkSetStoryStatus).not.toHaveBeenCalled(); // nothing before confirming
    await user.press(screen.getByTestId('ca-publish-confirm-yes'));
    await waitFor(() => expect(mocked.bulkSetStoryStatus).toHaveBeenCalledWith(['s1', 's3'], 'published', 'today'));
    expect(await screen.findByText('Published 2 stories.')).toBeTruthy();
  });

  test('cancel publishes nothing; reject selected rejects the ticked stories', async () => {
    const user = userEvent.setup();
    mocked.listStories.mockResolvedValue(queue());
    mocked.bulkSetStoryStatus.mockResolvedValue({ updated: 1, results: [{ id: 's2', ok: true }] });
    await render(<CurrentAffairsAdminScreen />);
    await user.press(await screen.findByTestId('ca-story-check-s2'));
    await user.press(screen.getByTestId('ca-publish-selected'));
    await user.press(screen.getByTestId('ca-publish-confirm-no'));
    expect(screen.queryByTestId('ca-publish-confirm')).toBeNull();
    await user.press(screen.getByTestId('ca-reject-selected'));
    await waitFor(() => expect(mocked.bulkSetStoryStatus).toHaveBeenCalledWith(['s2'], 'rejected', undefined));
    expect(mocked.bulkSetStoryStatus).toHaveBeenCalledTimes(1);
  });
});

test('an editor fixes a story and publishes it', async () => {
  const user = userEvent.setup();
  mocked.updateStory.mockImplementation(async (_id, fields) => story(fields));
  mocked.setStoryStatus.mockResolvedValue(story({ title_kid: 'NASA tests its Artemis rocket', status: 'published', reviewed_by: 'admin@aivorah.ai' }));
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-story-row-s1'));
  const title = await screen.findByTestId('ca-story-title_kid');
  await user.clear(title);
  await user.type(title, 'NASA tests its Artemis rocket');
  await user.press(screen.getByTestId('ca-story-publish'));

  await waitFor(() => expect(mocked.setStoryStatus).toHaveBeenCalledWith('s1', 'published'));
  expect(mocked.updateStory).toHaveBeenCalledWith('s1', expect.objectContaining({ title_kid: 'NASA tests its Artemis rocket', category: 'science', priority: 10 }));
  expect(await screen.findByText('Published: students can read it now.')).toBeTruthy();
  expect(mocked.listStories).toHaveBeenCalledTimes(2); // the list refreshes
});

test('a new story shows the server\'s error when a part is missing', async () => {
  const user = userEvent.setup();
  mocked.createStory.mockRejectedValue(new Error('why_important_teen is required'));
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-story-new'));
  await user.type(await screen.findByTestId('ca-story-title_kid'), 'My story');
  await user.press(screen.getByTestId('ca-story-save'));
  expect(await screen.findByText('why_important_teen is required')).toBeTruthy();
  expect(mocked.createStory).toHaveBeenCalledWith(expect.objectContaining({ title_kid: 'My story', category: 'india' }));
});

test('the editor counts words as you type and warns outside the target, without blocking save', async () => {
  const user = userEvent.setup();
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-story-row-s1'));
  // The fixture's texts are 2 words long: both versions warn.
  expect(await screen.findByText('2 words; aim for 50-80.')).toBeTruthy();
  expect(screen.getByText('2 words; aim for 100-150.')).toBeTruthy();
  const kid = screen.getByTestId('ca-story-what_happened_kid');
  await user.clear(kid);
  await user.type(kid, Array.from({ length: 60 }, (_, i) => `w${i}`).join(' '));
  expect(await screen.findByText('60 words (aim for 50-80)')).toBeTruthy();
  expect(screen.getByTestId('ca-story-save').props.accessibilityState?.disabled).toBeFalsy();
});

test('a picture link that is not https gets a note', async () => {
  const user = userEvent.setup();
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-story-row-s1'));
  await user.type(await screen.findByTestId('ca-story-image_url'), 'http://x.in/a.jpg');
  expect(await screen.findByTestId('ca-story-image-warning')).toBeTruthy();
});

test("the weekly quiz: edit a question's right answer, then publish the week", async () => {
  const user = userEvent.setup();
  mocked.updateQuestion.mockImplementation(async (id, fields) => question(2, { ...fields, id }));
  mocked.publishQuiz.mockResolvedValue({ published: 2 });
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-tab-quiz'));
  expect(await screen.findByText('From the story: NASA tests a new rocket')).toBeTruthy();

  expect(await screen.findByText('Week of 2026-11-08 (this week)')).toBeTruthy();
  expect(screen.getByTestId('ca-quiz-summary').props.children).toBe('2 questions · 0 published · 2 waiting for review');
  await user.press(screen.getByTestId('ca-q-q2-correct-2'));
  await user.press(screen.getByTestId('ca-q-q2-save'));
  await waitFor(() => expect(mocked.updateQuestion).toHaveBeenCalledWith('q2', expect.objectContaining({ correct_index: 2, options: ['A', 'B', 'C', 'D'] })));

  await user.press(screen.getByTestId('ca-quiz-publish'));
  await waitFor(() => expect(mocked.publishQuiz).toHaveBeenCalledWith('2026-11-08', '7-12'));
  expect(await screen.findByText('Published 2 questions: students can play the quiz now.')).toBeTruthy();

  await user.press(screen.getByTestId('ca-quiz-prev'));
  await waitFor(() => expect(mocked.getQuiz).toHaveBeenLastCalledWith('2026-11-01', '7-12'));
});

test('insights show the metrics, with a dash where there is no data yet', async () => {
  const user = userEvent.setup();
  const m = (value: number | null, unit: string) => ({ value, unit });
  mocked.getAnalytics.mockResolvedValue({
    range: { from: '2026-10-16', to: '2026-11-14', days: 30, ageGroup: 'all' },
    activeStudents: 42,
    metrics: {
      digestCompletionRate: m(61.5, '%'), avgReadingSeconds: m(48, 's'), avgMinutesPerDay: m(4.2, 'min'),
      quizParticipation: m(35, '%'), quizAccuracy: m(72.4, '%'), retention30: m(null, '%'),
      dailyActiveReaders: m(12.3, 'students'), avgStreak: m(2.5, 'days'),
    },
    daily: [{ date: '2026-11-14', readers: 9, storiesRead: 30, digestsCompleted: 5 }],
  } as any);
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-tab-insights'));

  expect(await screen.findByText('61.5%')).toBeTruthy();
  expect(screen.getByText('48 s')).toBeTruthy();
  expect(screen.getByText('4.2 min')).toBeTruthy();
  expect(screen.getByText('—')).toBeTruthy(); // retention: no earlier month yet
  expect(screen.getByTestId('ca-day-2026-11-14')).toBeTruthy();

  await user.press(screen.getByTestId('ca-insights-age-7-12'));
  await waitFor(() => expect(mocked.getAnalytics).toHaveBeenLastCalledWith(expect.any(String), expect.any(String), '7-12'));
});
