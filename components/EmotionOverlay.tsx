// components/EmotionOverlay.tsx — Emotion badge + keywords overlay
'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import type { EmotionClass } from '@/types';

const OVERLAY_DURATION_MS = 3000;

const EMOTION_COLORS: Record<EmotionClass, { bg: string; text: string; glow: string }> = {
  Hope:    { bg: 'bg-amber-500',    text: 'text-white',      glow: 'shadow-amber-500/40' },
  Fear:    { bg: 'bg-slate-700',    text: 'text-slate-100',  glow: 'shadow-slate-500/40' },
  Grief:   { bg: 'bg-stone-600',    text: 'text-stone-100',  glow: 'shadow-stone-500/40' },
  Anger:   { bg: 'bg-red-600',      text: 'text-white',      glow: 'shadow-red-500/40' },
  Renewal: { bg: 'bg-emerald-600',  text: 'text-white',      glow: 'shadow-emerald-500/40' },
};

export default function EmotionOverlay() {
  const showOverlay = useAppStore((s) => s.showOverlay);
  const currentEmotion = useAppStore((s) => s.currentEmotion);
  const currentScore = useAppStore((s) => s.currentScore);
  const currentKeywords = useAppStore((s) => s.currentKeywords);
  const setShowOverlay = useAppStore((s) => s.setShowOverlay);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showOverlay) {
      // Clear any existing timer
      if (timerRef.current) clearTimeout(timerRef.current);

      // Auto-hide after duration
      timerRef.current = setTimeout(() => {
        setShowOverlay(false);
      }, OVERLAY_DURATION_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showOverlay, setShowOverlay]);

  if (!currentEmotion || !showOverlay) return null;

  const colors = EMOTION_COLORS[currentEmotion];
  const score = currentScore ?? 0;

  return (
    <div
      className={`
        fixed bottom-8 left-8 z-50
        transition-all duration-500 ease-out
        ${showOverlay ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      <div className={`
        bg-black/70 backdrop-blur-xl rounded-2xl px-6 py-4
        border border-white/10 shadow-2xl ${colors.glow}
        min-w-[280px]
      `}>
        {/* Emotion badge + score */}
        <div className="flex items-center gap-3 mb-3">
          <span className={`
            ${colors.bg} ${colors.text}
            px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider
          `}>
            {currentEmotion}
          </span>
          <span className="text-white/70 text-sm font-mono">
            {score}/100
          </span>
        </div>

        {/* Score bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full mb-3 overflow-hidden">
          <div
            className={`h-full ${colors.bg} rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Keywords */}
        <div className="text-white/60 text-sm">
          {currentKeywords.join(' · ')}
        </div>
      </div>
    </div>
  );
}
