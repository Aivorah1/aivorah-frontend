/**
 * Cross-platform audio playback helper.
 *
 * Web: uses the native HTML5 <audio> element (window.Audio).
 * Native (Android/iOS): uses expo-av Audio.Sound.
 *
 * Exposes a unified interface so callers don't need to branch on Platform.OS.
 * The HTMLAudioElement API is synchronous; expo-av is async, so the wrapper
 * tracks status for position/duration and surfaces events via callbacks.
 *
 * IMPORTANT: expo-av is imported lazily only on native so web bundles never
 * pull it in (its web polyfill crashes — see existing @ts-ignore comments in
 * the codebase). Screens using this are lazy-loaded, so native code only runs
 * on native devices.
 */
import { Platform } from 'react-native';

export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export interface PlatformAudio {
  /**
   * Web only (no-op on native): unlocks the audio element. Call it
   * synchronously inside the tap handler, BEFORE any `await`, so a later
   * `play()` (after the network fetch) is still allowed by the browser's
   * autoplay policy (Safari/iOS only allow sound that starts from a tap).
   */
  prime(): void;
  load(uri: string): Promise<void>;
  setRate(rate: number): Promise<void>;
  /** Starts playback. Rejects (and fires onError once) if the audio can't play. */
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

// A WAV with no samples: playing it inside a tap unlocks the <audio> element.
export const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

// ── Web implementation (HTML5 Audio) ──────────────────────────────────────────
class WebAudio implements PlatformAudio {
  private audio: HTMLAudioElement | null = null;
  private _status: AudioStatus = 'idle';
  private _errored = false;
  private _loadId = 0; // listeners from an earlier load() of the same element are ignored
  private endedCb: (() => void) | null = null;
  private errorCb: ((e: any) => void) | null = null;
  private statusCb: ((s: AudioStatus, p: number, d: number) => void) | null = null;

  private emit(status: AudioStatus) {
    this._status = status;
    this.statusCb?.(status, this.audio?.currentTime ?? 0, this.getDuration());
  }

  // Reports an error once per load, however many ways it surfaces
  // (the element's `error` event and a rejected play()).
  private fail(e: any) {
    if (this._errored) return;
    this._errored = true;
    this.emit('error');
    this.errorCb?.(e);
  }

  private element(): HTMLAudioElement {
    if (!this.audio) this.audio = new (window as any).Audio() as HTMLAudioElement;
    return this.audio;
  }

  prime() {
    try {
      const el = this.element();
      el.src = SILENT_WAV;
      const p: any = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch { /* priming is best-effort */ }
  }

  async load(uri: string) {
    // Reuse the primed element so the tap's permission carries over.
    const audio = this.element();
    try { audio.pause(); } catch { /* not playing */ }
    this._errored = false;
    const loadId = ++this._loadId;
    const current = () => this.audio === audio && this._loadId === loadId;
    audio.src = uri;
    this.emit('loading');
    if (typeof (audio as any).addEventListener === 'function') {
      audio.addEventListener('ended', () => {
        if (!current()) return;
        this.emit('ended');
        this.endedCb?.();
      }, { once: true });
      audio.addEventListener('error', (e) => {
        if (!current()) return;
        this.fail((audio as any).error ?? e);
      }, { once: true });
    }
    try { (audio as any).load?.(); } catch { /* engines also load on src set */ }
  }

  async setRate(rate: number) {
    if (this.audio) (this.audio as any).playbackRate = rate;
  }

  async play() {
    const audio = this.audio;
    if (!audio) return;
    try {
      // The element's play() resolves once sound is actually coming out, and
      // rejects if the file can't load or the browser blocks the sound.
      await audio.play();
    } catch (e: any) {
      if (this.audio !== audio) return;          // unloaded meanwhile
      if (e?.name === 'AbortError') return;      // paused/replaced before it started
      this.fail(e);
      throw e;
    }
    if (this.audio !== audio || this._errored) return;
    this.emit('playing');
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
  getDuration() { const d = this.audio?.duration ?? 0; return Number.isFinite(d) ? d : 0; }
  getStatus() { return this._status; }
  onEnded(cb: () => void) { this.endedCb = cb; }
  onError(cb: (e: any) => void) { this.errorCb = cb; }
  onStatusChange(cb: (s: AudioStatus, p: number, d: number) => void) { this.statusCb = cb; }

  async unload() {
    const audio = this.audio;
    this.audio = null;
    if (audio) {
      try { (audio as any).pause(); (audio as any).removeAttribute?.('src'); (audio as any).load?.(); } catch {}
    }
    this.emit('idle');
  }
}

// ── Native implementation (expo-av) ───────────────────────────────────────────
let nativeAudioModeSet = false;

class NativeAudio implements PlatformAudio {
  private Audio: any = null;
  private sound: any = null;
  private _status: AudioStatus = 'idle';
  private _errored = false;
  private endedCb: (() => void) | null = null;
  private errorCb: ((e: any) => void) | null = null;
  private statusCb: ((s: AudioStatus, p: number, d: number) => void) | null = null;
  private _position = 0;
  private _duration = 0;

  private emit(status: AudioStatus) {
    this._status = status;
    this.statusCb?.(status, this._position, this._duration);
  }

  private fail(e: any) {
    if (this._errored) return;
    this._errored = true;
    this.emit('error');
    this.errorCb?.(e);
  }

  private async ensureModule() {
    if (this.Audio) return;
    const expoAv = await import('expo-av');
    this.Audio = expoAv.Audio;
    if (!nativeAudioModeSet) {
      nativeAudioModeSet = true;
      // Play the story even when the iPhone's silent switch is on.
      try { await this.Audio.setAudioModeAsync({ playsInSilentModeIOS: true }); } catch { /* keep defaults */ }
    }
  }

  prime() { /* native apps have no autoplay gate */ }

  async load(uri: string) {
    await this.ensureModule();
    await this.unload();
    this._errored = false;
    this.emit('loading');
    let sound: any;
    try {
      const created = await this.Audio.Sound.createAsync({ uri }, { shouldPlay: false });
      sound = created.sound;
      const status = created.status;
      this._duration = status?.durationMillis ? status.durationMillis / 1000 : 0;
      this._position = status?.positionMillis ? status.positionMillis / 1000 : 0;
    } catch (e) {
      this.fail(e);
      throw e;
    }
    this.sound = sound;

    sound.setOnPlaybackStatusUpdate((s: any) => {
      if (this.sound !== sound) return;
      if (!s.isLoaded) {
        if (s.error) this.fail(s.error);
        return;
      }
      this._position = (s.positionMillis ?? 0) / 1000;
      this._duration = (s.durationMillis ?? 0) / 1000;
      if (s.didJustFinish) {
        this.emit('ended');
        this.endedCb?.();
        return;
      }
      // pause()/stop() set paused/idle themselves; only report the start here.
      if (s.isPlaying && this._status !== 'playing') this.emit('playing');
    });
  }

  async setRate(rate: number) {
    if (this.sound) await this.sound.setRateAsync(rate, true);
  }

  async play() {
    if (!this.sound) return;
    try {
      await this.sound.playAsync();
    } catch (e) {
      this.fail(e);
      throw e;
    }
    if (this._status !== 'playing') this.emit('playing');
  }

  async pause() {
    if (!this.sound) return;
    await this.sound.pauseAsync();
    this.emit('paused');
  }

  async stop() {
    if (!this.sound) return;
    await this.sound.stopAsync();
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
    const sound = this.sound;
    this.sound = null;
    if (sound) {
      try { sound.setOnPlaybackStatusUpdate(null); await sound.unloadAsync(); } catch {}
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
