// platformAudio — the one audio player behind Bedtime Stories narration and
// Read-Aloud "Listen first". Covers the web <audio> path (the website) and
// the expo-av path (the Android/iOS app).
import { Platform } from 'react-native';
import { createPlatformAudio, SILENT_WAV } from '../platformAudio';

const g = global as any;

// ── Web ──────────────────────────────────────────────────────────────────────
class FakeAudioElement {
  static instances: FakeAudioElement[] = [];
  src = '';
  currentTime = 0;
  duration = NaN;
  playbackRate = 1;
  listeners: Record<string, ((e?: any) => void)[]> = {};
  played: string[] = [];
  nextPlay: Promise<void> | null = null;
  constructor() { FakeAudioElement.instances.push(this); }
  addEventListener(name: string, fn: (e?: any) => void) { (this.listeners[name] ||= []).push(fn); }
  load() {}
  play() { this.played.push(this.src); const p = this.nextPlay ?? Promise.resolve(); this.nextPlay = null; return p; }
  pause() {}
  removeAttribute(name: string) { if (name === 'src') this.src = ''; }
  fire(name: string) { (this.listeners[name] || []).forEach(fn => fn({ type: name })); }
}

describe('platformAudio — web', () => {
  let restoreOS: () => void;
  beforeEach(() => {
    const original = Object.getOwnPropertyDescriptor(Platform, 'OS')!;
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'web' });
    restoreOS = () => Object.defineProperty(Platform, 'OS', original);
    FakeAudioElement.instances = [];
    g.Audio = FakeAudioElement;
  });
  afterEach(() => restoreOS());

  test('play() really starts the <audio> element (the missing-voice bug)', async () => {
    const audio = createPlatformAudio();
    const statuses: string[] = [];
    audio.onStatusChange(s => statuses.push(s));
    await audio.load('https://svc/data/audio/stories/p1.mp3');
    await audio.play();
    const el = FakeAudioElement.instances[0];
    expect(el.played).toEqual(['https://svc/data/audio/stories/p1.mp3']);
    expect(statuses).toEqual(['loading', 'playing']);
    expect(audio.getStatus()).toBe('playing');
  });

  test('prime() plays a silent clip on the same element that later plays the story', async () => {
    const audio = createPlatformAudio();
    audio.prime();
    await audio.load('https://svc/p1.mp3');
    await audio.play();
    expect(FakeAudioElement.instances).toHaveLength(1);
    expect(FakeAudioElement.instances[0].played).toEqual([SILENT_WAV, 'https://svc/p1.mp3']);
  });

  test('a blocked or broken play() rejects and reports the error once', async () => {
    const audio = createPlatformAudio();
    const onError = jest.fn();
    audio.onError(onError);
    await audio.load('https://svc/p1.mp3');
    const el = FakeAudioElement.instances[0];
    const blocked = Object.assign(new Error('blocked'), { name: 'NotAllowedError' });
    el.nextPlay = Promise.reject(blocked);
    await expect(audio.play()).rejects.toBe(blocked);
    el.fire('error');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(audio.getStatus()).toBe('error');
  });

  test('an interrupted play() (AbortError from pause/unload) is not an error', async () => {
    const audio = createPlatformAudio();
    const onError = jest.fn();
    audio.onError(onError);
    await audio.load('https://svc/p1.mp3');
    FakeAudioElement.instances[0].nextPlay = Promise.reject(Object.assign(new Error('x'), { name: 'AbortError' }));
    await expect(audio.play()).resolves.toBeUndefined();
    expect(onError).not.toHaveBeenCalled();
  });

  test('a file that fails to load fires onError; ended fires onEnded', async () => {
    const audio = createPlatformAudio();
    const onError = jest.fn();
    const onEnded = jest.fn();
    audio.onError(onError);
    audio.onEnded(onEnded);
    await audio.load('https://svc/missing.mp3');
    FakeAudioElement.instances[0].fire('error');
    expect(onError).toHaveBeenCalledTimes(1);

    await audio.load('https://svc/p2.mp3');
    FakeAudioElement.instances[0].fire('ended');
    expect(onEnded).toHaveBeenCalledTimes(1);
  });

  test('pause then play resumes on the same element', async () => {
    const audio = createPlatformAudio();
    await audio.load('https://svc/p1.mp3');
    await audio.play();
    await audio.pause();
    expect(audio.getStatus()).toBe('paused');
    await audio.play();
    expect(audio.getStatus()).toBe('playing');
    expect(FakeAudioElement.instances[0].played).toHaveLength(2);
  });

  test('duration is 0 until the file metadata is known (never NaN)', async () => {
    const audio = createPlatformAudio();
    await audio.load('https://svc/p1.mp3');
    expect(audio.getDuration()).toBe(0);
  });
});

