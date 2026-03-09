// components/EmotionOverlay.tsx — Himalayan-themed emotion badge + keywords overlay
'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import type { EmotionClass } from '@/types';

const OVERLAY_DURATION_MS = 5000;

const EMOTION_THEMES: Record<EmotionClass, { accent: string; glow: string; label: string }> = {
  Hope:    { accent: 'rgba(251, 191, 36, 0.8)',  glow: 'rgba(251, 191, 36, 0.3)',   label: '☀ Hope' },
  Fear:    { accent: 'rgba(148, 163, 184, 0.8)', glow: 'rgba(148, 163, 184, 0.3)',  label: '🌑 Fear' },
  Grief:   { accent: 'rgba(168, 162, 158, 0.8)', glow: 'rgba(168, 162, 158, 0.3)',  label: '🌧 Grief' },
  Anger:   { accent: 'rgba(239, 68, 68, 0.8)',   glow: 'rgba(239, 68, 68, 0.3)',    label: '⚡ Anger' },
  Renewal: { accent: 'rgba(52, 211, 153, 0.8)',  glow: 'rgba(52, 211, 153, 0.3)',   label: '🌱 Renewal' },
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
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setShowOverlay(false);
      }, OVERLAY_DURATION_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showOverlay, setShowOverlay]);

  if (!currentEmotion || !showOverlay) return null;

  const theme = EMOTION_THEMES[currentEmotion];
  const score = currentScore ?? 0;

  return (
    <div
      className={`
        fixed bottom-8 left-8 z-50
        transition-all duration-700 ease-out
        ${showOverlay ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      <div
        className="rounded-2xl px-6 py-4 min-w-[300px]"
        style={{
          background: 'rgba(3, 8, 16, 0.75)',
          backdropFilter: 'blur(20px)',
          border: `1px solid rgba(56, 189, 248, 0.15)`,
          boxShadow: `0 0 40px ${theme.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
        }}
      >
        {/* Emotion label + score */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className="px-3 py-1 rounded-full text-sm font-semibold tracking-wider"
            style={{
              color: theme.accent,
              background: `${theme.glow}`,
              border: `1px solid ${theme.accent}`,
            }}
          >
            {theme.label}
          </span>
          <span className="text-sky-300/60 text-sm font-mono">
            {score}/100
          </span>
        </div>

        {/* Score bar */}
        <div className="w-full h-1 bg-white/5 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${score}%`,
              background: `linear-gradient(90deg, ${theme.glow}, ${theme.accent})`,
              boxShadow: `0 0 8px ${theme.glow}`,
            }}
          />
        </div>

        {/* Keywords */}
        <div className="flex gap-2 flex-wrap">
          {currentKeywords.map((kw, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                color: 'rgba(186, 230, 253, 0.8)',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.15)',
              }}
            >
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
