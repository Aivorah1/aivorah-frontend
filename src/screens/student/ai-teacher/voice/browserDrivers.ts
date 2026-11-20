// Browser speech for AI Teacher: Web Speech recognition (Chrome, Edge,
// Android Chrome) and speech synthesis through the app's shared voice picker
// (lesson-screen/utils/audio.ts, which also picks a Hindi voice for Devanagari).
import { Platform } from 'react-native';
import { speakWithBoundary, stopSpeaking } from '../../learning-paths/lesson-screen/utils/audio';
import type { Recognizer, VoiceDrivers } from './VoiceSession';

const recClass = (): any => (Platform.OS === 'web' && typeof window !== 'undefined'
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null : null);

export const browserDrivers: VoiceDrivers = {
  supported() {
    return !!recClass() && typeof window !== 'undefined' && !!(window as any).speechSynthesis;
  },
  async requestMic() {
    const md = typeof navigator !== 'undefined' ? (navigator as any).mediaDevices : null;
    if (!md?.getUserMedia) return { granted: true }; // recognition itself will ask
    try {
      const stream = await md.getUserMedia({ audio: true });
      stream.getTracks().forEach((t: any) => t.stop()); // permission only; recognition opens its own input
      return { granted: true };
    } catch (e: any) {
      const name = e?.name || '';
      return { granted: false, reason: name === 'NotFoundError' || name === 'OverconstrainedError' ? 'no-microphone' : 'denied' };
    }
  },
  createRecognizer(lang) {
    const Rec = recClass();
    const rec = new Rec();
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    const wrapper: Recognizer = {
      onresult: null, onend: null, onerror: null,
      start: () => rec.start(),
      abort: () => { try { rec.abort(); } catch { /* ended */ } },
    };
    rec.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const r = event.results[i];
        wrapper.onresult?.(r[0]?.transcript || '', !!r.isFinal);
      }
    };
    rec.onend = () => wrapper.onend?.();
    rec.onerror = (event: any) => wrapper.onerror?.(event?.error || 'other');
    return wrapper;
  },
  speak(text, lang, h) {
    speakWithBoundary(text, (charIndex) => h.onBoundary(charIndex), () => h.onEnd(), 0.95, lang === 'hi' ? { lang: 'hi' } : undefined, () => h.onStart());
  },
  cancelSpeech() {
    // Also clears the shared helper's queued restart, so nothing speaks after Stop.
    try { stopSpeaking(); } catch { /* not available */ }
    try { (window as any).speechSynthesis?.cancel(); } catch { /* not available */ }
  },
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (id) => clearTimeout(id),
};