// ── Native (expo-av) ─────────────────────────────────────────────────────────
const mockSound = {
  listener: null as null | ((s: any) => void),
  setOnPlaybackStatusUpdate: jest.fn((fn: any) => { mockSound.listener = fn; }),
  playAsync: jest.fn(async () => ({})),
  pauseAsync: jest.fn(async () => ({})),
  stopAsync: jest.fn(async () => ({})),
  unloadAsync: jest.fn(async () => ({})),
  setRateAsync: jest.fn(async () => ({})),
  setPositionAsync: jest.fn(async () => ({})),
};
const mockCreateAsync = jest.fn(async (..._args: any[]) => ({ sound: mockSound, status: { isLoaded: true, durationMillis: 5000, positionMillis: 0 } }));
const mockSetAudioModeAsync = jest.fn(async (..._args: any[]) => {});
jest.mock('expo-av', () => ({
  Audio: {
    Sound: { createAsync: (...a: any[]) => mockCreateAsync(...a) },
    setAudioModeAsync: (...a: any[]) => mockSetAudioModeAsync(...a),
  },
}));

describe('platformAudio — native', () => {
  let restoreOS: () => void;
  beforeEach(() => {
    jest.clearAllMocks();
    const original = Object.getOwnPropertyDescriptor(Platform, 'OS')!;
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'android' });
    restoreOS = () => Object.defineProperty(Platform, 'OS', original);
  });
  afterEach(() => restoreOS());

  test('loads with Audio.Sound.createAsync, plays in silent mode, and starts playback', async () => {
    const audio = createPlatformAudio();
    await audio.load('https://svc/p1.mp3');
    expect(mockSetAudioModeAsync).toHaveBeenCalledWith(expect.objectContaining({ playsInSilentModeIOS: true }));
    expect(mockCreateAsync).toHaveBeenCalledWith({ uri: 'https://svc/p1.mp3' }, { shouldPlay: false });
    expect(mockSound.setOnPlaybackStatusUpdate).toHaveBeenCalledWith(expect.any(Function));
    expect(audio.getDuration()).toBe(5);

    await audio.play();
    expect(mockSound.playAsync).toHaveBeenCalled();
    expect(audio.getStatus()).toBe('playing');
  });

  test('a paused sound stays paused when expo-av reports isPlaying=false', async () => {
    const audio = createPlatformAudio();
    await audio.load('https://svc/p1.mp3');
    await audio.play();
    await audio.pause();
    mockSound.listener?.({ isLoaded: true, isPlaying: false, positionMillis: 1200, durationMillis: 5000 });
    expect(audio.getStatus()).toBe('paused');
    expect(audio.getPosition()).toBeCloseTo(1.2);
  });

  test('finishing fires onEnded; a load failure rejects and fires onError', async () => {
    const audio = createPlatformAudio();
    const onEnded = jest.fn();
    const onError = jest.fn();
    audio.onEnded(onEnded);
    audio.onError(onError);
    await audio.load('https://svc/p1.mp3');
    mockSound.listener?.({ isLoaded: true, didJustFinish: true, positionMillis: 5000, durationMillis: 5000 });
    expect(onEnded).toHaveBeenCalledTimes(1);

    mockCreateAsync.mockRejectedValueOnce(new Error('404'));
    await expect(audio.load('https://svc/missing.mp3')).rejects.toThrow('404');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  test('setRate uses expo-av setRateAsync with pitch correction', async () => {
    const audio = createPlatformAudio();
    await audio.load('https://svc/p1.mp3');
    await audio.setRate(1.5);
    expect(mockSound.setRateAsync).toHaveBeenCalledWith(1.5, true);
  });
});
