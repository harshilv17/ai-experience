// components/RobotMascot.tsx — SVG/CSS Robot Character (Section 2 & 11)
'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import type { PipelinePhase } from '@/types';

interface Props {
  phase: PipelinePhase;
  consecutiveSameEmotion: number;
}

export default function RobotMascot({ phase, consecutiveSameEmotion }: Props) {
  const floatingKeywords = useAppStore((s) => s.floatingKeywords);
  const sessionKeywords = useAppStore((s) => s.sessionKeywords);

  // Determine robot visual state based on pipeline phase
  const state = useMemo(() => {
    switch (phase) {
      case 'processing': return 'thinking';
      case 'revealing': return 'revealing';
      case 'displaying': return 'hidden';
      case 'idle':
      case 'listening':
      default:
        return 'idle';
    }
  }, [phase]);

  // Escalation logic (Section 11)
  const isEscalated2 = consecutiveSameEmotion === 2;
  const isEscalated3 = consecutiveSameEmotion >= 3;

  const baseTranslateY = state === 'idle' ? '-8px' : isEscalated2 ? '-14px' : '-10px';
  const animDuration = state === 'idle' ? '4s' : isEscalated3 ? '2s' : '2.5s';
  const cloudScale = isEscalated3 ? 1.3 : isEscalated2 ? 1.15 : 1;

  // Track which words have been seen before across cycles
  const wordHistory = useMemo(() => {
    const history = new Set<string>();
    sessionKeywords.forEach((w) => history.add(w.toLowerCase()));
    return history;
  }, [sessionKeywords]);

  if (state === 'hidden') return null;

  return (
    <div className="fixed inset-0 z-[5] flex items-center justify-center pointer-events-none">

      {/* ─── THE ROBOT ─────────────────────────────────────────── */}
      <div
        className={`relative transition-all duration-1000 ${
          state === 'revealing'
            ? 'scale-110 opacity-0'
            : 'scale-100 opacity-100'
        }`}
        style={{
          animation: state !== 'revealing' ? `robotBob ${animDuration} ease-in-out infinite` : 'none',
        }}
      >
        <svg
          width="240"
          height="320"
          viewBox="0 0 240 320"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="cream-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5F0E8" />
              <stop offset="100%" stopColor="#E0D7C6" />
            </linearGradient>
            <linearGradient id="dark-face" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2A2A4A" />
              <stop offset="100%" stopColor="#1A1A2E" />
            </linearGradient>
            <filter id="shadow">
              <feDropShadow dx="0" dy="10" stdDeviation="15" floodColor="#000" floodOpacity="0.4" />
            </filter>
            <filter id="cap-shadow">
              <feDropShadow dx="2" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.3" />
            </filter>
            <filter id="eye-glow">
              <feGaussianBlur stdDeviation={isEscalated3 ? "6" : "3"} result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Base */}
          <path
            d="M 80 300 L 160 300 L 170 320 L 70 320 Z"
            fill="#B0A693"
            filter="url(#shadow)"
          />

          {/* Arms */}
          <rect x="20" y="160" width="30" height="90" rx="15" fill="#E0D7C6" filter="url(#shadow)" />
          <rect x="190" y="160" width="30" height="90" rx="15" fill="#E0D7C6" filter="url(#shadow)" />

          {/* Body */}
          <rect x="40" y="140" width="160" height="150" rx="40" fill="url(#cream-body)" filter="url(#shadow)" />
          {/* Subtle panel line */}
          <line x1="60" y1="215" x2="180" y2="215" stroke="#D0C4B0" strokeWidth="2" strokeLinecap="round" />

          {/* Head */}
          <rect x="50" y="60" width="140" height="100" rx="30" fill="url(#cream-body)" filter="url(#shadow)" />

          {/* Face Screen */}
          <rect x="65" y="75" width="110" height="70" rx="15" fill="url(#dark-face)" />

          {/* Eyes Group (handles blink & scan) */}
          <g
            className={`
              ${state === 'idle' ? 'animate-blink' : ''}
              ${state === 'thinking' ? 'animate-scan' : ''}
              ${state === 'revealing' ? 'animate-flash' : ''}
              ${isEscalated3 ? 'animate-pulse-fast' : ''}
            `}
            style={{ transformOrigin: '120px 110px' }}
          >
            {/* Left Eye */}
            <rect
              x="85" y="95" width="24" height="30" rx="6"
              fill={state === 'revealing' ? '#FFF' : '#00F5FF'}
              filter="url(#eye-glow)"
              className="eye-rect"
            />
            {/* Right Eye */}
            <rect
              x="131" y="95" width="24" height="30" rx="6"
              fill={state === 'revealing' ? '#FFF' : '#00F5FF'}
              filter="url(#eye-glow)"
              className="eye-rect"
            />
          </g>

          {/* Himalayan Topi Cap (tilted slightly, animates on escalation) */}
          <g
            className={isEscalated3 ? 'animate-wobble' : ''}
            style={{ transformOrigin: '120px 60px' }}
          >
            {/* Saffron base */}
            <path d="M 70 65 L 170 65 L 150 20 L 90 20 Z" fill="#FF9933" filter="url(#cap-shadow)" transform="rotate(-4, 120, 60)" />
            {/* Deep Red Band */}
            <path d="M 72 55 L 168 55 L 165 40 L 75 40 Z" fill="#8B0000" transform="rotate(-4, 120, 60)" />
            {/* Gold Finial */}
            <path d="M 120 15 L 115 20 L 125 20 Z" fill="#FFD700" transform="rotate(-4, 120, 60)" />
            <circle cx="120" cy="15" r="3" fill="#FFD700" transform="rotate(-4, 120, 60)" />
          </g>
        </svg>
      </div>

      {/* ─── THOUGHT CLOUD (Thinking State Only) ──────────────── */}
      {state === 'thinking' && (
        <div
          className="absolute origin-bottom-left animate-thought-pop"
          style={{
            top: 'calc(50% - 240px)',
            left: 'calc(50% + 100px)',
            transform: `scale(${cloudScale})`,
          }}
        >
          <div className="relative">
            {/* Context dots connecting to robot */}
            <div className="absolute -bottom-12 -left-12 w-4 h-4 rounded-full border border-sky-400/30 bg-[#030810]/90" />
            <div className="absolute -bottom-6 -left-6 w-6 h-6 rounded-full border border-sky-400/30 bg-[#030810]/90" />
            <div className="absolute -bottom-1 -left-1 w-10 h-10 rounded-full border border-sky-400/30 bg-[#030810]/90" />

            {/* Main cloud blob */}
            <div
              className="relative p-8 min-w-[300px] min-h-[220px] max-w-sm rounded-[3rem] border border-sky-400/30 flex items-center justify-center"
              style={{
                background: 'rgba(3, 8, 16, 0.85)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 30px rgba(56, 189, 248, 0.1)',
                borderTopLeftRadius: '1.5rem',
                borderBottomLeftRadius: '0.5rem',
              }}
            >
              <div className="flex flex-wrap gap-3 justify-center content-center relative z-10 w-full h-full">
                {floatingKeywords.map((kw, i) => {
                  const seenBefore = wordHistory.has(kw.toLowerCase());
                  const popDelay = isEscalated3 ? 0 : i * 350; // Simultaneous if escalated

                  return (
                    <span
                      key={`${kw}-${i}`}
                      className="font-light tracking-wide inline-block opacity-0 animate-word-pop"
                      style={{
                        animationDelay: `${popDelay}ms`,
                        color: seenBefore ? '#E0F2FE' : '#7DD3FC',
                        fontSize: seenBefore ? '1.5rem' : '1.25rem',
                        textShadow: seenBefore ? '0 0 15px rgba(56, 189, 248, 0.8)' : 'none',
                        fontWeight: seenBefore ? 400 : 300,
                      }}
                    >
                      {kw}
                    </span>
                  );
                })}
                {floatingKeywords.length === 0 && (
                  <span className="text-sky-300/40 text-sm tracking-widest animate-pulse">
                    PROCESSING...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CSS KEYFRAMES ────────────────────────────────────── */}
      <style jsx>{`
        @keyframes robotBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(${baseTranslateY}); }
        }

        .animate-blink {
          animation: blink 3.5s infinite;
        }
        @keyframes blink {
          0%, 96%, 100% { transform: scaleY(1); }
          98% { transform: scaleY(0.1); }
        }

        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
        @keyframes scan {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(6px); }
          75% { transform: translateX(-6px); }
        }

        .animate-flash {
          animation: flash 0.15s ease-in-out 3;
        }
        @keyframes flash {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 15px #FFF); }
          50% { opacity: 0; }
        }

        .animate-pulse-fast {
          animation: pulseFast 0.5s ease-in-out infinite;
        }
        @keyframes pulseFast {
          0%, 100% { filter: drop-shadow(0 0 10px #00F5FF); }
          50% { filter: drop-shadow(0 0 25px #00F5FF); }
        }

        .animate-wobble {
          animation: wobble 1s ease-in-out infinite;
        }
        @keyframes wobble {
          0%, 100% { transform: rotate(-4deg); }
          25% { transform: rotate(4deg); }
          75% { transform: rotate(-12deg); }
        }

        .animate-thought-pop {
          animation: thoughtPop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-origin: bottom left;
        }
        @keyframes thoughtPop {
          0% { transform: scale(0.3); opacity: 0; }
          100% { transform: scale(${cloudScale}); opacity: 1; }
        }

        .animate-word-pop {
          animation: wordPop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes wordPop {
          0% { transform: scale(0.5); opacity: 0; filter: blur(4px); }
          100% { transform: scale(1); opacity: 1; filter: blur(0px); }
        }
      `}</style>
    </div>
  );
}
