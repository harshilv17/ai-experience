// components/FloatingKeywords.tsx — Floating cloud/bubble word display from transcript
'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import type { PipelinePhase } from '@/types';

interface FloatingBubble {
  text: string;
  id: string;
  x: number;
  y: number;
  size: number;      // font size in rem
  bubbleW: number;   // bubble width
  delay: number;
  floatDuration: number;
  floatRange: number; // px of vertical float
  driftX: number;     // px of horizontal drift
  hue: number;        // for color theming
  variant: 'warm' | 'cool' | 'gold';
}

interface Props {
  words: string[];
  gathering?: boolean;
  phase: PipelinePhase;
}

export default function FloatingKeywords({ words, gathering = false, phase }: Props) {
  const [visibleBubbles, setVisibleBubbles] = useState<FloatingBubble[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const bubbleData = useMemo(() => {
    const variants: Array<'warm' | 'cool' | 'gold'> = ['warm', 'cool', 'gold'];
    return words.map((text, i) => {
      const variant = variants[i % 3];
      const textLen = text.length;
      return {
        text,
        id: `${text}-${i}-${Date.now()}`,
        x: 12 + Math.random() * 76,
        y: 15 + Math.random() * 65,
        size: Math.max(0.85, Math.min(1.6, 2.2 - textLen * 0.08)),
        bubbleW: Math.max(80, textLen * 14 + 40),
        delay: i * 500,
        floatDuration: 5000 + Math.random() * 4000,
        floatRange: 8 + Math.random() * 12,
        driftX: -6 + Math.random() * 12,
        hue: variant === 'warm' ? 25 : variant === 'gold' ? 42 : 200,
        variant,
      };
    });
  }, [words]);

  useEffect(() => {
    setVisibleBubbles([]);
    if (words.length === 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    bubbleData.forEach((bubble) => {
      const timer = setTimeout(() => {
        setVisibleBubbles((prev) => [...prev, bubble]);
      }, bubble.delay);
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
  }, [bubbleData, words.length]);

  if (words.length === 0 || phase === 'displaying' || phase === 'idle') return null;

  const getBubbleColors = (v: 'warm' | 'cool' | 'gold') => {
    switch (v) {
      case 'warm': return {
        bg: 'rgba(255, 153, 51, 0.06)',
        border: 'rgba(255, 153, 51, 0.2)',
        text: 'rgba(255, 200, 120, 0.95)',
        glow: 'rgba(255, 153, 51, 0.12)',
        shadow: 'rgba(255, 153, 51, 0.08)',
      };
      case 'gold': return {
        bg: 'rgba(218, 165, 32, 0.06)',
        border: 'rgba(218, 165, 32, 0.2)',
        text: 'rgba(253, 224, 71, 0.95)',
        glow: 'rgba(218, 165, 32, 0.12)',
        shadow: 'rgba(218, 165, 32, 0.08)',
      };
      case 'cool': return {
        bg: 'rgba(56, 189, 248, 0.05)',
        border: 'rgba(56, 189, 248, 0.15)',
        text: 'rgba(186, 230, 253, 0.95)',
        glow: 'rgba(56, 189, 248, 0.1)',
        shadow: 'rgba(56, 189, 248, 0.06)',
      };
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 8 }}
    >
      {visibleBubbles.map((bubble) => {
        const colors = getBubbleColors(bubble.variant);
        return (
          <div
            key={bubble.id}
            className="absolute bubble-float-in"
            style={{
              left: gathering ? '50%' : `${bubble.x}%`,
              top: gathering ? '50%' : `${bubble.y}%`,
              transform: gathering
                ? 'translate(-50%, -50%) scale(0.5)'
                : 'translate(-50%, -50%) scale(1)',
              transitionDuration: gathering ? '2s' : '0.6s',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
              transitionProperty: 'left, top, transform',
              animation: `
                bubbleFloat ${bubble.floatDuration}ms ease-in-out infinite,
                bubblePopIn 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards
              `,
              opacity: 0,
            }}
          >
            {/* The cloud/bubble container */}
            <div
              className="relative px-5 py-2.5 rounded-[20px] backdrop-blur-md"
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                boxShadow: `
                  0 0 20px ${colors.shadow},
                  0 4px 15px rgba(0, 0, 0, 0.15),
                  inset 0 1px 0 rgba(255, 255, 255, 0.06)
                `,
                minWidth: `${bubble.bubbleW}px`,
                textAlign: 'center',
              }}
            >
              {/* Inner glow highlight */}
              <div
                className="absolute top-0 left-[15%] right-[15%] h-[1px] rounded-full"
                style={{ background: `linear-gradient(90deg, transparent, ${colors.glow}, transparent)` }}
              />
              {/* Text */}
              <span
                className="relative z-10 font-light tracking-[0.15em] select-none whitespace-nowrap"
                style={{
                  fontSize: `${bubble.size}rem`,
                  color: colors.text,
                  textShadow: `0 0 20px ${colors.glow}, 0 0 40px ${colors.shadow}`,
                }}
              >
                {bubble.text}
              </span>
            </div>

            {/* Small "tail" blob underneath — cloud-like */}
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 rounded-full"
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderTop: 'none',
                opacity: 0.6,
              }}
            />
          </div>
        );
      })}

      {/* Wispy connection lines between recent bubbles */}
      {visibleBubbles.length > 1 && (
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.06 }}>
          {visibleBubbles.slice(-6).map((bubble, i, arr) => {
            const next = arr[i + 1];
            if (!next) return null;
            return (
              <line
                key={`conn-${bubble.id}`}
                x1={`${bubble.x}%`} y1={`${bubble.y}%`}
                x2={`${next.x}%`} y2={`${next.y}%`}
                stroke="rgba(218, 165, 32, 0.4)"
                strokeWidth="1"
                strokeDasharray="4 8"
                className="connection-fade"
              />
            );
          })}
        </svg>
      )}

      <style jsx>{`
        @keyframes bubbleFloat {
          0%, 100% {
            transform: translate(-50%, -50%) translateY(0) translateX(0);
          }
          33% {
            transform: translate(-50%, -50%) translateY(-10px) translateX(4px);
          }
          66% {
            transform: translate(-50%, -50%) translateY(-6px) translateX(-3px);
          }
        }

        @keyframes bubblePopIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2);
            filter: blur(12px);
          }
          60% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.08);
            filter: blur(0px);
          }
          100% {
            opacity: 0.95;
            transform: translate(-50%, -50%) scale(1);
            filter: blur(0px);
          }
        }

        .connection-fade {
          animation: connFade 4s ease-in-out infinite;
        }
        @keyframes connFade {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
