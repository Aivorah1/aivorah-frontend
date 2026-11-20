// AI Teacher screen: the page on entry (avatar, India-time greeting, one
// Start button, no typing), a spoken lesson revealing the board in step with
// the narration, a practice question with its timer and feedback, and Stop /
// leaving the screen turning the microphone off while keeping the board.
import React from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react-native';
import AITeacherScreen from '../AITeacherScreen';
import TeachingBoard from '../components/TeachingBoard';
import type { VoiceDrivers, Recognizer } from '../voice/VoiceSession';
import type { TurnResponse } from '../services/aiTeacherApi';

const mockTurn = jest.fn();
jest.mock('../services/aiTeacherApi', () => ({
  aiTeacherApi: {
    me: jest.fn(async () => ({ firstName: 'Asha', grade: 'Grade 6', curriculum: 'CBSE' })),
    turn: (...args: any[]) => mockTurn(...args),
  },
}));
let mockUser: any = { name: 'Asha Rao', role: 'student', learningBuddy: { buddyId: 'meera', customName: null, costumeId: 'school', emotion: 'happy' } };
jest.mock('../../../../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../../../../context/ThemeContext', () => ({
  useTheme: () => ({ colors: require('../../../../theme').darkColors, isDark: true }),
}));
let mockMobile = false;
jest.mock('../../../../hooks/useResponsive', () => ({ useResponsive: () => ({ isMobile: mockMobile, isDesktop: !mockMobile }) }));
jest.mock('../../../../components/common/ScreenLayout', () => function MockLayout({ children }: any) { return children; });
jest.mock('../../../../components/common/Header', () => {
  const { Text } = require('react-native');
  return function MockHeader({ title, subtitle }: any) { return <Text testID="header">{`${title} | ${subtitle}`}</Text>; };
});
const mockFocusCleanups: (() => void)[] = [];
jest.mock('@react-navigation/native', () => {
  const R = require('react');
  return {
    useFocusEffect: (fn: () => (() => void) | void) => {
      R.useEffect(() => { const c = fn(); if (c) mockFocusCleanups.push(c); return c || undefined; }, [fn]);
    },
  };
});

type FakeRec = Recognizer & { start: jest.Mock; abort: jest.Mock };
let recs: FakeRec[];
let spoken: { text: string; h: { onStart(): void; onBoundary(charIndex: number): void; onEnd(): void } }[];
let timers: Map<number, () => void>;
let drivers: VoiceDrivers & { cancelSpeech: jest.Mock };

beforeEach(() => {
  jest.clearAllMocks();
  mockFocusCleanups.length = 0;
  mockMobile = false;
  recs = []; spoken = []; timers = new Map();
  let id = 0;
  drivers = {
    supported: () => true,
    requestMic: jest.fn(async () => ({ granted: true })),
    createRecognizer: () => { const r = { onresult: null, onend: null, onerror: null, start: jest.fn(), abort: jest.fn() } as unknown as FakeRec; recs.push(r); return r; },
    speak: (text, _lang, h) => { spoken.push({ text, h }); },
    cancelSpeech: jest.fn(),
    setTimer: (fn) => { id += 1; timers.set(id, fn); return id; },
    clearTimer: (t) => { timers.delete(t); },
  };
});

const tick = async () => { await act(async () => { for (let i = 0; i < 5; i += 1) await Promise.resolve(); }); };
const play = async (i: number) => { await act(async () => { spoken[i].h.onStart(); spoken[i].h.onEnd(); }); await tick(); };
async function sayAloud(text: string) {
  await act(async () => { recs.at(-1)!.onresult!(text, true); });
  await act(async () => { const fns = [...timers.values()]; timers.clear(); fns.forEach((f) => f()); });
  await tick();
}

