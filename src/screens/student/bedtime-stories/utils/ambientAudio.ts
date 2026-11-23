import { Platform } from 'react-native';
import SERVER_URL from '../../../../config/bedtimeStoriesServerUrl';
import { STORY_AMBIENT, MOOD_PROFILES, MOOD_KEYWORDS, MOOD_TRACK, STORY_MOOD } from '../constants';
import type { AmbientProfile } from '../types';

export function getPageMoodProfile(page: { sceneIcon?: string; sceneLabel?: string; sceneEmoji?: string; text?: string } | null | undefined, storyId: string): AmbientProfile {
  const haystack = `${page?.sceneLabel ?? ''} ${page?.text ?? ''}`;
  for (const { mood, words } of MOOD_KEYWORDS) {
    if (words.test(haystack)) return MOOD_PROFILES[mood];
  }
  return STORY_AMBIENT[storyId] ?? { root: 220, style: 'tanpura' };
}

// Page flip sound — served from Express so it works in web builds
let _flipAudio: HTMLAudioElement | null = null;

export function playPageFlip() {
  if (Platform.OS !== 'web') return;
  try {
    if (!_flipAudio) {
      _flipAudio = new Audio(`${SERVER_URL}/sounds/page-flip.mp3`);
      _flipAudio.volume = 0.6;
    }
    _flipAudio.currentTime = 0;
    _flipAudio.play().catch(() => {});
  } catch {}
}

// Registry of EVERY ambient source ever created, so a pause can guarantee silence
// even if a wrapper instance leaks (e.g. auto-start race). Safety net.
const _ambientAudios = new Set<HTMLAudioElement>();
const _ambientCtxs   = new Set<AudioContext>();
const _ambientNative = new Set<any>(); // expo-av Sound instances on native
export function silenceAllAmbient() {
  _ambientAudios.forEach(a => { try { a.pause(); } catch {} });
  _ambientCtxs.forEach(c => { try { if (c.state === 'running') c.suspend(); } catch {} });
  _ambientNative.forEach(s => { try { s.pauseAsync(); } catch {} });
}

