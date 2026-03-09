// hooks/useSSE.ts — Custom hook: connect to /api/events SSE stream
'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import type {
  SystemEvent,
  StateChangeEvent,
  TranscriptReadyEvent,
  EmotionReadyEvent,
  ImageReadyEvent,
  CycleCompleteEvent,
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
  const updateStats = useAppStore((s) => s.updateStats);
  const addCycleToHistory = useAppStore((s) => s.addCycleToHistory);
  const setApiStatus = useAppStore((s) => s.setApiStatus);

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
              // Whisper returned → show floating keywords while GPT-4o works
              const data = sysEvent.data as TranscriptReadyEvent;
              setTranscript(data.text, data.words);
              break;
            }
            case 'emotion_ready': {
              const data = sysEvent.data as EmotionReadyEvent;
              setCurrentEmotion(data.emotion, data.score, data.keywords);
              break;
            }
            case 'image_ready': {
              const data = sysEvent.data as ImageReadyEvent;
              setCurrentImage(data.servedPath, data.emotion, data.isFallback);
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
                errorData.api === 'dalle3'
              ) {
                setApiStatus(errorData.api as 'whisper' | 'gpt4o' | 'dalle3', 'error');
              }
              // Reset to idle on error so we don't get stuck
              setPipelinePhase('idle');
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
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
