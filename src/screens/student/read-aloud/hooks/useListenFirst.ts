import { useCallback, useEffect, useRef, useState } from 'react';

import { notify } from '../utils/notify';
import { fetchSpeech } from '../services/readAloudApi';
import type { Passage, WordTiming } from '../types';
import { buildWordBoundaries, estimatedWordIndex, timedWordIndex } from '../utils/listenTiming';
import { splitWords } from '../utils/wordMatching';
import { createPlatformAudio, type PlatformAudio, type AudioStatus } from '../../../../utils/platformAudio';

const hasSpeechSynthesis = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

// "Listen first": plays the passage (ElevenLabs, else the browser voice) and highlights each word.
export function useListenFirst(passage: Passage | null) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const audioRef = useRef<PlatformAudio | null>(null);
  const timingsRef = useRef<WordTiming[] | null>(null);
  const rafRef = useRef(0);
  const passageRef = useRef(passage);
  const genRef = useRef(0);

  useEffect(() => { passageRef.current = passage; }, [passage]);

  const cancelHighlightLoop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
  }, []);

  const resetPlayback = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setHighlightIdx(-1);
    setIsLoading(false);
  }, []);

  const startHighlightLoop = useCallback((audio: PlatformAudio) => {
    cancelHighlightLoop();
    const timings = timingsRef.current;
    const words = splitWords(passageRef.current?.text || '');
    const bounds = timings ? null : buildWordBoundaries(words);
    let last = -1;
    const tick = () => {
      const status = audio.getStatus();
      if (status === 'paused' || status === 'ended' || status === 'error' || status === 'idle') return;
      if (!timings && !audio.getDuration()) { rafRef.current = requestAnimationFrame(tick); return; }
      const idx = timings
        ? timedWordIndex(timings, audio.getPosition(), audio.getDuration())
        : estimatedWordIndex(bounds!, audio.getPosition(), audio.getDuration());
      if (idx !== last) { last = idx; setHighlightIdx(idx); }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [cancelHighlightLoop]);

  const playBrowserVoice = useCallback(() => {
    const p = passageRef.current;
    if (!hasSpeechSynthesis() || !p) {
      resetPlayback();
      notify('Audio Unavailable', 'Text-to-speech is currently unavailable on this device.');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(p.text);
      utterance.rate = 0.9;
      utterance.lang = 'en-US';
      const lastWord = splitWords(p.text).length - 1;
      let wordIdx = 0;
      setIsLoading(false);
      setIsPlaying(true);
      setIsPaused(false);
      setHighlightIdx(0);
      utterance.onboundary = (e: SpeechSynthesisEvent) => {
        if (e.name === 'word' || e.charIndex !== undefined) {
          setHighlightIdx(wordIdx);
          if (wordIdx < lastWord) wordIdx++;
        }
      };
      utterance.onend = resetPlayback;
      utterance.onerror = resetPlayback;
      window.speechSynthesis.speak(utterance);
    } catch {
      resetPlayback();
    }
  }, [resetPlayback]);

  const resume = useCallback(() => {
    if (hasSpeechSynthesis() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return true;
    }
    const audio = audioRef.current;
    if (audio && audio.getStatus() === 'paused') {
      audio.play().then(() => {
        setIsPaused(false);
        setIsPlaying(true);
        startHighlightLoop(audio);
      }).catch(() => {});
      return true;
    }
    return false;
  }, [startHighlightLoop]);

  const play = useCallback(async () => {
    const p = passageRef.current;
    if (!p) return;
    if (resume()) return;

    const gen = ++genRef.current;
    setIsLoading(true);
    setIsPlaying(true);
    setIsPaused(false);
    setHighlightIdx(0);
    // Unlock the player inside the tap, before the fetch (browser autoplay policy).
    const audio = createPlatformAudio();
    audio.prime();
    try {
      const data = await fetchSpeech(p.text);
      if (!data.audioUrl) { playBrowserVoice(); return; }

      audioRef.current = audio;
      timingsRef.current = data.wordTimings || null;

      audio.onStatusChange((status: AudioStatus) => {
        if (genRef.current !== gen) return;
        if (status === 'playing') {
          setIsLoading(false);
          startHighlightLoop(audio);
        }
      });
      audio.onEnded(() => { cancelHighlightLoop(); resetPlayback(); });
      audio.onError(() => { cancelHighlightLoop(); playBrowserVoice(); });

      await audio.load(data.audioUrl);
      if (genRef.current !== gen) { await audio.unload(); return; }
      await audio.play();
    } catch {
      playBrowserVoice();
    }
  }, [resume, playBrowserVoice, startHighlightLoop, cancelHighlightLoop, resetPlayback]);

  const pause = useCallback(() => {
    if (hasSpeechSynthesis() && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
      return;
    }
    const audio = audioRef.current;
    if (audio && audio.getStatus() === 'playing') {
      audio.pause().catch(() => {});
      cancelHighlightLoop();
      setIsPaused(true);
      setIsPlaying(false);
    }
  }, [cancelHighlightLoop]);

  const stop = useCallback(() => {
    if (hasSpeechSynthesis()) {
      try { window.speechSynthesis.cancel(); } catch { /* already stopped */ }
    }
    cancelHighlightLoop();
    const audio = audioRef.current;
    if (audio) {
      audio.stop().catch(() => {});
      audio.unload().catch(() => {});
      audioRef.current = null;
    }
    timingsRef.current = null;
    resetPlayback();
  }, [cancelHighlightLoop, resetPlayback]);

  // Leaving the screen must silence the narration.
  useEffect(() => () => {
    if (hasSpeechSynthesis()) {
      try { window.speechSynthesis.cancel(); } catch { /* already stopped */ }
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const audio = audioRef.current;
    if (audio) { audio.stop().catch(() => {}); audio.unload().catch(() => {}); audioRef.current = null; }
  }, []);

  return {
    isPlaying,
    isPaused,
    isLoading,
    highlightIdx,
    toggle: isPlaying ? pause : isPaused ? () => { resume(); } : play,
    stop,
  };
}
