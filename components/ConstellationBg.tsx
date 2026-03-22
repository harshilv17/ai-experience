// components/ConstellationBg.tsx — Animated star constellation with connecting lines
'use client';

import { useMemo, useState, useEffect, memo } from 'react';
import type { PipelinePhase } from '@/types';

interface Star {
  id: number;
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  twinkleDuration: number;
  twinkleDelay: number;
}

function generateStars(count: number): Star[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    cx: Math.random() * 100,
    cy: Math.random() * 100,
    r: 0.3 + Math.random() * 0.7,
    opacity: 0.08 + Math.random() * 0.2,
    twinkleDuration: 5 + Math.random() * 8,
    twinkleDelay: Math.random() * -8,
  }));
}

interface Props {
  phase: PipelinePhase;
}

export default memo(function ConstellationBg({ phase }: Props) {
  const [mounted, setMounted] = useState(false);
  const stars = useMemo(() => (mounted ? generateStars(30) : []), [mounted]);

  useEffect(() => { setMounted(true); }, []);

  const isActive = phase !== 'displaying';
  const isProcessing = phase === 'processing' || phase === 'showing_prompt';

  // Build constellation lines between nearby stars
  const lines = useMemo(() => {
    if (!mounted) return [];
    const result: { x1: number; y1: number; x2: number; y2: number; dist: number }[] = [];
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const dx = stars[i].cx - stars[j].cx;
        const dy = stars[i].cy - stars[j].cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10) {
          result.push({
            x1: stars[i].cx, y1: stars[i].cy,
            x2: stars[j].cx, y2: stars[j].cy,
            dist,
          });
        }
      }
    }
    return result.slice(0, 15); // cap lines
  }, [stars, mounted]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none transition-opacity duration-[3000ms] ${
        isActive ? 'opacity-50' : 'opacity-0'
      }`}
      style={{ zIndex: 1 }}
    >
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <radialGradient id="starGlow">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Constellation lines */}
        {lines.map((line, i) => (
          <line
            key={`line-${i}`}
            x1={`${line.x1}`} y1={`${line.y1}`}
            x2={`${line.x2}`} y2={`${line.y2}`}
            stroke="rgba(125, 211, 252, 0.04)"
            strokeWidth="0.05"
            className="constellation-line"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}

        {/* Stars */}
        {stars.map((star) => (
          <g key={star.id}>
            {/* Outer glow */}
            <circle
              cx={star.cx} cy={star.cy} r={star.r * 3}
              fill="url(#starGlow)"
              opacity={star.opacity * 0.15}
              className="star-twinkle"
              style={{
                animationDuration: `${star.twinkleDuration}s`,
                animationDelay: `${star.twinkleDelay}s`,
              }}
            />
            {/* Core */}
            <circle
              cx={star.cx} cy={star.cy} r={star.r * 0.4}
              fill={isProcessing ? '#e0f2fe' : '#bae6fd'}
              opacity={star.opacity}
              className="star-twinkle"
              style={{
                animationDuration: `${star.twinkleDuration}s`,
                animationDelay: `${star.twinkleDelay}s`,
              }}
            />
          </g>
        ))}
      </svg>

      <style jsx>{`
        .star-twinkle {
          animation: twinkle var(--dur, 4s) ease-in-out infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: var(--base-opacity, 0.1); transform-origin: center; }
          50% { opacity: 0.4; }
        }

        .constellation-line {
          animation: linePulse 6s ease-in-out infinite;
        }
        @keyframes linePulse {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.06; }
        }
      `}</style>
    </div>
  );
});
