// components/ResonanceMeter.tsx — Bottom bar showing cumulative crowd energy (Section 8)
'use client';

import { useAppStore } from '@/store/appStore';
import { useMemo, useEffect, useState } from 'react';

const EMOTION_COLORS: Record<string, string> = {
  Hope: 'rgba(251, 191, 36, 1)',    // amber
  Fear: 'rgba(71, 85, 105, 1)',     // slate
  Grief: 'rgba(120, 113, 108, 1)',  // stone
  Anger: 'rgba(220, 38, 38, 1)',    // red
  Renewal: 'rgba(16, 185, 129, 1)', // emerald
};

export default function ResonanceMeter() {
  const emotionHistory = useAppStore((s) => s.emotionHistory);
  const [pulse, setPulse] = useState(false);

  // Compute cumulative score
  const cumulativeValue = useMemo(() => {
    const rawTotal = emotionHistory.reduce((sum, entry) => sum + (entry.score / 100), 0);
    return Math.min(rawTotal * 10, 100); // Scale so 10 full-score events = 100%
  }, [emotionHistory]);

  const lastEmotion = emotionHistory[emotionHistory.length - 1]?.emotion || 'Hope';
  const color = EMOTION_COLORS[lastEmotion];

  // Pulse effect when maxed out
  useEffect(() => {
    if (cumulativeValue >= 100) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1000);
      return () => clearTimeout(t);
    }
  }, [cumulativeValue]);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-1 z-[12] bg-black/50">
      <div
        className={`h-full transition-all duration-1500 ease-out ${
          pulse ? 'opacity-100' : 'opacity-80'
        }`}
        style={{
          width: `${pulse ? 105 : cumulativeValue}%`, // slight overshoot on pulse
          background: color,
          boxShadow: pulse
            ? `0 -4px 20px ${color}, 0 -2px 10px white`
            : `0 -2px 10px ${color}`,
          transition: 'width 1.5s ease-out, box-shadow 0.3s ease-in',
        }}
      />
    </div>
  );
}
