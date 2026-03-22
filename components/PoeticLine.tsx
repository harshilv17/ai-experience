// components/PoeticLine.tsx — Full-screen display of brief, highly emotional quotes (Section 10)
'use client';

import { useAppStore } from '@/store/appStore';
import { useEffect, useState, memo } from 'react';

const EMOTION_COLORS: Record<string, string> = {
  Hope: 'rgba(253, 224, 71, 0.6)',
  Fear: 'rgba(129, 140, 248, 0.6)',
  Grief: 'rgba(56, 189, 248, 0.6)',
  Anger: 'rgba(251, 113, 133, 0.6)',
  Renewal: 'rgba(52, 211, 153, 0.6)',
};

export default memo(function PoeticLine() {
  const poeticLine = useAppStore((s) => s.poeticLine);
  // Get emotion from history or default to Hope
  const emotionHistory = useAppStore((s) => s.emotionHistory);
  const lastEmotion = emotionHistory.length > 0
    ? emotionHistory[emotionHistory.length - 1].emotion
    : 'Hope';

  const [visible, setVisible] = useState(false);
  const [displayText, setDisplayText] = useState<string | null>(null);

  useEffect(() => {
    if (poeticLine) {
      setDisplayText(poeticLine);
      setVisible(true);
      // Orchestrator keeps the line active for 7.5s (6s hold + 1.5s fade out)
    } else {
      setVisible(false);
      // Wait for fade out animation before clearing text
      const t = setTimeout(() => setDisplayText(null), 1500);
      return () => clearTimeout(t);
    }
  }, [poeticLine]);

  if (!displayText && !visible) return null;

  const glowColor = EMOTION_COLORS[lastEmotion];

  return (
    <div
      className={`fixed inset-0 z-[15] flex flex-col items-center justify-center transition-opacity duration-1500 pointer-events-none ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)',
      }}
    >
      <h1
        className={`text-3xl md:text-5xl font-light tracking-widest text-white/90 text-center max-w-4xl px-8 transition-transform duration-1000 ${
          visible ? 'scale-100' : 'scale-95'
        }`}
        style={{
          textShadow: `0 0 40px ${glowColor}`,
          fontFamily: 'var(--font-inter, Inter, sans-serif)',
          lineHeight: '1.4',
        }}
      >
        &quot;{displayText}&quot;
      </h1>

      {/* Decorative Line Underneath */}
      <div className="mt-8 relative h-[2px] w-32 overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-out ${
            visible ? 'w-full origin-left' : 'w-0'
          }`}
          style={{
            background: `linear-gradient(90deg, transparent, ${glowColor.replace('0.4', '0.8')}, transparent)`,
            boxShadow: `0 0 10px ${glowColor}`,
          }}
        />
      </div>
    </div>
  );
})
