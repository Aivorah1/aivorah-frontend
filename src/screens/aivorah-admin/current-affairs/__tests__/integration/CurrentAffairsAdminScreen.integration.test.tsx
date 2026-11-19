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
  listStories: jest.fn(), getStory: jest.fn(), createStory: jest.fn(), updateStory: jest.fn(), updateStoryOptimistic: jest.fn(), setStoryStatus: jest.fn(),
  listQuizWeeks: jest.fn(), getQuiz: jest.fn(), updateQuestion: jest.fn(), addQuestion: jest.fn(), setQuestionStatus: jest.fn(),
  publishQuiz: jest.fn(), getAnalytics: jest.fn(), bulkStoryStatus: jest.fn(), getStoryHistory: jest.fn(), regenerateStory: jest.fn(),
}));
import * as api from '../../services/currentAffairsAdminService';
import { addDays, indiaToday } from '../../utils/dates';
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
  mocked.getQuiz.mockResolvedValue([question(1), question(2)]);
});

test('the review queue shows waiting stories with their check notes', async () => {
  await render(<CurrentAffairsAdminScreen />);
  expect(await screen.findByText('NASA tests a new rocket')).toBeTruthy();
  expect(screen.getByText('names not in source: Artemis')).toBeTruthy();
  expect(mocked.listStories).toHaveBeenCalledWith('review');
});

