/**
 * AI Teacher voice session: one Start → Stop cycle of listen → think → speak.
 *
 *  - Start asks for the microphone, speaks the greeting on the first Start of
 *    the visit, then listens. Each finished spoken turn is sent ONCE; the
 *    reply's segments are spoken one by one, and listening resumes after the
 *    last one — the student never presses Start again during a session.
 *  - The microphone is never on while the teacher speaks (recognition is only
 *    created after playback ends), so it can't hear itself.
 *  - Stop (or leaving the screen) ends the session immediately: microphone off,
 *    speech cancelled, the in-flight request aborted. Every callback carries
 *    the session id it was started with; anything from an older session —
 *    a late transcript, a late reply, a playback event — is ignored.
 */
import type { Segment, TurnResponse } from '../services/aiTeacherApi';

export type VoiceStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface Recognizer {
  onresult: ((text: string, isFinal: boolean) => void) | null;
  onend: (() => void) | null;
  onerror: ((code: string) => void) | null;
  start(): void;
  abort(): void;
}

export interface VoiceDrivers {
  supported(): boolean;
  requestMic(): Promise<{ granted: boolean; reason?: 'denied' | 'no-microphone' | 'unsupported' }>;
  createRecognizer(lang: 'en' | 'hi'): Recognizer;
  speak(text: string, lang: 'en' | 'hi', h: { onStart(): void; onBoundary(): void; onEnd(): void }): void;
  cancelSpeech(): void;
  setTimer(fn: () => void, ms: number): any;
  clearTimer(id: any): void;
}

export interface VoiceCallbacks {
  turn(transcript: string, signal: AbortSignal): Promise<TurnResponse>;
  greeting(): string;
  language(): 'en' | 'hi';
  onStatus(s: VoiceStatus): void;
  onCaption(text: string): void;
  onHeard?(text: string): void;
  /** Returns the caption to show while waiting for the student after this reply (or nothing). */
  onResponse(r: TurnResponse): string | void;
  onSegmentStart(seg: Segment, r: TurnResponse | null): void;
  onBoundary(): void;
  onNarrationDone(r: TurnResponse | null): void;
  onError(message: string): void;
}

export const END_OF_TURN_MS = 1100;

const MESSAGES = {
  unsupported: 'Voice needs Chrome or Edge on a computer or Android phone. Please open Aivorah there to use AI Teacher.',
  denied: 'Microphone access is blocked. Allow the microphone for this site in your browser, then press Start again.',
  noMic: "I can't find a microphone. Connect one, then press Start again.",
  failed: "I couldn't answer just now. Please ask again.",
};

export class VoiceSession {
  private sid = 0;
  private active = false;
  private greeted = false;
  private rec: Recognizer | null = null;
  private timer: any = null;
  private abort: AbortController | null = null;
  private lastSegments: Segment[] = [];
  private listenHint = '';

  constructor(private d: VoiceDrivers, private cb: VoiceCallbacks) {}

  get isActive() { return this.active; }
  private alive(sid: number) { return this.active && sid === this.sid; }
  private status(s: VoiceStatus) { this.cb.onStatus(s); }

  async start() {
    if (this.active) return;
    if (!this.d.supported()) { this.cb.onError(MESSAGES.unsupported); return; }
    const sid = ++this.sid;
    this.active = true;
    this.status('thinking');
    const mic = await this.d.requestMic().catch(() => ({ granted: false, reason: 'denied' as const }));
    if (sid !== this.sid) return; // stopped while asking
    if (!mic.granted) {
      this.active = false;
      this.status('idle');
      this.cb.onError(mic.reason === 'no-microphone' ? MESSAGES.noMic : mic.reason === 'unsupported' ? MESSAGES.unsupported : MESSAGES.denied);
      return;
    }
    if (!this.greeted) {
      this.greeted = true;
      const g = this.cb.greeting();
      await this.speakAll(sid, [{ id: 'greeting', caption: g, speech: g, reveal: [] }], null);
    }
    this.listen(sid);
  }

  stop() {
    this.sid += 1;
    this.active = false;
    if (this.timer) { this.d.clearTimer(this.timer); this.timer = null; }
    try { this.rec?.abort(); } catch { /* already stopped */ }
    this.rec = null;
    try { this.abort?.abort(); } catch { /* nothing in flight */ }
    this.abort = null;
    try { this.d.cancelSpeech(); } catch { /* nothing playing */ }
    this.cb.onCaption('');
    this.status('idle');
  }

