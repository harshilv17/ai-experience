// components/FloatingKeywords.tsx — Mentimeter-style animated word cloud
'use client';

import { useEffect, useState, useMemo } from 'react';

interface FloatingWord {
  text: string;
  id: string;
  x: number;       // % from left
  y: number;       // % from top
  size: number;    // rem
  delay: number;   // animation delay in ms
  duration: number; // animation duration in ms
  color: string;
}

const COLORS = [
  'rgba(147, 197, 253, 0.9)',  // sky-300
  'rgba(56, 189, 248, 0.85)',  // sky-400
  'rgba(14, 165, 233, 0.8)',   // sky-500
  'rgba(186, 230, 253, 0.9)',  // sky-200
  'rgba(224, 242, 254, 0.85)', // sky-100
  'rgba(125, 211, 252, 0.8)',  // sky-300 alt
  'rgba(96, 165, 250, 0.75)',  // blue-400
];

interface Props {
  words: string[];
  gathering?: boolean; // when true, words drift toward center
}

export default function FloatingKeywords({ words, gathering = false }: Props) {
  const [visibleWords, setVisibleWords] = useState<FloatingWord[]>([]);

  // Generate floating word data with staggered appearance
  const wordData = useMemo(() => {
    return words.map((text, i) => ({
      text,
      id: `${text}-${i}-${Date.now()}`,
      // Distribute in center 60% of screen with some randomness
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      size: 1.5 + Math.random() * 2.5, // 1.5rem to 4rem
      delay: i * 400, // stagger by 400ms
      duration: 3000 + Math.random() * 2000,
      color: COLORS[i % COLORS.length],
    }));
  }, [words]);

  // Stagger word appearance
  useEffect(() => {
    setVisibleWords([]);
    if (words.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    wordData.forEach((word) => {
      const timer = setTimeout(() => {
        setVisibleWords((prev) => [...prev, word]);
      }, word.delay);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [wordData, words.length]);

  if (words.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 8 }}
    >
      {visibleWords.map((word) => (
        <div
          key={word.id}
          className="absolute transition-all"
          style={{
            left: gathering ? '50%' : `${word.x}%`,
            top: gathering ? '50%' : `${word.y}%`,
            transform: gathering
              ? 'translate(-50%, -50%) scale(0.6)'
              : 'translate(-50%, -50%) scale(1)',
            transitionDuration: gathering ? '2s' : '0.8s',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            animation: `wordFloat ${word.duration}ms ease-in-out infinite, wordAppear 800ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
            animationDelay: `0ms, 0ms`,
            opacity: 0,
            fontSize: `${word.size}rem`,
            color: word.color,
            fontWeight: 300,
            letterSpacing: '0.15em',
            textShadow: `0 0 30px ${word.color}, 0 0 60px rgba(56, 189, 248, 0.2)`,
            fontFamily: 'var(--font-inter, Inter, sans-serif)',
          }}
        >
          {word.text}
        </div>
      ))}

      {/* Subtle connection lines between nearby words */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
        {visibleWords.slice(0, -1).map((word, i) => {
          const next = visibleWords[i + 1];
          if (!next) return null;
          return (
            <line
              key={`line-${word.id}`}
              x1={`${word.x}%`}
              y1={`${word.y}%`}
              x2={`${next.x}%`}
              y2={`${next.y}%`}
              stroke="rgba(56, 189, 248, 0.3)"
              strokeWidth="1"
              className="animate-line-fade"
            />
          );
        })}
      </svg>

      <style jsx>{`
        @keyframes wordFloat {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-12px); }
        }

        @keyframes wordAppear {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
            filter: blur(8px);
          }
          60% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
            filter: blur(0px);
          }
          100% {
            opacity: 0.9;
            transform: translate(-50%, -50%) scale(1);
            filter: blur(0px);
          }
        }

        .animate-line-fade {
          animation: lineFade 3s ease-in-out infinite;
        }

        @keyframes lineFade {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