test('an editor fixes a story and publishes it', async () => {
  const user = userEvent.setup();
  mocked.updateStoryOptimistic.mockImplementation(async (_id, fields) => story(fields));
  mocked.setStoryStatus.mockResolvedValue(story({ title_kid: 'NASA tests its Artemis rocket', status: 'published', reviewed_by: 'admin@aivorah.ai' }));
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-story-row-s1'));
  const title = await screen.findByTestId('ca-story-title_kid');
  await user.clear(title);
  await user.type(title, 'NASA tests its Artemis rocket');
  await user.press(screen.getByTestId('ca-story-publish'));

  await waitFor(() => expect(mocked.setStoryStatus).toHaveBeenCalledWith('s1', 'published'));
  expect(mocked.updateStoryOptimistic).toHaveBeenCalledWith('s1', expect.objectContaining({ title_kid: 'NASA tests its Artemis rocket', category: 'science', priority: 10 }));
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

test("the weekly quiz: edit a question's right answer, then publish the week", async () => {
  const user = userEvent.setup();
  mocked.updateQuestion.mockImplementation(async (id, fields) => question(2, { ...fields, id }));
  mocked.publishQuiz.mockResolvedValue({ published: 2 });
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-tab-quiz'));

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

test('a rejected story cannot be published: no Publish button, a note instead', async () => {
  const user = userEvent.setup();
  mocked.listStories.mockResolvedValue([story({ status: 'rejected' })]);
  mocked.getStory.mockResolvedValue(story({ status: 'rejected' }));
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-story-row-s1'));
  expect(await screen.findByTestId('ca-story-rejected-note')).toBeTruthy();
  expect(screen.queryByTestId('ca-story-publish')).toBeNull();
  expect(mocked.setStoryStatus).not.toHaveBeenCalled();
});

// ── Phase 2: tomorrow's digest, approve all, scheduled, history ──────────────
const TODAY = indiaToday();
const TOMORROW = addDays(TODAY, 1);

test("To review groups stories by day; Approve all asks once, then approves that day's digest", async () => {
  const user = userEvent.setup();
  mocked.listStories.mockResolvedValue([
    story({ id: 'a', publish_date: TOMORROW, title_kid: 'Story A' }),
    story({ id: 'b', publish_date: TOMORROW, title_kid: 'Story B' }),
  ]);
  mocked.bulkStoryStatus.mockResolvedValue([
    { id: 'a', ok: true, status: 'published', publish_date: TOMORROW },
    { id: 'b', ok: true, status: 'published', publish_date: TOMORROW },
  ]);
  await render(<CurrentAffairsAdminScreen />);
  expect(await screen.findByText(`For Tomorrow · ${TOMORROW} · 2 stories`)).toBeTruthy();
  await user.press(screen.getByTestId(`ca-approve-day-${TOMORROW}`));
  expect(mocked.bulkStoryStatus).not.toHaveBeenCalled(); // asks first
  await user.press(screen.getByTestId(`ca-approve-confirm-${TOMORROW}`));
  await waitFor(() => expect(mocked.bulkStoryStatus).toHaveBeenCalledWith(['a', 'b'], 'published'));
  expect((await screen.findByTestId('ca-bulk-message')).props.children).toBe(`Approved 2 stories for ${TOMORROW} (scheduled for tomorrow).`);
});

test('a day that has passed cannot be approved from the list', async () => {
  mocked.listStories.mockResolvedValue([story({ id: 'old', publish_date: addDays(TODAY, -2) })]);
  await render(<CurrentAffairsAdminScreen />);
  expect(await screen.findByText(/This day has passed/)).toBeTruthy();
  expect(screen.queryByTestId(`ca-approve-day-${addDays(TODAY, -2)}`)).toBeNull();
});

test('stories that could not be approved are listed with the reason', async () => {
  const user = userEvent.setup();
  mocked.listStories.mockResolvedValue([story({ id: 'a', publish_date: TODAY }), story({ id: 'b', publish_date: TODAY })]);
  mocked.bulkStoryStatus.mockResolvedValue([
    { id: 'a', ok: true, status: 'published', publish_date: TODAY },
    { id: 'b', ok: false, reason: 'not waiting for review (it is rejected)' },
  ]);
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId(`ca-approve-day-${TODAY}`));
  await user.press(screen.getByTestId(`ca-approve-confirm-${TODAY}`));
  expect((await screen.findByTestId('ca-bulk-message')).props.children).toBe(`Approved 1 story for ${TODAY} (live now).`);
  expect(screen.getByTestId('ca-bulk-error').props.children).toBe('1 not approved: not waiting for review (it is rejected)');
});

test('Published shows which stories are live today and which are scheduled', async () => {
  const user = userEvent.setup();
  mocked.listStories.mockImplementation(async (status?: string) => (status === 'published'
    ? [story({ id: 'later', status: 'published', publish_date: TOMORROW }), story({ id: 'now', status: 'published', publish_date: TODAY })]
    : []) as any);
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByText('Published'));
  expect((await screen.findByTestId('ca-story-when-later')).props.children).toBe('Scheduled · students see it tomorrow');
  expect(screen.getByTestId('ca-story-when-now').props.children).toBe('Live today');
});

test('approving a story for tomorrow says it is scheduled, not live', async () => {
  const user = userEvent.setup();
  mocked.getStory.mockResolvedValue(story({ publish_date: TOMORROW }));
  mocked.updateStoryOptimistic.mockImplementation(async (_id, fields) => story(fields));
  mocked.setStoryStatus.mockResolvedValue(story({ status: 'published', publish_date: TOMORROW }));
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-story-row-s1'));
  await user.press(await screen.findByTestId('ca-story-publish'));
  expect((await screen.findByTestId('ca-story-message')).props.children).toBe(`Approved. Scheduled · students see it tomorrow (${TOMORROW}).`);
});

test('the approval history lists who did what; says so when history is not switched on', async () => {
  const user = userEvent.setup();
  mocked.getStoryHistory.mockResolvedValueOnce({ available: true, entries: [
    { id: 2, actor: 'admin@aivorah.ai', action: 'story.published', before: null, after: null, detail: `Approved, scheduled: students see it on ${TOMORROW}`, created_at: '2026-11-19T10:00:00Z' },
    { id: 1, actor: 'pipeline', action: 'story.collected', before: null, after: null, detail: 'Collected from The Hindu', created_at: '2026-11-19T01:00:00Z' },
  ] });
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-story-row-s1'));
  await user.press(await screen.findByTestId('ca-story-history-toggle'));
  expect(await screen.findByText(/Approved · admin@aivorah.ai/)).toBeTruthy();
  expect(screen.getByText(/Collected by the news pipeline · pipeline/)).toBeTruthy();
  expect(mocked.getStoryHistory).toHaveBeenCalledWith('s1');

  mocked.getStoryHistory.mockResolvedValueOnce({ available: false, entries: [] });
  await user.press(screen.getByTestId('ca-story-history-toggle')); // hide
  await user.press(screen.getByTestId('ca-story-history-toggle')); // show again: reloads
  expect(await screen.findByText(/History is not switched on yet/)).toBeTruthy();
});

// ── Phase 3: rewrite from source; two editors ─────────────────────────────────
test('Rewrite from source sends the editor request and shows the rewritten story', async () => {
  const user = userEvent.setup();
  mocked.regenerateStory.mockResolvedValue(story({ title_kid: 'Rewritten title', review_notes: 'AUTO: REGENERATED - VERIFIED' }));
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-story-row-s1'));
  await user.type(await screen.findByTestId('ca-story-rewrite-request'), 'Simpler words');
  await user.press(screen.getByTestId('ca-story-rewrite'));
  await waitFor(() => expect(mocked.regenerateStory).toHaveBeenCalledWith('s1', 'Simpler words'));
  expect((await screen.findByTestId('ca-story-message')).props.children).toMatch(/Rewritten from the source/);
  expect(screen.getByTestId('ca-story-title_kid').props.value).toBe('Rewritten title');
  expect(mocked.setStoryStatus).not.toHaveBeenCalled(); // never approves by itself
});

test('Rewrite refuses to replace unsaved edits', async () => {
  const user = userEvent.setup();
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-story-row-s1'));
  await user.type(await screen.findByTestId('ca-story-title_kid'), ' (edited)');
  await user.press(screen.getByTestId('ca-story-rewrite'));
  expect((await screen.findByTestId('ca-story-error')).props.children).toMatch(/Save your changes first/);
  expect(mocked.regenerateStory).not.toHaveBeenCalled();
});

test('no Rewrite for a published story', async () => {
  const user = userEvent.setup();
  mocked.getStory.mockResolvedValue(story({ status: 'published', publish_date: TODAY }));
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-story-row-s1'));
  expect(await screen.findByTestId('ca-story-save')).toBeTruthy();
  expect(screen.queryByTestId('ca-story-rewrite')).toBeNull();
});

test('no Rewrite for a story without a source link', async () => {
  const user = userEvent.setup();
  mocked.getStory.mockResolvedValue(story({ source_url: null }));
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-story-row-s1'));
  expect(await screen.findByTestId('ca-story-save')).toBeTruthy();
  expect(screen.queryByTestId('ca-story-rewrite')).toBeNull();
});

test('if another editor saved first, the editor is told to reload (nothing is overwritten)', async () => {
  const user = userEvent.setup();
  mocked.updateStoryOptimistic.mockRejectedValue(new Error('This story was edited by someone else after you opened it. Reload to see their changes, then try again.'));
  await render(<CurrentAffairsAdminScreen />);
  await user.press(await screen.findByTestId('ca-story-row-s1'));
  await user.press(await screen.findByTestId('ca-story-save'));
  expect((await screen.findByTestId('ca-story-error')).props.children).toMatch(/edited by someone else/);
});