const LCM_LESSON: TurnResponse = {
  kind: 'lesson', language: 'en', board: 'replace', practice: null, feedback: null, state: { topicKey: 'k' },
  topic: { key: 'k', title: 'LCM', subject: 'Mathematics', grade: 6, source: 'CBSE Grade 6 Mathematics · Ch 5 Prime Time', grounded: true },
  blocks: [
    { id: 'b1', type: 'text', text: 'The least common multiple is the smallest number both divide into.' },
    { id: 'b2', type: 'equation', lines: ['12 = 2^2 \\times 3', 'LCM = 2^2 \\times 3^2 = 36'], highlightLast: true },
  ],
  segments: [
    { id: 's1', caption: 'LCM is the least common multiple.', speech: 'LCM is the least common multiple.', reveal: ['b1'] },
    { id: 's2', caption: 'So the LCM of 12 and 18 is 36.', speech: 'So the LCM of 12 and 18 is 36.', reveal: ['b2'] },
  ],
};

const PRACTICE: TurnResponse = {
  kind: 'practice', language: 'en', board: 'keep', topic: LCM_LESSON.topic, feedback: null, state: { topicKey: 'k', questionId: 'q1' }, blocks: [],
  practice: { id: 'q1', prompt: 'Find the LCM of 8 and 12.', answerFormat: 'number', durationSeconds: 60 },
  segments: [{ id: 'p1', caption: 'Find the LCM of 8 and 12. You have 1 minute.', speech: 'Find the LCM of 8 and 12.', reveal: [] }],
};

const FEEDBACK: TurnResponse = {
  kind: 'feedback', language: 'en', board: 'keep', topic: LCM_LESSON.topic, practice: null, state: { topicKey: 'k' },
  feedback: { correct: true, expected: '24', given: '24', message: 'Correct! The LCM of 8 and 12 is 24.' },
  blocks: [{ id: 'f1', type: 'equation', lines: ['8 = 2^3', 'LCM = 2^3 \\times 3 = 24'], highlightLast: true }],
  segments: [{ id: 'fs', caption: 'Correct! The LCM of 8 and 12 is 24.', speech: 'Correct!', reveal: ['f1'] }],
};

