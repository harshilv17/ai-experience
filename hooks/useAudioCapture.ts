// hooks/useAudioCapture.ts — Manage audio capture lifecycle
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { v4 as uuidv4 } from 'uuid';

const CHUNK_DURATION_MS = 30000; // 30 seconds default
const TEST_EMOTIONS = ['hope', 'fear', 'grief', 'anger', 'renewal'] as const;

export function useAudioCapture() {
  const selectedMicDeviceId = useAppStore((s) => s.selectedMicDeviceId);
  const liveMode = useAppStore((s) => s.liveMode);
  const testMode = useAppStore((s) => s.testMode);

  const [isCapturing, setIsCapturing] = useState(false);
  const [speechDurationMs, setSpeechDurationMs] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechDurationRef = useRef<number>(0);
  const speechTimerRef = useRef<number | null>(null);
  const testIndexRef = useRef<number>(0);
  const isCapturingRef = useRef<boolean>(false);

  const processCurrentChunk = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      return;
    }

    // Stop recording to gather the blob
    const recorder = mediaRecorderRef.current;

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const currentSpeechDuration = speechDurationRef.current;

        // Reset for next chunk
        audioChunksRef.current = [];
        speechDurationRef.current = 0;
        setSpeechDurationMs(0);

        // Restart recording immediately
        if (isCapturingRef.current && streamRef.current) {
          try {
            const newRecorder = new MediaRecorder(streamRef.current, {
              mimeType: 'audio/webm;codecs=opus',
            });
            newRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                audioChunksRef.current.push(e.data);
              }
            };
            newRecorder.start(1000); // timeslice: 1s
            mediaRecorderRef.current = newRecorder;
          } catch (err) {
            console.error('[AudioCapture] Failed to restart recorder:', err);
          }
        }

        // POST to /api/audio
        const chunkId = uuidv4();
        const formData = new FormData();
        formData.append('audio', blob);
        formData.append('chunkId', chunkId);
        formData.append('durationMs', String(CHUNK_DURATION_MS));
        formData.append('speechDurationMs', String(currentSpeechDuration));
        formData.append('mimeType', 'audio/webm;codecs=opus');

        try {
          const response = await fetch('/api/audio', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          console.log('[AudioCapture] Chunk result:', result.status || result.chunkId);
        } catch (err) {
          console.error('[AudioCapture] Failed to send chunk:', err);
        }

        resolve();
      };

      recorder.stop();
    });
  }, []);

  const processTestChunk = useCallback(async () => {
    const emotionName = TEST_EMOTIONS[testIndexRef.current % TEST_EMOTIONS.length];
    testIndexRef.current++;

    // In test mode, we send a test file from public/test-audio/
    const testUrl = `/test-audio/${emotionName}-sample.webm`;
    try {
      const response = await fetch(testUrl);
      if (!response.ok) {
        // If test files don't exist, create a minimal audio blob
        console.warn(`[AudioCapture] Test file not found: ${testUrl}, using empty audio`);
        const chunkId = uuidv4();

        // Post directly to analyze endpoint with test transcript instead
        const testTranscripts: Record<string, string> = {
          hope: 'I feel such hope for the future, like things are finally going to change for the better',
          fear: "I'm afraid of what's coming next, the uncertainty is overwhelming and I can't shake it",
          grief: "We've lost so much, and the grief doesn't just go away overnight, it stays with you",
          anger: 'I am angry that nothing seems to change no matter what we do, it feels pointless',
          renewal: 'I feel renewed, like this is a new beginning, a fresh start for all of us here today',
        };

        // Use the analyze + generate pipeline directly for test mode
        const analyzeRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: testTranscripts[emotionName],
            chunkId,
          }),
        });

        if (analyzeRes.ok) {
          const emotionResult = await analyzeRes.json();
          console.log(`[TestMode] Analyzed: ${emotionResult.emotion} (${emotionResult.score})`);

          // Generate image
          const genRes = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emotion: emotionResult.emotion,
              score: emotionResult.score,
              keywords: emotionResult.keywords,
              chunkId,
            }),
          });

          if (genRes.ok) {
            const imageResult = await genRes.json();
            console.log(`[TestMode] Generated: ${imageResult.servedPath}`);
          }
        }
        return;
      }

      const blob = await response.blob();
      const chunkId = uuidv4();

      const formData = new FormData();
      formData.append('audio', blob);
      formData.append('chunkId', chunkId);
      formData.append('durationMs', String(CHUNK_DURATION_MS));
      formData.append('speechDurationMs', String(15000)); // Assume full speech for test
      formData.append('mimeType', 'audio/webm;codecs=opus');

      const result = await fetch('/api/audio', {
        method: 'POST',
        body: formData,
      });
      const data = await result.json();
      console.log(`[TestMode] ${emotionName} result:`, data.status || data.chunkId);
    } catch (err) {
      console.error('[TestMode] Failed to process test chunk:', err);
    }
  }, []);

  const startCapture = useCallback(async () => {
    if (isCapturingRef.current) return;

    try {
      isCapturingRef.current = true;
      setIsCapturing(true);

      if (testMode) {
        // Test mode: cycle through test files on a timer
        console.log('[AudioCapture] Starting in TEST MODE');
        processTestChunk(); // Fire first one immediately
        chunkTimerRef.current = setInterval(processTestChunk, CHUNK_DURATION_MS);
        return;
      }

      // Live mode: request mic access
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: selectedMicDeviceId ? { exact: selectedMicDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Set up MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(1000); // timeslice: collect data every 1s
      mediaRecorderRef.current = recorder;

      // Simple speech detection based on audio levels using AnalyserNode
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let isSpeaking = false;

      const checkAudio = () => {
        if (!isCapturingRef.current) return;

        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

        // Simple VAD: average energy > threshold means speech
        const SPEECH_THRESHOLD = 30;
        if (average > SPEECH_THRESHOLD && !isSpeaking) {
          isSpeaking = true;
          speechTimerRef.current = Date.now();
        } else if (average <= SPEECH_THRESHOLD && isSpeaking) {
          isSpeaking = false;
          if (speechTimerRef.current) {
            speechDurationRef.current += Date.now() - speechTimerRef.current;
            setSpeechDurationMs(speechDurationRef.current);
            speechTimerRef.current = null;
          }
        }

        requestAnimationFrame(checkAudio);
      };
      requestAnimationFrame(checkAudio);

      // Set up chunk timer
      chunkTimerRef.current = setInterval(() => {
        // End any ongoing speech timing
        if (isSpeaking && speechTimerRef.current) {
          speechDurationRef.current += Date.now() - speechTimerRef.current;
          speechTimerRef.current = Date.now();
          setSpeechDurationMs(speechDurationRef.current);
        }
        processCurrentChunk();
      }, CHUNK_DURATION_MS);

      console.log('[AudioCapture] Started capturing from mic');
    } catch (err) {
      console.error('[AudioCapture] Failed to start capture:', err);
      isCapturingRef.current = false;
      setIsCapturing(false);
    }
  }, [selectedMicDeviceId, testMode, processCurrentChunk, processTestChunk]);

  const stopCapture = useCallback(() => {
    isCapturingRef.current = false;
    setIsCapturing(false);

    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // Ignore stop errors
      }
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];
    speechDurationRef.current = 0;
    speechTimerRef.current = null;
    setSpeechDurationMs(0);

    console.log('[AudioCapture] Stopped capturing');
  }, []);

  // Start/stop based on liveMode
  useEffect(() => {
    if (liveMode) {
      startCapture();
    } else {
      stopCapture();
    }
    return () => stopCapture();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMode, testMode]);

  return { isCapturing, speechDurationMs };
}
