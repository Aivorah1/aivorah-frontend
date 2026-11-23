import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import SERVER_URL from '../../../../config/bedtimeStoriesServerUrl';
import { splitWords, buildBoundaries } from '../utils/textFormatting';
import { playPageFlip, silenceAllAmbient, createAmbient } from '../utils/ambientAudio';
import { createPlatformAudio, type PlatformAudio, type AudioStatus } from '../../../../utils/platformAudio';
import type { Story, VoiceOption } from '../types';

export function useStoryReader(storyId: string) {
  const [story,        setStory]        = useState<Story | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [currentPage,  setCurrentPage]  = useState(0);
  const [voice,        setVoice]        = useState<VoiceOption>('grandmother');
  const [isLoading,    setIsLoading]    = useState(false);
  const [playing,      setPlaying]      = useState(false);
  const [autoPlay,     setAutoPlay]     = useState(false);
  const [wordIndex,    setWordIndex]    = useState(0);
  const [donePages,    setDonePages]    = useState<Set<number>>(new Set());
  const [playbackRate, setPlaybackRate] = useState(1);
  const [donePagesLoaded, setDonePagesLoaded] = useState(false);
  const [resumedFrom,  setResumedFrom]  = useState<number | null>(null);
  const didResume      = useRef(false);

  const audioRef   = useRef<PlatformAudio | null>(null);
  const ambientRef = useRef<any>(null);
  const playGenRef = useRef(0);
  const fadeAnim   = useRef(new Animated.Value(1)).current;
  const slideAnim  = useRef(new Animated.Value(0)).current;
  const rafRef     = useRef<number>(0);
  const audioMeta  = useRef<{ words: string[]; timings: { startTime: number; endTime: number }[] | null; wordBounds: number[] | null; timingProvider: string } | null>(null);

  // Load completed pages from storage
  useEffect(() => {
    AsyncStorage.getItem(`story_done_${storyId}`).then(v => {
      if (v) setDonePages(new Set(JSON.parse(v)));
    }).catch(() => {}).finally(() => setDonePagesLoaded(true));
  }, [storyId]);

  // Resume where the reader left off (YouTube-style): jump to the first page not yet finished.
  useEffect(() => {
    if (didResume.current || !story || !donePagesLoaded) return;
    didResume.current = true;
    const idx = story.pages.findIndex(p => !donePages.has(p.pageNumber));
    if (idx > 0) {                 // -1 (all done) or 0 (at start) → no resume needed
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(idx);
      setResumedFrom(idx + 1);
    }
  }, [story, donePagesLoaded, donePages]);

  // Auto-hide the "resumed" banner after a few seconds.
  useEffect(() => {
    if (resumedFrom == null) return;
    const t = setTimeout(() => setResumedFrom(null), 8000);
    return () => clearTimeout(t);
  }, [resumedFrom]);

  useEffect(() => {
    fetch(`${SERVER_URL}/stories/${storyId}`)
      .then(r => r.json())
      .then((data: Story) => {
        setStory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => { stopAudio(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]);

  // Reset word highlight when the page changes.
  const [wordIndexPage, setWordIndexPage] = useState(currentPage);
  if (wordIndexPage !== currentPage) {
    setWordIndexPage(currentPage);
    setWordIndex(0);
  }

  // Apply playback rate change to audio that's already playing
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.setRate(playbackRate).catch(() => {});
    }
  }, [playbackRate]);

  useEffect(() => {
    if (autoPlay && story) {
      const page = story.pages[currentPage];
      if (page) speakPage(page.pageNumber);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, autoPlay]);

  // ── rAF-based highlight loop (60 fps) — speed-aware word sync ──────────────
  function cancelHighlightLoop() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
  }

  function startHighlightLoop(
    audio: PlatformAudio,
    words: string[],
    timings: { startTime: number; endTime: number }[] | null,
    wordBounds: number[] | null,
    timingProvider: string = 'none',
  ) {
    cancelHighlightLoop();
    let lastRendered = -1;
    function tick() {
      if (!audio) return;
      const status = audio.getStatus();
      if (status === 'paused' || status === 'ended' || status === 'error' || status === 'idle') return;
      let idx: number;
      const position = audio.getPosition();
      const duration = audio.getDuration();
      if (timings) {
        const t = position;
        idx = 0;
        for (let i = 0; i < timings.length; i++) {
          const wordEnd = timings[i + 1]?.startTime ?? (duration + 1);
          if (t >= timings[i].startTime && t < wordEnd) { idx = i; break; }
          if (t >= timings[i].startTime) idx = i;
        }
      } else {
        if (!duration) { rafRef.current = requestAnimationFrame(tick); return; }
        const LAG = 0.18 / (playbackRate || 1);
        const t = Math.max(0, position - LAG);
        const ratio = t / duration;
        const found = wordBounds!.findIndex(b => ratio < b);
        idx = found === -1 ? words.length - 1 : found;
      }
      if (idx !== lastRendered) { lastRendered = idx; setWordIndex(idx); }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function markPageDone(pageNum: number) {
    setDonePages(prev => {
      const next = new Set(prev).add(pageNum);
      AsyncStorage.setItem(`story_done_${storyId}`, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  }

  function pauseAudio() {
    cancelHighlightLoop();
    if (audioRef.current) audioRef.current.pause().catch(() => {});
    try { ambientRef.current?.pause(); } catch {}
    silenceAllAmbient();
    setPlaying(false);
  }

  function stopAudio() {
    cancelHighlightLoop();
    audioMeta.current = null;
    playGenRef.current++;
    if (audioRef.current) {
      audioRef.current.stop().catch(() => {});
      audioRef.current.unload().catch(() => {});
      audioRef.current = null;
    }
    ambientRef.current?.stop(); ambientRef.current = null;
    setIsLoading(false); setPlaying(false);
  }

  function resumeAudio() {
    if (!audioRef.current) return;
    audioRef.current.play().then(() => {
      if (audioMeta.current) {
        const { words, timings, wordBounds, timingProvider } = audioMeta.current;
        startHighlightLoop(audioRef.current!, words, timings, wordBounds, timingProvider);
      }
      try { ambientRef.current?.resume(); } catch {}
      setPlaying(true);
    }).catch(() => {});
  }

  async function speakPage(pageNum: number) {
    if (!story) return;
    // If audio loaded and paused mid-way, resume from same position
    if (audioRef.current && audioRef.current.getStatus() === 'paused' && audioRef.current.getPosition() > 0) {
      resumeAudio(); return;
    }
    stopAudio();
    const gen = ++playGenRef.current;
    setIsLoading(true);
    try {
      const res  = await fetch(`${SERVER_URL}/stories/${story.id}/audio/${pageNum}?narrator=${voice}`);
      const data = await res.json();
      if (playGenRef.current !== gen) return;
      if (!data.audioUrl) { setIsLoading(false); return; }

      const audio = createPlatformAudio();
      audioRef.current = audio;

      const pageText      = story.pages.find(p => p.pageNumber === pageNum)?.text ?? '';
      const words         = splitWords(pageText);
      const timings: { startTime: number; endTime: number }[] | null = data.wordTimings || null;
      const wordBounds    = timings ? null : buildBoundaries(words);
      const timingProvider: string = data.timingProvider || 'none';
      audioMeta.current = { words, timings, wordBounds, timingProvider };

      // Start ambient music matched to this page's scene/mood
      const currentPageObj = story.pages.find(p => p.pageNumber === pageNum);
      ambientRef.current = createAmbient(story.id, currentPageObj);
      ambientRef.current?.start?.();

      audio.setRate(playbackRate).catch(() => {});
      audio.onStatusChange((status: AudioStatus) => {
        if (status === 'playing' && playGenRef.current === gen) {
          setIsLoading(false);
          setPlaying(true);
          startHighlightLoop(audio, words, timings, wordBounds, timingProvider);
        }
      });
      audio.onEnded(() => {
        cancelHighlightLoop();
        setWordIndex(words.length);
        setPlaying(false);
        markPageDone(pageNum);
        ambientRef.current?.stop(); ambientRef.current = null;
        if (autoPlay && story && currentPage < story.pages.length - 1) goToPage(currentPage + 1);
      });
      audio.onError(() => {
        cancelHighlightLoop();
        setIsLoading(false); setPlaying(false);
        ambientRef.current?.stop(); ambientRef.current = null;
      });

      await audio.load(`${SERVER_URL}${data.audioUrl}`);
      if (playGenRef.current !== gen) { await audio.unload(); return; }
      await audio.play();
    } catch {
      if (playGenRef.current === gen) { setIsLoading(false); setPlaying(false); }
    }
  }

  function animateTurn(cb: () => void) {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0,   duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -16, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      cb(); slideAnim.setValue(16);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }

  function goToPage(idx: number) {
    if (!story) return;
    playPageFlip();
    stopAudio();
    animateTurn(() => setCurrentPage(idx));
  }

  const isPaused = !playing && !isLoading && audioRef.current && audioRef.current.getStatus() !== 'idle' && audioRef.current.getStatus() !== 'ended';

  return {
    story, loading, currentPage, voice, setVoice, isLoading, playing, autoPlay, setAutoPlay,
    wordIndex, donePages, playbackRate, setPlaybackRate, resumedFrom, setResumedFrom,
    fadeAnim, slideAnim, isPaused,
    pauseAudio, stopAudio, resumeAudio, speakPage, goToPage,
  };
}
