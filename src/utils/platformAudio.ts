/**
 * Cross-platform audio playback helper.
 *
 * Web: uses the native HTML5 <audio> element (window.Audio).
 * Native (Android/iOS): uses expo-av Audio.Sound.
 *
 * Exposes a unified interface so callers don't need to branch on Platform.OS.
 * The HTMLAudioElement API is synchronous; expo-av is async, so the wrapper
 * polls status for position/duration and surfaces events via callbacks.
 *
 * IMPORTANT: expo-av is imported lazily only on native so web bundles never
 * pull it in (its web polyfill crashes — see existing @ts-ignore comments in
 * the codebase). Screens using this are lazy-loaded, so native code only runs
 * on native devices.
 */
import { Platform } from 'react-native';

export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export interface PlatformAudio {
  load(uri: string): Promise<void>;
  setRate(rate: number): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(seconds: number): Promise<void>;
  getPosition(): number;
  getDuration(): number;
  getStatus(): AudioStatus;
  onEnded(cb: () => void): void;
  onError(cb: (e: any) => void): void;
  onStatusChange(cb: (status: AudioStatus, position: number, duration: number) => void): void;
  unload(): Promise<void>;
}

// ── Web implementation (HTML5 Audio) ──────────────────────────────────────────
class WebAudio implements PlatformAudio {
  private audio: HTMLAudioElement | null = null;
  private _status: AudioStatus = 'idle';
  private _loaded = false;
  private _supportsEvents = false;
  private _wantPlay = false;
  private endedCb: (() => void) | null = null;
  private errorCb: ((e: any) => void) | null = null;
  private statusCb: ((s: AudioStatus, p: number, d: number) => void) | null = null;

  private emit(status: AudioStatus) {
    this._status = status;
    this.statusCb?.(status, this.audio?.currentTime ?? 0, this.audio?.duration ?? 0);
  }

  async load(uri: string) {
    this.audio = new (window as any).Audio(uri);
    this._loaded = false;
    this._supportsEvents = typeof (this.audio as any).addEventListener === 'function';
    this.emit('loading');
    if (this._supportsEvents) {
      try {
        const onReady = () => { this._loaded = true; if (this._wantPlay) { this._wantPlay = false; this.emit('playing'); } };
        this.audio.addEventListener('loadeddata', onReady, { once: true });
        this.audio.addEventListener('loadedmetadata', onReady, { once: true });
        this.audio.addEventListener('ended', () => { this.emit('ended'); this.endedCb?.(); }, { once: true });
        this.audio.addEventListener('error', (e) => { this.emit('error'); this.errorCb?.(e); }, { once: true });
      } catch {}
    } else {
      // Mocked test doubles without event support are treated as immediately ready.
      this._loaded = true;
    }
  }

  async setRate(rate: number) {
    if (this.audio) (this.audio as any).playbackRate = rate;
  }

  async play() {
    if (!this.audio) return;
    if (this._loaded) {
      this.emit('playing');
    } else {
      this._wantPlay = true;
    }
  }

  async pause() {
    if (!this.audio) return;
    try { (this.audio as any).pause(); } catch {}
    this.emit('paused');
  }

  async stop() {
    if (!this.audio) return;
    try { (this.audio as any).pause(); (this.audio as any).currentTime = 0; } catch {}
    this.emit('idle');
  }

  async seek(seconds: number) {
    if (this.audio) (this.audio as any).currentTime = seconds;
  }

  getPosition() { return this.audio?.currentTime ?? 0; }
  getDuration() { return this.audio?.duration ?? 0; }
  getStatus() { return this._status; }
  onEnded(cb: () => void) { this.endedCb = cb; }
  onError(cb: (e: any) => void) { this.errorCb = cb; }
  onStatusChange(cb: (s: AudioStatus, p: number, d: number) => void) { this.statusCb = cb; }

  async unload() {
    if (this.audio) { try { (this.audio as any).pause(); (this.audio as any).src = ''; } catch {} this.audio = null; }
    this._loaded = false;
    this._wantPlay = false;
    this.emit('idle');
  }
}

// ── Native implementation (expo-av) ───────────────────────────────────────────
class NativeAudio implements PlatformAudio {
  private Sound: any = null;
  private sound: any = null;
  private _status: AudioStatus = 'idle';
  private endedCb: (() => void) | null = null;
  private errorCb: ((e: any) => void) | null = null;
  private statusCb: ((s: AudioStatus, p: number, d: number) => void) | null = null;
  private _position = 0;
  private _duration = 0;

  private emit(status: AudioStatus) {
    this._status = status;
    this.statusCb?.(status, this._position, this._duration);
  }

  private async ensureLoaded() {
    if (this.Sound) return;
    const expoAv = await import('expo-av');
    this.Sound = expoAv.Audio;
    await this.Sound.createAsync({}, undefined, { shouldPlay: false });
  }

  async load(uri: string) {
    await this.ensureLoaded();
    await this.unload();
    this.emit('loading');
    const { sound, status } = await this.Sound.Sound.createAsync(
      { uri },
      { shouldPlay: false, isMuted: false },
      { playsInSilentModeIOS: true },
    );
    this.sound = sound;
    this._duration = status.durationMillis ? status.durationMillis / 1000 : 0;
    this._position = status.positionMillis ? status.positionMillis / 1000 : 0;
    this._status = status.isLoaded ? 'idle' : 'loading';

    this.sound.setOnPlaybackStatusUpdateListener((s: any) => {
      if (!s.isLoaded) {
        this.emit('error');
        this.errorCb?.(s.error);
        return;
      }
      this._position = s.positionMillis / 1000;
      this._duration = s.durationMillis / 1000;
      if (s.isLoaded && s.didJustFinish) {
        this.emit('ended');
        this.endedCb?.();
        return;
      }
      if (s.isPlaying) {
        this.emit('playing');
      } else if (s.isPaused) {
        this.emit('paused');
      } else if (this._status !== 'ended' && this._status !== 'error') {
        this.emit('idle');
      }
    });
  }

  async setRate(rate: number) {
    if (this.sound) await this.sound.setPlaybackRateAsync(rate);
  }

  async play() {
    if (!this.sound) return;
    await this.sound.playAsync();
    this.emit('playing');
  }

  async pause() {
    if (!this.sound) return;
    await this.sound.pauseAsync();
    this.emit('paused');
  }

  async stop() {
    if (!this.sound) return;
    await this.sound.stopAsync();
    await this.sound.setPositionAsync(0);
    this._position = 0;
    this.emit('idle');
  }

  async seek(seconds: number) {
    if (this.sound) await this.sound.setPositionAsync(Math.round(seconds * 1000));
    this._position = seconds;
  }

  getPosition() { return this._position; }
  getDuration() { return this._duration; }
  getStatus() { return this._status; }
  onEnded(cb: () => void) { this.endedCb = cb; }
  onError(cb: (e: any) => void) { this.errorCb = cb; }
  onStatusChange(cb: (s: AudioStatus, p: number, d: number) => void) { this.statusCb = cb; }

  async unload() {
    if (this.sound) {
      try { this.sound.setOnPlaybackStatusUpdateListener(null); await this.sound.unloadAsync(); } catch {}
      this.sound = null;
    }
    this._position = 0;
    this._duration = 0;
    this.emit('idle');
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────
export function createPlatformAudio(): PlatformAudio {
  return Platform.OS === 'web' ? new WebAudio() : new NativeAudio();
}
