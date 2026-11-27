// Unit tests for useStoryReader — the most complex hook in Bedtime Stories
// (fetch, AsyncStorage resume, rAF highlight loop, web <audio> playback).
// Forced to the 'web' platform branch since that's where all the real
// audio/highlight logic lives (native branch is a no-op stub).
// ambientAudio is mocked at the module boundary — its own Web Audio API
// synthesis is out of scope for this hook's tests.

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, screen, userEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStoryReader } from '../useStoryReader';
import { SILENT_WAV } from '../../../../../utils/platformAudio';

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  __esModule: true,
  default: { OS: 'web', select: (obj: any) => obj.web ?? obj.default ?? obj.ios },
  OS: 'web',
  select: (obj: any) => obj.web ?? obj.default ?? obj.ios,
}));

const mockPlayPageFlip = jest.fn();
const mockSilenceAllAmbient = jest.fn();
const mockAmbientInstance = { pause: jest.fn(), resume: jest.fn(), stop: jest.fn() };
const mockCreateAmbient = jest.fn((..._args: any[]) => mockAmbientInstance);
jest.mock('../../utils/ambientAudio', () => ({
  playPageFlip: (...args: any[]) => mockPlayPageFlip(...args),
  silenceAllAmbient: (...args: any[]) => mockSilenceAllAmbient(...args),
  createAmbient: (...args: any[]) => mockCreateAmbient(...args),
}));

const STORY = {
  id: 'ambarisha',
  title: 'Ambarisha Maharaja',
  pages: [
    { pageNumber: 1, text: 'Once there was a king.' },
    { pageNumber: 2, text: 'He was very devoted.' },
    { pageNumber: 3, text: 'The end.' },
  ],
};

class MockAudio {
  src: string;
  paused = true;
  ended = false;
  currentTime = 0;
  duration = 5;
  playbackRate = 1;
  volume = 1;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(src: string) { this.src = src; }
  play() {
    mockPlayedSrcs.push(this.src);
    if (mockPlayRejection && this.src !== SILENT_WAV) return Promise.reject(mockPlayRejection);
    this.paused = false;
    return Promise.resolve();
  }
  pause() { this.paused = true; }
}

// Every src the narration element was asked to play, in order.
let mockPlayedSrcs: string[] = [];
// When set, play() of a real (non-silent) file rejects with this error.
let mockPlayRejection: any = null;

function mockFetchByUrl(handlers: { story?: () => Promise<any>; audio?: () => Promise<any> }) {
  global.fetch = jest.fn((url: string) => {
    const u = String(url);
    if (/\/stories\/[^/]+\/audio\//.test(u) && handlers.audio) return handlers.audio();
    if (/\/stories\/[^/]+$/.test(u) && handlers.story) return handlers.story();
    return Promise.reject(new Error(`unexpected fetch to ${u}`));
  }) as any;
}

function Harness({ storyId }: { storyId: string }) {
  const hook = useStoryReader(storyId);
  return (
    <>
      <Text testID="loading">{String(hook.loading)}</Text>
      <Text testID="storyTitle">{hook.story?.title ?? ''}</Text>
      <Text testID="currentPage">{hook.currentPage}</Text>
      <Text testID="playing">{String(hook.playing)}</Text>
      <Text testID="isLoading">{String(hook.isLoading)}</Text>
      <Text testID="resumedFrom">{String(hook.resumedFrom)}</Text>
      <Text testID="donePages">{JSON.stringify([...hook.donePages])}</Text>
      <Text testID="playbackRate">{hook.playbackRate}</Text>
      <Text testID="audioError">{hook.audioError ?? ''}</Text>
      <TouchableOpacity testID="retry" onPress={() => hook.retryAudio()}><Text>retry</Text></TouchableOpacity>
      <TouchableOpacity testID="speakPage1" onPress={() => hook.speakPage(1)}><Text>speak1</Text></TouchableOpacity>
      <TouchableOpacity testID="goToPage1" onPress={() => hook.goToPage(1)}><Text>goto1</Text></TouchableOpacity>
      <TouchableOpacity testID="pause" onPress={() => hook.pauseAudio()}><Text>pause</Text></TouchableOpacity>
      <TouchableOpacity testID="resume" onPress={() => hook.resumeAudio()}><Text>resume</Text></TouchableOpacity>
      <TouchableOpacity testID="setRate" onPress={() => hook.setPlaybackRate(1.5)}><Text>rate</Text></TouchableOpacity>
    </>
  );
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  (global as any).Audio = MockAudio;
  mockPlayedSrcs = [];
  mockPlayRejection = null;
});

describe('useStoryReader — loading the story', () => {
  test('fetches the real story on mount and populates state', async () => {
    mockFetchByUrl({ story: () => Promise.resolve({ ok: true, json: async () => STORY }) });
    await render(<Harness storyId="ambarisha" />);
    expect(await screen.findByText('Ambarisha Maharaja')).toBeTruthy();
    expect(screen.getByTestId('loading').props.children).toBe('false');
  });

  test('a fetch failure leaves story null, loading settles to false (no crash)', async () => {
    mockFetchByUrl({ story: () => Promise.reject(new Error('network down')) });
    await render(<Harness storyId="ambarisha" />);
    await waitFor(() => expect(screen.getByTestId('loading').props.children).toBe('false'));
    expect(screen.getByTestId('storyTitle').props.children).toBe('');
  });
});