test('on entry: the buddy avatar, an India-time greeting by first name, one Start button and no typing', async () => {
  await render(<AITeacherScreen navigation={{}} drivers={drivers} />);
  await tick();
  expect(screen.getByTestId('ai-teacher-buddy').props.accessibilityLabel).toBe('Meera, your AI Teacher');
  expect(screen.getByTestId('ai-teacher-caption')).toHaveTextContent(/^Good (morning|afternoon|evening), Asha! I'm Meera, your AI Teacher\./);
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(screen.getByTestId('ai-teacher-voice')).toHaveTextContent(/Start/);
  expect(screen.getByTestId('ai-teacher-mic-state')).toHaveTextContent('Microphone off');
  expect(screen.queryByText(/Send|Check Answer|Replay|Tap to Speak/)).toBeNull();
  expect(screen.queryByPlaceholderText(/.+/)).toBeNull();
  expect(screen.queryByTestId('ai-teacher-status')).toBeNull(); // silent until Start
  expect(drivers.requestMic).not.toHaveBeenCalled();
  expect(spoken).toHaveLength(0);
});

test('Start → greeting → ask aloud → the lesson is spoken and the board reveals in step; Stop keeps the board', async () => {
  mockTurn.mockResolvedValueOnce(LCM_LESSON);
  await render(<AITeacherScreen navigation={{}} drivers={drivers} />);
  await tick();
  await fireEvent.press(screen.getByTestId('ai-teacher-voice'));
  await tick();
  expect(screen.getByTestId('ai-teacher-voice')).toHaveTextContent(/Stop/);
  expect(screen.getByTestId('ai-teacher-mic-state')).toHaveTextContent('Microphone on');
  expect(spoken[0].text).toMatch(/Asha! I'm Meera/);
  await play(0);
  expect(screen.getByTestId('ai-teacher-status')).toHaveTextContent(/Listening…/);

  await sayAloud('explain LCM');
  expect(mockTurn).toHaveBeenCalledTimes(1);
  expect(mockTurn.mock.calls[0][0]).toBe('explain LCM');
  expect(screen.getByTestId('board-title')).toHaveTextContent('LCM');
  expect(screen.getByText(/From your book: CBSE Grade 6 Mathematics/)).toBeTruthy();
  expect(screen.getByTestId('header')).toHaveTextContent('AI Teacher | Mathematics / LCM');
  expect(screen.queryByTestId('board-block-text')).toBeNull(); // not yet said

  await act(async () => { spoken[1].h.onStart(); });
  expect(screen.getByTestId('ai-teacher-status')).toHaveTextContent(/Speaking…/);
  expect(screen.getByTestId('ai-teacher-caption')).toHaveTextContent('LCM is the least common multiple.');
  expect(screen.getByTestId('board-block-text')).toBeTruthy();
  expect(screen.queryByTestId('board-equation')).toBeNull();
  await act(async () => { spoken[1].h.onEnd(); });
  await tick();
  await act(async () => { spoken[2].h.onStart(); });
  const eq = screen.getByTestId('board-equation');
  expect(within(eq).getByText('12 = 2² × 3')).toBeTruthy();
  expect(within(eq).getByText('LCM = 2² × 3² = 36')).toBeTruthy();

  // Stop mid-sentence: silence at once, mic off, the board stays.
  await fireEvent.press(screen.getByTestId('ai-teacher-voice'));
  expect(drivers.cancelSpeech).toHaveBeenCalled();
  expect(screen.getByTestId('ai-teacher-voice')).toHaveTextContent(/Start/);
  expect(screen.getByTestId('ai-teacher-mic-state')).toHaveTextContent('Microphone off');
  expect(screen.queryByTestId('ai-teacher-status')).toBeNull();
  expect(screen.getByTestId('board-equation')).toBeTruthy();
  const recsAtStop = recs.length;
  await act(async () => { spoken[2].h.onEnd(); });
  await tick();
  expect(recs.length).toBe(recsAtStop); // the late end event does not reopen the microphone
});

test('practice: the timer starts after the question is read, then the spoken answer gets feedback', async () => {
  mockTurn.mockResolvedValueOnce(LCM_LESSON).mockResolvedValueOnce(PRACTICE).mockResolvedValueOnce(FEEDBACK);
  await render(<AITeacherScreen navigation={{}} drivers={drivers} />);
  await tick();
  await fireEvent.press(screen.getByTestId('ai-teacher-voice'));
  await tick();
  await play(0);
  await sayAloud('explain LCM');
  await play(1); await play(2);
  await sayAloud('give me a question');
  expect(mockTurn.mock.calls[1][1]).toEqual({ topicKey: 'k' }); // the server's state is echoed back
  const card = screen.getByTestId('practice-card');
  expect(within(card).getByTestId('practice-prompt')).toHaveTextContent('Find the LCM of 8 and 12.');
  expect(within(card).getByText('Say your answer aloud.')).toBeTruthy();
  expect(screen.queryByTestId('practice-timer')).toBeNull(); // not while the question is being read
  await play(3);
  expect(screen.getByTestId('practice-timer')).toHaveTextContent(/0(1:00|0:5\d)/);
  expect(screen.getByTestId('ai-teacher-caption')).toHaveTextContent('Say your answer when you’re ready.');

  await sayAloud('twenty four');
  expect(mockTurn.mock.calls[2][0]).toBe('twenty four');
  expect(screen.getByTestId('practice-feedback')).toHaveTextContent(/Correct! The LCM of 8 and 12 is 24\./);
  expect(screen.queryByTestId('practice-timer')).toBeNull();
  await act(async () => { spoken[4].h.onStart(); });
  expect(within(screen.getByTestId('practice-feedback')).getByText('LCM = 2³ × 3 = 24')).toBeTruthy();
});

test('leaving the screen turns the microphone off and silences the teacher', async () => {
  await render(<AITeacherScreen navigation={{}} drivers={drivers} />);
  await tick();
  await fireEvent.press(screen.getByTestId('ai-teacher-voice'));
  await tick();
  await play(0);
  const rec = recs.at(-1)!;
  await act(async () => { mockFocusCleanups.forEach((c) => c()); });
  expect(rec.abort).toHaveBeenCalled();
  expect(drivers.cancelSpeech).toHaveBeenCalled();
  expect(screen.getByTestId('ai-teacher-voice')).toHaveTextContent(/Start/);
});

test('microphone denied: the message is shown and the button stays on Start', async () => {
  drivers.requestMic = jest.fn(async () => ({ granted: false, reason: 'denied' as const }));
  await render(<AITeacherScreen navigation={{}} drivers={drivers} />);
  await tick();
  await fireEvent.press(screen.getByTestId('ai-teacher-voice'));
  await tick();
  expect(screen.getByTestId('ai-teacher-error')).toHaveTextContent(/Microphone access is blocked/);
  expect(screen.getByTestId('ai-teacher-voice')).toHaveTextContent(/Start/);
  expect(spoken).toHaveLength(0);
});

test('mobile: the avatar and voice button sit above the scrolling board', async () => {
  mockMobile = true;
  await render(<AITeacherScreen navigation={{}} drivers={drivers} />);
  await tick();
  expect(screen.getByTestId('ai-teacher-voice')).toBeTruthy();
  expect(within(screen.getByTestId('ai-teacher-board-scroll')).queryByTestId('ai-teacher-voice')).toBeNull();
  expect(within(screen.getByTestId('ai-teacher-board-scroll')).getByTestId('ai-teacher-board')).toBeTruthy();
});

describe('TeachingBoard', () => {
  const colors = require('../../../../theme').darkColors;
  const practice = { id: 'q1', prompt: 'Find the LCM of 6 and 9.', answerFormat: 'number' as const, durationSeconds: 30 };

  test("shows Time's up when the countdown has run out", async () => {
    await render(<TeachingBoard topic={null} blocks={[]} revealed={new Set()} colors={colors}
      practice={{ practice, timerEndsAt: Date.now() - 1000, feedback: null, feedbackBlocks: [] }} />);
    expect(screen.getByTestId('practice-timer')).toHaveTextContent(/Time's up/);
    expect(screen.getByTestId('practice-time-up')).toBeTruthy();
  });

  test('labels a general explanation that is not from the textbook', async () => {
    await render(<TeachingBoard colors={colors} blocks={[{ id: 'n', type: 'note', text: 'This example was made up by AI Teacher.' }]} revealed={new Set(['n'])} practice={null}
      topic={{ key: null, title: 'Photosynthesis', subject: 'Science', grade: null, source: null, grounded: false }} />);
    expect(screen.getByText('General explanation (not from your textbook)')).toBeTruthy();
    expect(screen.getByText('This example was made up by AI Teacher.')).toBeTruthy();
  });

  test('a wrong answer shows the message and the worked solution once revealed', async () => {
    await render(<TeachingBoard topic={null} blocks={[]} colors={colors} revealed={new Set(['w'])}
      practice={{ practice, timerEndsAt: null, feedback: { correct: false, message: 'Not quite. 54 is a common multiple, but not the least.' },
        feedbackBlocks: [{ id: 'w', type: 'equation', lines: ['6 = 2 \\times 3', '9 = 3^2', 'LCM = 2 \\times 3^2 = 18'], highlightLast: true }] }} />);
    expect(screen.getByTestId('practice-feedback')).toHaveTextContent(/Not quite\. 54 is a common multiple/);
    expect(screen.getByText('LCM = 2 × 3² = 18')).toBeTruthy();
    expect(screen.queryByText('Say your answer aloud.')).toBeNull();
  });
});
