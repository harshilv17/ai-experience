// hooks/useSSE.ts — Custom hook: connect to /api/events SSE stream (V2)
'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { DISPLAY_HOLD_MS } from '@/store/slices/uiSlice';
import type {
  SystemEvent,
  StateChangeEvent,
  TranscriptReadyEvent,
  EmotionReadyEvent,
  ImageReadyEvent,
  VideoReadyEvent,
  VideoProgressEvent,
  CycleCompleteEvent,
  PromptReadyEvent,
  PoeticMomentEvent,
  ConferenceTranscriptChunkEvent,
  ConferenceResultEvent,
} from '@/types';

export function useSSE() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setOrchestratorState = useAppStore((s) => s.setOrchestratorState);
  const setLiveMode = useAppStore((s) => s.setLiveMode);
  const setPipelinePhase = useAppStore((s) => s.setPipelinePhase);
  const setTranscript = useAppStore((s) => s.setTranscript);
  const setCurrentEmotion = useAppStore((s) => s.setCurrentEmotion);
  const setCurrentImage = useAppStore((s) => s.setCurrentImage);
  const setCurrentVideo = useAppStore((s) => s.setCurrentVideo);
  const setVideoProgress = useAppStore((s) => s.setVideoProgress);
  const updateStats = useAppStore((s) => s.updateStats);
  const addCycleToHistory = useAppStore((s) => s.addCycleToHistory);
  const setApiStatus = useAppStore((s) => s.setApiStatus);
  const setPendingPromptData = useAppStore((s) => s.setPendingPromptData);

  // V2 actions
  const setLiveTranscript = useAppStore((s) => s.setLiveTranscript);
  const setLiveImagePrompt = useAppStore((s) => s.setLiveImagePrompt);
  const addEmotionHistory = useAppStore((s) => s.addEmotionHistory);
  const addSessionKeywords = useAppStore((s) => s.addSessionKeywords);
  const setPoeticLine = useAppStore((s) => s.setPoeticLine);
  const setLiveEmotionJSON = useAppStore((s) => s.setLiveEmotionJSON);
  const setPendingImagePrompt = useAppStore((s) => s.setPendingImagePrompt);

  // Conference mode actions
  const setCaptureMode = useAppStore((s) => s.setCaptureMode);
  const appendConferenceTranscript = useAppStore((s) => s.appendConferenceTranscript);
  const setConferenceIsGenerating = useAppStore((s) => s.setConferenceIsGenerating);
  const addToWordPool = useAppStore((s) => s.addToWordPool);

  useEffect(() => {
    function connect() {
      // Clean up previous connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('/api/events');
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const sysEvent: SystemEvent = JSON.parse(event.data);

          switch (sysEvent.type) {
            case 'state_change': {
              const data = sysEvent.data as StateChangeEvent;
              setOrchestratorState(data.state);
              setLiveMode(data.liveMode);
              break;
            }
            case 'chunk_started': {
              // Audio chunk is being processed → enter listening phase
              setPipelinePhase('listening');
              break;
            }
            case 'transcript_ready': {
              const data = sysEvent.data as TranscriptReadyEvent;
              const state = useAppStore.getState();
              const inDisplayHold =
                state.pipelinePhase === 'displaying' &&
                state.displayStartedAt != null &&
                Date.now() - state.displayStartedAt < DISPLAY_HOLD_MS;

              if (inDisplayHold && state.displayStartedAt != null) {
                const prev = state.pendingPromptData;
                setPendingPromptData({
                  transcript: data.text,
                  keywords: data.words,
                  emotion: prev?.emotion ?? state.currentEmotion ?? 'Renewal',
                  score: prev?.score ?? state.currentScore ?? 50,
                });
              } else {
                setTranscript(data.text, data.words);
                setLiveTranscript(data.text);
                addSessionKeywords(data.words);
              }
              break;
            }
            case 'emotion_ready': {
              const data = sysEvent.data as EmotionReadyEvent;
              const state = useAppStore.getState();
              const inDisplayHold =
                state.pipelinePhase === 'displaying' &&
                state.displayStartedAt != null &&
                Date.now() - state.displayStartedAt < DISPLAY_HOLD_MS;

              if (inDisplayHold && state.displayStartedAt != null) {
                const prev = state.pendingPromptData;
                setPendingPromptData({
                  transcript: prev?.transcript ?? state.currentTranscript ?? state.liveTranscript,
                  keywords: data.keywords,
                  emotion: data.emotion,
                  score: data.score,
                });
              } else {
                setCurrentEmotion(data.emotion, data.score, data.keywords);
                addEmotionHistory(data.emotion, data.score);
                addSessionKeywords(data.keywords);
                setLiveEmotionJSON(
                  JSON.stringify(
                    { emotion: data.emotion, score: data.score, keywords: data.keywords },
                    null,
                    2
                  )
                );
              }
              break;
            }
            case 'image_ready': {
              const data = sysEvent.data as ImageReadyEvent;
              setCurrentImage(data.servedPath, data.emotion, data.isFallback);
              // Move pending prompt to the liveImagePrompt (it's now the last-used prompt)
              const pendingPrompt = useAppStore.getState().pendingImagePrompt;
              if (pendingPrompt) {
                setLiveImagePrompt(pendingPrompt);
                setPendingImagePrompt('');
              }
              // V2: Clear emotion JSON ticker when image arrives
              setTimeout(() => setLiveEmotionJSON(null), 3000);
              break;
            }
            case 'prompt_ready': {
              // V2: DALL-E 3 prompt broadcast — shown BEFORE image generation
              const data = sysEvent.data as PromptReadyEvent;
              // Set as pending (pre-generation) — liveImagePrompt gets set once image_ready arrives
              setPendingImagePrompt(data.prompt);
              break;
            }
            case 'poetic_moment': {
              // V2: Short poetic line moment
              const data = sysEvent.data as PoeticMomentEvent;
              setPoeticLine(data.text);
              // Auto-clear after 7.5s (6s hold + 1.5s fade)
              setTimeout(() => setPoeticLine(null), 7500);
              break;
            }
            case 'cycle_complete': {
              const data = sysEvent.data as CycleCompleteEvent;
              updateStats(data.result);
              addCycleToHistory(data.result);
              break;
            }
            case 'cycle_skipped': {
              const skipData = sysEvent.data as { reason: string };
              console.log(`[SSE] Cycle skipped: ${skipData.reason}`);
              break;
            }
            case 'api_error': {
              const errorData = sysEvent.data as { api: string; error: string };
              console.error(`[SSE] API error (${errorData.api}): ${errorData.error}`);
              if (
                errorData.api === 'whisper' ||
                errorData.api === 'gpt4o' ||
                errorData.api === 'dalle3' ||
                errorData.api === 'sora'
              ) {
                setApiStatus(errorData.api as 'whisper' | 'gpt4o' | 'dalle3' | 'sora', 'error');
              }
              // Reset to idle on error so we don't get stuck
              setPipelinePhase('idle');
              break;
            }
            case 'pipeline_phase': {
              const data = sysEvent.data as { phase: string };
              const newPhase = data.phase as 'idle' | 'listening' | 'processing' | 'showing_prompt' | 'revealing' | 'displaying';
              setPipelinePhase(newPhase);
              break;
            }
            case 'conference_transcript_chunk': {
              const data = sysEvent.data as ConferenceTranscriptChunkEvent;
              // Append to conference buffer and update live transcript view
              appendConferenceTranscript(data.partialText);
              setLiveTranscript(data.partialText);
              // Add words to the rotating word pool
              addToWordPool(data.words);
              // Also show floating keywords on the projection
              addSessionKeywords(data.words);
              break;
            }
            case 'conference_generating': {
              // Show a processing state while image/video is being generated
              setConferenceIsGenerating(true);
              setPipelinePhase('processing');
              break;
            }
            case 'conference_result': {
              const data = sysEvent.data as ConferenceResultEvent;
              setConferenceIsGenerating(false);
              // The image_ready or video_ready event will also fire and update the projection
              console.log(`[SSE] Conference result: ${data.outputType} → ${data.servedPath}`);
              break;
            }
            case 'video_ready': {
              const data = sysEvent.data as VideoReadyEvent;
              setCurrentVideo(data.servedPath, data.emotion, data.durationSeconds);
              // Move pending prompt to the liveImagePrompt
              const pendingPromptV = useAppStore.getState().pendingImagePrompt;
              if (pendingPromptV) {
                setLiveImagePrompt(pendingPromptV);
                setPendingImagePrompt('');
              }
              setTimeout(() => setLiveEmotionJSON(null), 3000);
              break;
            }
            case 'video_progress': {
              const data = sysEvent.data as VideoProgressEvent;
              setVideoProgress(data.progress);
              console.log(`[SSE] Video progress: ${data.status} ${data.progress}%`);
              break;
            }
            case 'control': {
              const data = sysEvent.data as { cmd: string; mode?: 'auto' | 'conference' };
              if (data.cmd === 'set_capture_mode' && data.mode) {
                setCaptureMode(data.mode);
                console.log(`[SSE] Synced capture mode: ${data.mode}`);
              }
              break;
            }
            default:
              console.log(`[SSE] Unhandled event type: ${sysEvent.type}`);
          }
        } catch (err) {
          console.error('[SSE] Failed to parse event:', err);
        }
      };

      eventSource.onerror = () => {
        console.warn('[SSE] Connection error — will auto-reconnect');
      };
    }

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