describe('useStoryReader — resume from storage', () => {
  test('no saved progress -> starts at page 0, no resume banner', async () => {
    mockFetchByUrl({ story: () => Promise.resolve({ ok: true, json: async () => STORY }) });
    await render(<Harness storyId="ambarisha" />);
    await screen.findByText('Ambarisha Maharaja');
    expect(screen.getByTestId('currentPage').props.children).toBe(0);
    expect(screen.getByTestId('resumedFrom').props.children).toBe('null');
  });

  test('page 1 already done -> auto-resumes to page 2 (index 1), shows the resume banner', async () => {
    await AsyncStorage.setItem('story_done_ambarisha', JSON.stringify([1]));
    mockFetchByUrl({ story: () => Promise.resolve({ ok: true, json: async () => STORY }) });
    await render(<Harness storyId="ambarisha" />);
    await screen.findByText('Ambarisha Maharaja');
    await waitFor(() => expect(screen.getByTestId('currentPage').props.children).toBe(1));
    expect(screen.getByTestId('resumedFrom').props.children).toBe('2');
  });

  test('all pages already done -> stays at page 0 (no resume target)', async () => {
    await AsyncStorage.setItem('story_done_ambarisha', JSON.stringify([1, 2, 3]));
    mockFetchByUrl({ story: () => Promise.resolve({ ok: true, json: async () => STORY }) });
    await render(<Harness storyId="ambarisha" />);
    await screen.findByText('Ambarisha Maharaja');
    await new Promise(r => setTimeout(r, 0));
    expect(screen.getByTestId('currentPage').props.children).toBe(0);
  });
});

describe('useStoryReader — goToPage', () => {
  test('plays the page-flip sound and changes the current page', async () => {
    mockFetchByUrl({ story: () => Promise.resolve({ ok: true, json: async () => STORY }) });
    const user = userEvent.setup();
    await render(<Harness storyId="ambarisha" />);
    await screen.findByText('Ambarisha Maharaja');

    await user.press(screen.getByTestId('goToPage1'));

    expect(mockPlayPageFlip).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('currentPage').props.children).toBe(1));
  });
});

describe('useStoryReader — speakPage', () => {
  test('fetches page audio, starts playback, and stores the ambient track', async () => {
    mockFetchByUrl({
      story: () => Promise.resolve({ ok: true, json: async () => STORY }),
      audio: () => Promise.resolve({ ok: true, json: async () => ({ audioUrl: '/data/audio/x.mp3', wordTimings: null, timingProvider: 'none' }) }),
    });
    const user = userEvent.setup();
    await render(<Harness storyId="ambarisha" />);
    await screen.findByText('Ambarisha Maharaja');

    await user.press(screen.getByTestId('speakPage1'));

    await waitFor(() => expect(screen.getByTestId('playing').props.children).toBe('true'));
    expect(screen.getByTestId('isLoading').props.children).toBe('false');
    expect(mockCreateAmbient).toHaveBeenCalledWith('ambarisha', expect.objectContaining({ pageNumber: 1 }));
  });

  test('no audioUrl in the response -> stops loading, never starts playback', async () => {
    mockFetchByUrl({
      story: () => Promise.resolve({ ok: true, json: async () => STORY }),
      audio: () => Promise.resolve({ ok: true, json: async () => ({}) }),
    });
    const user = userEvent.setup();
    await render(<Harness storyId="ambarisha" />);
    await screen.findByText('Ambarisha Maharaja');

    await user.press(screen.getByTestId('speakPage1'));

    await waitFor(() => expect(screen.getByTestId('isLoading').props.children).toBe('false'));
    expect(screen.getByTestId('playing').props.children).toBe('false');
  });

  test('a network failure during audio fetch stops loading, does not crash', async () => {
    mockFetchByUrl({
      story: () => Promise.resolve({ ok: true, json: async () => STORY }),
      audio: () => Promise.reject(new Error('down')),
    });
    const user = userEvent.setup();
    await render(<Harness storyId="ambarisha" />);
    await screen.findByText('Ambarisha Maharaja');

    await user.press(screen.getByTestId('speakPage1'));

    await waitFor(() => expect(screen.getByTestId('isLoading').props.children).toBe('false'));
    expect(screen.getByTestId('playing').props.children).toBe('false');
  });
});