// Indian ambient music via Web Audio API — story-specific instrument styles
function createAmbientMusic(storyId: string, moodProfile?: AmbientProfile) {
  if (Platform.OS !== 'web') return null;
  try {
    const profile = moodProfile ?? STORY_AMBIENT[storyId] ?? { root: 220, style: 'tanpura' };
    const intensity = profile.intensity ?? 1;
    const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    _ambientCtxs.add(ctx);
    if (ctx.state === 'suspended') ctx.resume();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    function makeReverb(duration: number, decay: number) {
      const len = ctx.sampleRate * duration;
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      const conv = ctx.createConvolver();
      conv.buffer = buf;
      return conv;
    }
    const reverb = makeReverb(2.5, 3);
    reverb.connect(master);

    const root = profile.root;
    const nodes: any[] = [];

    if (profile.style === 'tanpura') {
      const strings = [root * 0.75, root, root * 2, root * 4/3];
      strings.forEach((freq, si) => {
        function pluck() {
          try {
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            const filt = ctx.createBiquadFilter();
            filt.type = 'bandpass'; filt.frequency.value = freq; filt.Q.value = 12;
            osc.type = 'sawtooth'; osc.frequency.value = freq;
            osc.connect(filt); filt.connect(env); env.connect(reverb); env.connect(master);
            env.gain.setValueAtTime(0, ctx.currentTime);
            env.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 0.04);
            env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);
            osc.start(); osc.stop(ctx.currentTime + 3.6);
            const tid = setTimeout(pluck, (si * 1800 + 7200));
            nodes.push(tid);
          } catch {}
        }
        const initDelay = si * 1800;
        const t = setTimeout(pluck, initDelay);
        nodes.push(t);
      });

    } else if (profile.style === 'flute') {
      const scale = [root, root*9/8, root*5/4, root*4/3, root*3/2, root*5/3, root*15/8, root*2];
      const phrases = [[0,2,4,2,0], [4,5,4,2,0], [0,4,7,4,0], [2,4,5,4,2]];
      let phraseIdx = 0;
      function playPhrase() {
        try {
          const phrase = phrases[phraseIdx % phrases.length];
          phraseIdx++;
          phrase.forEach((deg, ni) => {
            const freq = scale[deg % scale.length];
            const t0 = ctx.currentTime + ni * 0.9;
            const noiseLen = ctx.sampleRate * 0.7;
            const nbuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
            const nd = nbuf.getChannelData(0);
            for (let i = 0; i < noiseLen; i++) nd[i] = (Math.random() * 2 - 1) * 0.015;
            const nsrc = ctx.createBufferSource(); nsrc.buffer = nbuf;
            const nbpf = ctx.createBiquadFilter(); nbpf.type = 'bandpass'; nbpf.frequency.value = freq * 1.1; nbpf.Q.value = 8;
            const nenv = ctx.createGain(); nenv.gain.value = 0;
            nsrc.connect(nbpf); nbpf.connect(nenv); nenv.connect(master);
            nenv.gain.setValueAtTime(0, t0); nenv.gain.linearRampToValueAtTime(0.04, t0 + 0.08); nenv.gain.linearRampToValueAtTime(0, t0 + 0.65);
            nsrc.start(t0); nsrc.stop(t0 + 0.7);
            const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = freq;
            const vib = ctx.createOscillator(); vib.type = 'sine'; vib.frequency.value = 5.5;
            const vibG = ctx.createGain(); vibG.gain.value = freq * 0.012;
            vib.connect(vibG); vibG.connect(osc.frequency);
            const env = ctx.createGain(); env.gain.value = 0;
            osc.connect(env); env.connect(reverb); env.connect(master);
            env.gain.setValueAtTime(0, t0); env.gain.linearRampToValueAtTime(0.06, t0 + 0.12); env.gain.setValueAtTime(0.055, t0 + 0.5); env.gain.linearRampToValueAtTime(0, t0 + 0.75);
            osc.start(t0); vib.start(t0); osc.stop(t0 + 0.8); vib.stop(t0 + 0.8);
          });
          const nextIn = phrase.length * 900 + 1800;
          const t = setTimeout(playPhrase, nextIn);
          nodes.push(t);
        } catch {}
      }
      playPhrase();

    } else if (profile.style === 'tabla') {
      const bpm = profile.bpm ?? 52;
      const beat = 60000 / bpm;
      const pattern = [1,0,0.6,0,1,0,0.6,0.4,1,0,0.6,0,1,0,0.6,0];
      let step = 0;
      function tick() {
        try {
          const vel = pattern[step % pattern.length];
          if (vel > 0) {
            const freq = step % 4 === 0 ? root * 0.5 : root * 0.67;
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = freq * 2; filt.Q.value = 6;
            osc.type = 'sine'; osc.frequency.setValueAtTime(freq * 3, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(freq, ctx.currentTime + 0.06);
            osc.connect(filt); filt.connect(env); env.connect(reverb); env.connect(master);
            env.gain.setValueAtTime(vel * 0.07, ctx.currentTime);
            env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.start(); osc.stop(ctx.currentTime + 0.28);
          }
          step++;
          const t = setTimeout(tick, beat / 2);
          nodes.push(t);
        } catch {}
      }
      tick();

    } else if (profile.style === 'veena') {
      const chord = [root, root*5/4, root*3/2, root*2];
      function arpeggio() {
        try {
          chord.forEach((freq, fi) => {
            const t0 = ctx.currentTime + fi * 0.22;
            const osc = ctx.createOscillator();
            const env = ctx.createGain();
            const filt = ctx.createBiquadFilter(); filt.type = 'peaking'; filt.frequency.value = freq; filt.gain.value = 6; filt.Q.value = 2;
            osc.type = 'triangle'; osc.frequency.value = freq;
            const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = freq * 2;
            const g2 = ctx.createGain(); g2.gain.value = 0.18;
            osc2.connect(g2); g2.connect(env);
            osc.connect(filt); filt.connect(env); env.connect(reverb); env.connect(master);
            env.gain.setValueAtTime(0, t0);
            env.gain.linearRampToValueAtTime(0.06, t0 + 0.02);
            env.gain.exponentialRampToValueAtTime(0.001, t0 + 4.0);
            osc.start(t0); osc2.start(t0); osc.stop(t0 + 4.1); osc2.stop(t0 + 4.1);
          });
          const t = setTimeout(arpeggio, 6000);
          nodes.push(t);
        } catch {}
      }
      arpeggio();
    }

    [root, root * 2].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain(); g.gain.value = [0.018, 0.009][i];
      const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 600;
      osc.type = 'sine'; osc.frequency.value = freq;
      osc.connect(filt); filt.connect(g); g.connect(master);
      osc.start();
      nodes.push(osc);
    });

    const TARGET_GAIN = 0.35 * intensity;
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(TARGET_GAIN, ctx.currentTime + 3);

    return {
      ctx,
      master,
      pause() {
        try {
          const now = ctx.currentTime, v = master.gain.value;
          master.gain.cancelScheduledValues(now);
          master.gain.setValueAtTime(v, now);
          master.gain.linearRampToValueAtTime(0, now + 0.25);
          setTimeout(() => { try { ctx.suspend(); } catch {} }, 280);
        } catch {}
      },
      resume() {
        try {
          if (ctx.state === 'suspended') ctx.resume();
          const now = ctx.currentTime, v = master.gain.value;
          master.gain.cancelScheduledValues(now);
          master.gain.setValueAtTime(Math.max(v, 0.0001), now);
          master.gain.linearRampToValueAtTime(TARGET_GAIN, now + 0.9);
        } catch {}
      },
      stop() {
        try {
          const now = ctx.currentTime, v = master.gain.value;
          master.gain.cancelScheduledValues(now);
          master.gain.setValueAtTime(v, now);
          master.gain.linearRampToValueAtTime(0, now + 1.2);
          nodes.forEach(n => { try { if (typeof n === 'number') clearTimeout(n); else n.stop?.(); } catch {} });
          setTimeout(() => { try { ctx.close(); } catch {} _ambientCtxs.delete(ctx); }, 1600);
        } catch {}
      }
    };
  } catch { return null; }
}

