// components/FloatingKeywords.tsx — Dynamic rotating word display from live transcript pool
'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import type { PipelinePhase } from '@/types';

interface FloatingBubble {
  text: string;
  id: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  floatDuration: number;
  driftAngle: number;
  driftSpeed: number;
  variant: 'aqua' | 'cyan' | 'teal';
}

interface Props {
  words: string[];         // Current "active" batch (used if allWords is empty)
  allWords?: string[];     // Full rolling pool of transcript words for rotation
  gathering?: boolean;
  phase: PipelinePhase;
}

const ROTATION_INTERVAL_MS = 3500;  // How often words rotate (3.5s)
const VISIBLE_COUNT = 8;            // How many words to show at once

function pickSubset(pool: string[], count: number): string[] {
  if (pool.length <= count) return [...pool];
  // Weighted random: prefer the last 60% of words (newest)
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function makeBubble(text: string, index: number): FloatingBubble {
  const variants: Array<'aqua' | 'cyan' | 'teal'> = ['aqua', 'cyan', 'teal'];
  const x = 8 + Math.random() * 84;
  const y = 12 + Math.random() * 72;
  const dx = 50 - x;
  const dy = 50 - y;
  const angle = Math.atan2(dy, dx);

  return {
    text,
    id: `${text}-${index}-${Date.now()}-${Math.random()}`,
    x,
    y,
    size: Math.max(0.85, Math.min(1.5, 2.0 - text.length * 0.07)),
    delay: index * 200,
    floatDuration: 5000 + Math.random() * 5000,
    driftAngle: angle,
    driftSpeed: 1 + Math.random() * 2,
    variant: variants[index % 3],
  };
}

export default function FloatingKeywords({ words, allWords = [], gathering = false, phase }: Props) {
  const [visibleBubbles, setVisibleBubbles] = useState<FloatingBubble[]>([]);
  const [driftOffset, setDriftOffset] = useState(0);
  const rotationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const driftRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // The effective word pool: prefer allWords if available, fall back to current batch
  const wordPool = useMemo(() => {
    return allWords.length > 0 ? allWords : words;
  }, [allWords, words]);

  const refreshBubbles = useCallback(() => {
    if (wordPool.length === 0) return;
    const subset = pickSubset(wordPool, VISIBLE_COUNT);
    const bubbles = subset.map((text, i) => makeBubble(text, i));
    setVisibleBubbles(bubbles);
    setDriftOffset(0);
  }, [wordPool]);

  // Initial render + whenever word pool changes
  useEffect(() => {
    if (wordPool.length === 0) {
      setVisibleBubbles([]);
      return;
    }
    refreshBubbles();
  }, [wordPool, refreshBubbles]);

  // Rotation timer — swap words every ROTATION_INTERVAL_MS
  useEffect(() => {
    if (wordPool.length === 0 || phase === 'displaying' || phase === 'idle') {
      if (rotationRef.current) clearInterval(rotationRef.current);
      return;
    }

    rotationRef.current = setInterval(() => {
      refreshBubbles();
    }, ROTATION_INTERVAL_MS);

    return () => {
      if (rotationRef.current) clearInterval(rotationRef.current);
    };
  }, [wordPool, phase, refreshBubbles]);

  // Drift animation tick
  useEffect(() => {
    if (visibleBubbles.length === 0) { setDriftOffset(0); return; }
    driftRef.current = setInterval(() => {
      setDriftOffset((prev) => prev + 1);
    }, 100);
    return () => {
      if (driftRef.current) clearInterval(driftRef.current);
    };
  }, [visibleBubbles.length]);

  if (wordPool.length === 0 || phase === 'displaying' || phase === 'idle') return null;

  const getColors = (v: 'aqua' | 'cyan' | 'teal') => {
    switch (v) {
      case 'aqua': return {
        bg: 'rgba(56, 189, 248, 0.04)',
        border: 'rgba(56, 189, 248, 0.12)',
        text: 'rgba(186, 230, 253, 0.92)',
        glow: 'rgba(56, 189, 248, 0.25)',
        outerGlow: 'rgba(56, 189, 248, 0.08)',
      };
      case 'cyan': return {
        bg: 'rgba(34, 211, 238, 0.04)',
        border: 'rgba(34, 211, 238, 0.1)',
        text: 'rgba(207, 250, 254, 0.92)',
        glow: 'rgba(34, 211, 238, 0.2)',
        outerGlow: 'rgba(34, 211, 238, 0.06)',
      };
      case 'teal': return {
        bg: 'rgba(20, 184, 166, 0.04)',
        border: 'rgba(20, 184, 166, 0.1)',
        text: 'rgba(204, 251, 241, 0.92)',
        glow: 'rgba(20, 184, 166, 0.2)',
        outerGlow: 'rgba(20, 184, 166, 0.06)',
      };
    }
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 8 }}
    >
      {visibleBubbles.map((bubble) => {
        const colors = getColors(bubble.variant);
        const driftPx = driftOffset * bubble.driftSpeed * 0.08;
        const driftX = Math.cos(bubble.driftAngle) * driftPx;
        const driftY = Math.sin(bubble.driftAngle) * driftPx;

        return (
          <div
            key={bubble.id}
            className="absolute water-word-appear"
            style={{
              left: gathering ? '50%' : `calc(${bubble.x}% + ${driftX}px)`,
              top: gathering ? '50%' : `calc(${bubble.y}% + ${driftY}px)`,
              transform: gathering
                ? 'translate(-50%, -50%) scale(0.3)'
                : 'translate(-50%, -50%) scale(1)',
              transition: gathering
                ? 'left 2s cubic-bezier(0.4,0,0.2,1), top 2s cubic-bezier(0.4,0,0.2,1), transform 2s cubic-bezier(0.4,0,0.2,1), opacity 2s'
                : 'left 0.4s ease-out, top 0.4s ease-out',
              opacity: gathering ? 0.3 : undefined,
              animationDelay: `${bubble.delay}ms`,
              animation: `
                waterFloat ${bubble.floatDuration}ms ease-in-out infinite,
                waterAppear 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards
              `,
            }}
          >
            <div
              className="relative px-6 py-3 rounded-[30px]"
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                boxShadow: `
                  0 0 30px ${colors.outerGlow},
                  0 0 60px ${colors.outerGlow},
                  inset 0 1px 0 rgba(255, 255, 255, 0.04),
                  0 4px 20px rgba(0, 0, 0, 0.1)
                `,
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                className="absolute top-0 left-[10%] right-[10%] h-[1px] rounded-full water-caustic-shimmer"
                style={{ background: `linear-gradient(90deg, transparent, ${colors.glow}, transparent)` }}
              />
              <div
                className="absolute bottom-0 left-[20%] right-[20%] h-[1px] rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${colors.glow}40, transparent)`,
                  opacity: 0.5,
                }}
              />
              <span
                className="relative z-10 font-light tracking-[0.2em] select-none whitespace-nowrap"
                style={{
                  fontSize: `${bubble.size}rem`,
                  color: colors.text,
                  textShadow: `0 0 25px ${colors.glow}, 0 0 50px ${colors.outerGlow}`,
                }}
              >
                {bubble.text}
              </span>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes waterFloat {
          0%, 100% {
            transform: translate(-50%, -50%) translateY(0) translateX(0);
          }
          25% {
            transform: translate(-50%, -50%) translateY(-8px) translateX(5px);
          }
          50% {
            transform: translate(-50%, -50%) translateY(-4px) translateX(-3px);
          }
          75% {
            transform: translate(-50%, -50%) translateY(-10px) translateX(2px);
          }
        }

        @keyframes waterAppear {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3) translateY(20px);
            filter: blur(15px);
          }
          50% {
            opacity: 0.8;
            filter: blur(2px);
          }
          100% {
            opacity: 0.92;
            transform: translate(-50%, -50%) scale(1) translateY(0);
            filter: blur(0px);
          }
        }

        .water-caustic-shimmer {
          animation: causticShimmer 3s ease-in-out infinite;
        }
        @keyframes causticShimmer {
          0%, 100% { opacity: 0.3; transform: scaleX(0.8); }
          50% { opacity: 0.8; transform: scaleX(1.1); }
        }
      `}</style>
    </div>
  );
}
