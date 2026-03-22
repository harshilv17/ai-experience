// components/PulseRings.tsx — Concentric energy rings emanating from the robot center
'use client';

import { memo, useMemo, useState, useEffect } from 'react';
import type { PipelinePhase } from '@/types';

interface Props {
  phase: PipelinePhase;
}

export default memo(function PulseRings({ phase }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isListening = phase === 'listening';
  const isProcessing = phase === 'processing' || phase === 'showing_prompt';
  const isRevealing = phase === 'revealing';
  const isDisplaying = phase === 'displaying';

  const rings = useMemo(() => {
    if (!mounted) return [];
    const count = isProcessing ? 5 : isListening ? 4 : 3;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: i * (isProcessing ? 0.8 : 1.2),
      duration: isProcessing ? 3 : isListening ? 4 : 5,
      color: i % 2 === 0
        ? 'rgba(56, 189, 248, 0.15)'
        : 'rgba(99, 102, 241, 0.1)',
    }));
  }, [mounted, isProcessing, isListening]);

  if (!mounted || isDisplaying) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-1000 ${
        isRevealing ? 'opacity-80' : isProcessing ? 'opacity-60' : isListening ? 'opacity-40' : 'opacity-20'
      }`}
      style={{ zIndex: 4 }}
    >
      {rings.map((ring) => (
        <div
          key={ring.id}
          className="absolute rounded-full pulse-ring-expand"
          style={{
            width: '20px',
            height: '20px',
            border: `1px solid ${ring.color}`,
            animationDuration: `${ring.duration}s`,
            animationDelay: `${ring.delay}s`,
          }}
        />
      ))}

      <style jsx>{`
        .pulse-ring-expand {
          animation: pulseRingExpand var(--ring-dur, 4s) cubic-bezier(0, 0.5, 0.5, 1) infinite;
        }
        @keyframes pulseRingExpand {
          0% {
            width: 20px;
            height: 20px;
            opacity: 0.6;
            border-width: 2px;
          }
          100% {
            width: 600px;
            height: 600px;
            opacity: 0;
            border-width: 0.5px;
          }
        }
      `}</style>
    </div>
  );
});