// Smoothly ramp an <audio> element's volume (web only).
function rampVolume(audio: HTMLAudioElement, to: number, ms: number) {
  const from = audio.volume; const steps = 24; let i = 0;
  const id = setInterval(() => {
    i++;
    try { audio.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps))); } catch {}
    if (i >= steps) clearInterval(id);
  }, Math.max(10, ms / steps));
  return id;
}

// Looping recorded background track — web version (HTML5 Audio).
function createAmbientTrackWeb(url: string) {
  try {
    const audio = new (window as any).Audio(url) as HTMLAudioElement;
    _ambientAudios.add(audio);
    audio.loop = true;
    audio.volume = 0;
    const TARGET = 0.28;
    const pr = audio.play(); if (pr && (pr as any).catch) (pr as any).catch(() => {});
    rampVolume(audio, TARGET, 2000);
    return {
      _audio: audio,
      pause()  { try { audio.pause(); } catch {} },
      resume() { try { audio.volume = 0; const p = audio.play(); if (p && (p as any).catch) (p as any).catch(() => {}); } catch {} rampVolume(audio, TARGET, 700); },
      stop()   { try { audio.pause(); audio.src = ''; } catch {} _ambientAudios.delete(audio); },
    };
  } catch { return null; }
}

// Looping recorded background track — native version (expo-av).
function createAmbientTrackNative(url: string) {
  let Sound: any = null;
  let sound: any = null;
  let volumeTimer: ReturnType<typeof setInterval> | null = null;
  let currentVolume = 0;
  const TARGET = 0.28;

  async function ensureLoaded() {
    if (Sound) return;
    const expoAv = await import('expo-av');
    Sound = expoAv.Audio;
  }

  async function init() {
    await ensureLoaded();
    const { sound: s } = await Sound.Sound.createAsync(
      { uri: url },
      { shouldPlay: false, isLooping: true, isMuted: false },
      { playsInSilentModeIOS: true },
    );
    sound = s;
    _ambientNative.add(sound);
    sound.setOnPlaybackStatusUpdateListener((st: any) => {
      if (st.isLoaded && st.didJustFinish && !st.isLooping) {
        // safety: force loop if server track isn't looping
        sound.setIsLoopingAsync(true).catch(() => {});
      }
    });
    await sound.playAsync();
    // Ramp volume up over 2s
    const steps = 24; let i = 0;
    volumeTimer = setInterval(() => {
      i++;
      currentVolume = Math.min(TARGET, TARGET * (i / steps));
      sound.setVolumeAsync(currentVolume).catch(() => {});
      if (i >= steps) clearInterval(volumeTimer!);
    }, Math.max(10, 2000 / steps));
  }

  return {
    async pause() {
      if (volumeTimer) { clearInterval(volumeTimer); volumeTimer = null; }
      try { await sound?.pauseAsync(); } catch {}
    },
    async resume() {
      try { await sound?.setVolumeAsync(0); await sound?.playAsync(); } catch {}
      const steps = 8; let i = 0;
      volumeTimer = setInterval(() => {
        i++;
        currentVolume = Math.min(TARGET, TARGET * (i / steps));
        sound?.setVolumeAsync(currentVolume).catch(() => {});
        if (i >= steps) clearInterval(volumeTimer!);
      }, Math.max(10, 700 / steps));
    },
    async stop() {
      if (volumeTimer) { clearInterval(volumeTimer); volumeTimer = null; }
      try {
        sound?.setOnPlaybackStatusUpdateListener(null);
        await sound?.stopAsync();
        await sound?.unloadAsync();
      } catch {}
      if (sound) _ambientNative.delete(sound);
      sound = null;
    },
    _init: init, // called by createAmbient after construction
  };
}

