// components/EmotionRibbon.tsx — Vertical column showing the last 6 emotions (Section 9)
'use client';

import { useAppStore } from '@/store/appStore';
import type { EmotionClass } from '@/types';

const EMOTION_COLORS: Record<EmotionClass, string> = {
  Hope: 'rgba(251, 191, 36, 0.6)',    // amber-500
  Fear: 'rgba(71, 85, 105, 0.6)',     // slate-600
  Grief: 'rgba(120, 113, 108, 0.6)',  // stone-600
  Anger: 'rgba(220, 38, 38, 0.6)',    // red-600
  Renewal: 'rgba(16, 185, 129, 0.6)', // emerald-500
};

export default function EmotionRibbon() {
  const emotionHistory = useAppStore((s) => s.emotionHistory);

  // Take the last 6 entries, reverse so newest is at the top
  const ribbonEntries = [...emotionHistory]
    .slice(-6)
    .reverse();

  if (ribbonEntries.length === 0) return null;

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[12] flex flex-col gap-4">
      {ribbonEntries.map((entry, index) => {
        const color = EMOTION_COLORS[entry.emotion];
        // Fade out older entries
        const opacity = 1 - (index * 0.15);

        return (
          <div
            key={entry.timestamp}
            className="flex items-center gap-3 animate-slide-in-right"
            style={{ opacity }}
          >
            <span className="text-white/40 text-[10px] tracking-widest uppercase font-light">
              {entry.emotion}
            </span>
            <div
              className="w-5 h-5 rounded-full"
              style={{ background: color, boxShadow: `0 0 10px ${color}` }}
            />
          </div>
        );
      })}

      <style jsx>{`
        .animate-slide-in-right {
          animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideInRight {
          0% { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