  /** Caption shown while waiting for the student (e.g. after a practice question). */
  setListenHint(text: string) { this.listenHint = text; }

  private listen(sid: number) {
    if (!this.alive(sid)) return;
    this.status('listening');
    this.cb.onCaption(this.listenHint);
    const rec = this.d.createRecognizer(this.cb.language());
    this.rec = rec;
    let finalText = '';
    let interim = '';
    let done = false;
    const finish = () => {
      if (done || !this.alive(sid) || this.rec !== rec) return;
      const text = `${finalText} ${interim}`.replace(/\s+/g, ' ').trim();
      if (!text) return;
      done = true;
      if (this.timer) { this.d.clearTimer(this.timer); this.timer = null; }
      this.rec = null;
      try { rec.abort(); } catch { /* ended */ }
      this.handleTurn(sid, text);
    };
    rec.onresult = (text, isFinal) => {
      if (!this.alive(sid) || this.rec !== rec) return;
      if (isFinal) { finalText = `${finalText} ${text}`; interim = ''; } else interim = text;
      this.cb.onHeard?.(`${finalText} ${interim}`.trim());
      // End of turn: a short pause after the student stops speaking.
      if (this.timer) this.d.clearTimer(this.timer);
      this.timer = this.d.setTimer(finish, END_OF_TURN_MS);
    };
    rec.onend = () => {
      if (!this.alive(sid) || this.rec !== rec || done) return;
      if (`${finalText} ${interim}`.trim()) { finish(); return; }
      this.rec = null;
      this.listen(sid); // silence: keep listening
    };
    rec.onerror = (code) => {
      if (!this.alive(sid) || this.rec !== rec) return;
      if (code === 'not-allowed' || code === 'service-not-allowed' || code === 'audio-capture') {
        this.stop();
        this.cb.onError(code === 'audio-capture' ? MESSAGES.noMic : MESSAGES.denied);
      }
      // 'no-speech' / 'aborted' / 'network': onend follows and decides.
    };
    try { rec.start(); } catch { this.rec = null; this.stop(); this.cb.onError(MESSAGES.unsupported); }
  }

  private async handleTurn(sid: number, text: string) {
    if (!this.alive(sid)) return;
    this.status('thinking');
    this.cb.onCaption('');
    const ac = new AbortController();
    this.abort = ac;
    let r: TurnResponse;
    try {
      r = await this.cb.turn(text, ac.signal);
    } catch {
      if (!this.alive(sid)) return;
      r = { kind: 'error', language: this.cb.language(), board: 'keep', topic: null, practice: null, feedback: null, blocks: [], state: {}, segments: [{ id: 'err', caption: MESSAGES.failed, speech: MESSAGES.failed, reveal: [] }] } as TurnResponse;
    }
    if (!this.alive(sid)) return; // stopped while thinking: the late reply is dropped
    if (this.abort === ac) this.abort = null;
    const hint = this.cb.onResponse(r) || '';
    if (r.kind !== 'repeat') this.listenHint = hint; // a repeat keeps the waiting question's hint
    const segments = r.kind === 'repeat' ? this.lastSegments : r.segments;
    if (r.kind !== 'repeat') this.lastSegments = r.segments;
    await this.speakAll(sid, segments, r);
    if (!this.alive(sid)) return;
    this.cb.onNarrationDone(r);
    this.listen(sid);
  }

  private speakAll(sid: number, segments: Segment[], r: TurnResponse | null): Promise<void> {
    const lang = r?.language || this.cb.language();
    return segments.reduce<Promise<void>>((p, seg) => p.then(() => new Promise<void>((resolve) => {
      if (!this.alive(sid)) { resolve(); return; }
      this.status('speaking');
      let started = false;
      const begin = () => {
        if (started || !this.alive(sid)) return;
        started = true;
        this.cb.onCaption(seg.caption);
        this.cb.onSegmentStart(seg, r); // the board reveals what is actually being said
      };
      this.d.speak(seg.speech, lang, {
        onStart: begin,
        onBoundary: () => { if (this.alive(sid)) this.cb.onBoundary(); },
        onEnd: () => { begin(); resolve(); },
      });
    })), Promise.resolve());
  }
}