// Prefer a real mood track if one is mapped; if the file is missing/errors, seamlessly fall back to the synth.
export function createAmbient(storyId: string, page?: { sceneIcon?: string; sceneLabel?: string; sceneEmoji?: string; text?: string } | null) {
  const moodProfile = getPageMoodProfile(page, storyId);
  const mood = STORY_MOOD[storyId];
  const path = mood ? MOOD_TRACK[mood] : null;

  if (Platform.OS === 'web') {
    let inner: any = null;
    let paused = false;
    const fallBackToSynth = () => { inner = createAmbientMusic(storyId, moodProfile); if (paused) { try { inner?.pause?.(); } catch {} } };
    if (path) {
      const track = createAmbientTrackWeb(`${SERVER_URL}${path}`);
      if (track) {
        inner = track;
        track._audio?.addEventListener?.('error', () => { try { track.stop(); } catch {} fallBackToSynth(); }, { once: true });
      } else { fallBackToSynth(); }
    } else { fallBackToSynth(); }
    return {
      pause()  { try { inner?.pause?.(); } catch {} },
      resume() { try { inner?.resume?.(); } catch {} },
      stop()   { try { inner?.stop?.(); } catch {} inner = null; },
    };
  }

  // ── Native path ──
  let inner: any = null;
  let initialized = false;
  const initInner = () => {
    if (initialized) return;
    initialized = true;
    if (path) {
      const track = createAmbientTrackNative(`${SERVER_URL}${path}`);
      track._init().then(() => { inner = track; }).catch(() => { inner = createAmbientMusic(storyId, moodProfile); });
    } else {
      inner = createAmbientMusic(storyId, moodProfile); // synth returns null on native → silent fallback (acceptable)
    }
  };
  // Kick off async init lazily on first interaction (ambient starts with narration in useStoryReader).
  return {
    pause()  { try { inner?.pause?.(); } catch {} },
    resume() { try { inner?.resume?.(); } catch {} },
    stop()   { try { inner?.stop?.(); } catch {} inner = null; },
    // Called by useStoryReader right after ambientRef is assigned to start playback.
    start()  { initInner(); },
  };
}
