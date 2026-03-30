// components/AudioCues.tsx — Subtle multi-sensory audio feedback using Web Audio API
'use client';

import { useEffect, useRef, memo, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';

export default memo(function AudioCues() {
  const phase = useAppStore((s) => s.pipelinePhase);
  const currentVideoPath = useAppStore((s) => s.currentVideoPath);
  const prevPhaseRef = useRef(phase);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const displayAudioRef = useRef<HTMLAudioElement | null>(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  // Water ripple — soft filtered noise burst, like a droplet
  const playWaterRipple = useCallback(() => {
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const duration = 0.8;
      const now = ctx.currentTime;

      // Create noise buffer
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Bandpass filter — water-like frequency
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + duration);
      filter.Q.value = 2;

      // Gain envelope
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(now);
      source.stop(now + duration);
    } catch {
      // Silently fail — audio cues are enhancement only
    }
  }, [getAudioCtx]);

  // Chime — soft bell-like tone for emotion detection
  const playChime = useCallback(() => {
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const duration = 1.5;

      // Two sine oscillators for a bell-like tone (fundamental + overtone)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now); // E6 (fifth)

      // Gain envelopes
      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.08, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.04, now + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + duration);
      osc2.start(now);
      osc2.stop(now + duration * 0.7);
    } catch {
      // Silently fail
    }
  }, [getAudioCtx]);

  // Setup ambient background audio (plays during listening/processing)
  useEffect(() => {
    const audio = new Audio('/ambient.mp3');
    audio.loop = true;
    audio.volume = 0.25; // Warm, subtle background level
    ambientAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Setup display audio (plays during image display — NOT during video)
  useEffect(() => {
    const audio = new Audio('/displayaudio.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    displayAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Control ambient audio based on pipeline phase
  useEffect(() => {
    const audio = ambientAudioRef.current;
    if (!audio) return;

    // Play while system is actively working (listening through generation), stop when displayed or idle
    const shouldPlay = ['listening', 'processing', 'showing_prompt', 'revealing'].includes(phase);

    if (shouldPlay) {
      if (audio.paused) {
        audio.play().catch(err => {
          console.warn('[AudioCues] Ambient audio autoplay blocked by browser policy:', err);
        });
      }
    } else {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0; // reset for next time
      }
    }
  }, [phase]);

  // Control display audio based on pipeline phase and content type
  // - Plays during revealing/displaying phases ONLY when an image is shown (no video)
  // - For video, the <video> element's own audio plays instead
  useEffect(() => {
    const audio = displayAudioRef.current;
    if (!audio) return;

    const isDisplayPhase = phase === 'revealing' || phase === 'displaying';
    const isVideoPlaying = !!currentVideoPath;

    // Play displayaudio.mp3 only for IMAGE display (not video — video has its own audio)
    const shouldPlay = isDisplayPhase && !isVideoPlaying;

    if (shouldPlay) {
      if (audio.paused) {
        audio.play().catch(err => {
          console.warn('[AudioCues] Display audio autoplay blocked by browser policy:', err);
        });
      }
    } else {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0; // reset for next play
      }
    }
  }, [phase, currentVideoPath]);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    // Water ripple when listening starts
    if (phase === 'listening' && prev !== 'listening') {
      playWaterRipple();
    }

    // Chime when emotion processing starts
    if (phase === 'processing' && prev === 'listening') {
      playChime();
    }
  }, [phase, playWaterRipple, playChime]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return null; // Pure side-effect component
});
