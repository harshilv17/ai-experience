// hooks/useDisplayTimer.ts — Transition from displaying to showing_prompt after min image display time
'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';

const MIN_IMAGE_DISPLAY_MS = parseInt(process.env.NEXT_PUBLIC_MIN_IMAGE_DISPLAY_MS || '18000', 10);

export function useDisplayTimer() {
  const pipelinePhase = useAppStore((s) => s.pipelinePhase);
  const displayStartedAt = useAppStore((s) => s.displayStartedAt);
  const transitionToShowingPrompt = useAppStore((s) => s.transitionToShowingPrompt);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pipelinePhase !== 'displaying' || displayStartedAt == null) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const elapsed = Date.now() - displayStartedAt;
    const remaining = Math.max(0, MIN_IMAGE_DISPLAY_MS - elapsed);

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      transitionToShowingPrompt();
    }, remaining);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pipelinePhase, displayStartedAt, transitionToShowingPrompt]);
}