describe('useStoryReader — pause/resume', () => {
  test('pauseAudio pauses playback and force-silences any stray ambient', async () => {
    mockFetchByUrl({
      story: () => Promise.resolve({ ok: true, json: async () => STORY }),
      audio: () => Promise.resolve({ ok: true, json: async () => ({ audioUrl: '/x.mp3', wordTimings: null, timingProvider: 'none' }) }),
    });
    const user = userEvent.setup();
    await render(<Harness storyId="ambarisha" />);
    await screen.findByText('Ambarisha Maharaja');
    await user.press(screen.getByTestId('speakPage1'));
    await waitFor(() => expect(screen.getByTestId('playing').props.children).toBe('true'));

    await user.press(screen.getByTestId('pause'));

    expect(screen.getByTestId('playing').props.children).toBe('false');
    expect(mockSilenceAllAmbient).toHaveBeenCalled();
  });

  test('resumeAudio resumes playback and the ambient track', async () => {
    mockFetchByUrl({
      story: () => Promise.resolve({ ok: true, json: async () => STORY }),
      audio: () => Promise.resolve({ ok: true, json: async () => ({ audioUrl: '/x.mp3', wordTimings: null, timingProvider: 'none' }) }),
    });
    const user = userEvent.setup();
    await render(<Harness storyId="ambarisha" />);
    await screen.findByText('Ambarisha Maharaja');
    await user.press(screen.getByTestId('speakPage1'));
    await waitFor(() => expect(screen.getByTestId('playing').props.children).toBe('true'));
    await user.press(screen.getByTestId('pause'));

    await user.press(screen.getByTestId('resume'));

    expect(screen.getByTestId('playing').props.children).toBe('true');
    expect(mockAmbientInstance.resume).toHaveBeenCalled();
  });
});

describe('useStoryReader — playback rate', () => {
  test('setPlaybackRate updates the returned state (applied to any live <audio> via effect)', async () => {
    mockFetchByUrl({ story: () => Promise.resolve({ ok: true, json: async () => STORY }) });
    const user = userEvent.setup();
    await render(<Harness storyId="ambarisha" />);
    await screen.findByText('Ambarisha Maharaja');

    await user.press(screen.getByTestId('setRate'));

    expect(screen.getByTestId('playbackRate').props.children).toBe(1.5);
  });
});

describe('useStoryReader — the narration is really played (voice regression)', () => {
  const okAudio = () => Promise.resolve({ ok: true, json: async () => ({ audioUrl: '/data/audio/stories/p1.mp3', wordTimings: null }) });

  test('unlocks the player inside the tap, then plays the page mp3 from the service', async () => {
    mockFetchByUrl({ story: () => Promise.resolve({ ok: true, json: async () => STORY }), audio: okAudio });
    const user = userEvent.setup();
    await render(<Harness storyId="ambarisha" />);
    await screen.findByText('Ambarisha Maharaja');

    await user.press(screen.getByTestId('speakPage1'));

    await waitFor(() => expect(screen.getByTestId('playing').props.children).toBe('true'));
    // Before the fix the <audio> element's play() was never called: silence.
    expect(mockPlayedSrcs[0]).toBe(SILENT_WAV);
    expect(mockPlayedSrcs[mockPlayedSrcs.length - 1]).toMatch(/\/data\/audio\/stories\/p1\.mp3$/);
    expect(screen.getByTestId('audioError').props.children).toBe('');
  });

  test('a service error (503) shows a clear message and no music plays without the voice', async () => {
    mockFetchByUrl({
      story: () => Promise.resolve({ ok: true, json: async () => STORY }),
      audio: () => Promise.resolve({ ok: false, status: 503, json: async () => ({ error: 'TTS not configured' }) }),
    });
    const user = userEvent.setup();
    await render(<Harness storyId="ambarisha" />);
    await screen.findByText('Ambarisha Maharaja');

    await user.press(screen.getByTestId('speakPage1'));

    await waitFor(() => expect(screen.getByTestId('audioError').props.children).toMatch(/story voice isn’t available/));
    expect(screen.getByTestId('playing').props.children).toBe('false');
    expect(screen.getByTestId('isLoading').props.children).toBe('false');
    expect(mockCreateAmbient).not.toHaveBeenCalled();
  });

  test('the browser blocking the sound is explained, not silent', async () => {
    mockPlayRejection = Object.assign(new Error('blocked'), { name: 'NotAllowedError' });
    mockFetchByUrl({ story: () => Promise.resolve({ ok: true, json: async () => STORY }), audio: okAudio });
    const user = userEvent.setup();
    await render(<Harness storyId="ambarisha" />);
    await screen.findByText('Ambarisha Maharaja');

    await user.press(screen.getByTestId('speakPage1'));

    await waitFor(() => expect(screen.getByTestId('audioError').props.children).toMatch(/blocked the sound/));
    expect(screen.getByTestId('playing').props.children).toBe('false');
  });

  test('Try again after a failure plays the page and clears the message', async () => {
    let calls = 0;
    mockFetchByUrl({
      story: () => Promise.resolve({ ok: true, json: async () => STORY }),
      audio: () => (++calls === 1 ? Promise.reject(new Error('network down')) : okAudio()),
    });
    const user = userEvent.setup();
    await render(<Harness storyId="ambarisha" />);
    await screen.findByText('Ambarisha Maharaja');
    await user.press(screen.getByTestId('speakPage1'));
    await waitFor(() => expect(screen.getByTestId('audioError').props.children).toMatch(/Check your connection/));

    await user.press(screen.getByTestId('retry'));

    await waitFor(() => expect(screen.getByTestId('playing').props.children).toBe('true'));
    expect(screen.getByTestId('audioError').props.children).toBe('');
  });
});
