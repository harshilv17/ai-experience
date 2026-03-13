// components/RobotMascot.tsx — SVG/CSS Robot Character (Section 2 & 11)
'use client';

import { useMemo, useState, useEffect, memo } from 'react';
import { useAppStore } from '@/store/appStore';
import type { PipelinePhase } from '@/types';

interface Props {
  phase: PipelinePhase;
  consecutiveSameEmotion: number;
}

export default memo(function RobotMascot({ phase, consecutiveSameEmotion }: Props) {
  const floatingKeywords = useAppStore((s) => s.floatingKeywords);
  const sessionKeywords = useAppStore((s) => s.sessionKeywords);

  // Dynamic Eye Animations
  const [eyeAnimIndex, setEyeAnimIndex] = useState(0);

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

  // Eye expressive animation loop during "thinking"
  useEffect(() => {
    if (state === 'thinking') {
      const interval = setInterval(() => {
        // Randomly pick eye shapes: 0=normal, 1=wide, 2=tall, 3=tiny
        setEyeAnimIndex(Math.floor(Math.random() * 4));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setEyeAnimIndex(0);
    }
  }, [state]);

  const eyeTransform = useMemo(() => {
    switch(eyeAnimIndex) {
      case 1: return 'scale(1.4, 0.4)';  // Wide / squint
      case 2: return 'scale(0.4, 1.4)';  // Elongated vertically 
      case 3: return 'scale(0.3, 0.3)';  // Very small
      case 0:
      default: return 'scale(1, 1)';     // Normal
    }
  }, [eyeAnimIndex]);

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

      {/* ─── THE NEW HIMALAYAN ROBOT ─────────────────────────── */}
      <div
        className={`relative transition-all duration-1000 ${
          state === 'revealing'
            ? 'scale-125 opacity-0'
            : 'scale-[1.15] opacity-100' // Base scale is larger
        }`}
        style={{
          animation: state !== 'revealing' ? `robotBob ${animDuration} ease-in-out infinite` : 'none',
        }}
      >
        <svg
          width="400"
          height="480"
          viewBox="0 0 400 480"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="cream-head" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FAFAF7" />
              <stop offset="100%" stopColor="#DFDCCF" />
            </linearGradient>
            <linearGradient id="screen-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1C1B2E" />
              <stop offset="100%" stopColor="#0B0B14" />
            </linearGradient>

            <filter id="shadow-lg">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000" floodOpacity="0.4" />
            </filter>
            <filter id="shadow-sm">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.3" />
            </filter>
            <filter id="glow-eye">
              <feGaussianBlur stdDeviation={isEscalated3 ? "8" : "5"} result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Base / Pedestal */}
          <path d="M 140 420 L 260 420 L 300 480 L 100 480 Z" fill="#D4D4D8" filter="url(#shadow-lg)"/>
          <rect x="170" y="380" width="60" height="60" fill="#A1A1AA" />

          {/* Arms */}
          <rect x="40" y="200" width="60" height="130" rx="30" fill="url(#cream-head)" filter="url(#shadow-lg)" />
          <rect x="300" y="200" width="60" height="130" rx="30" fill="url(#cream-head)" filter="url(#shadow-lg)" />

          {/* Body */}
          <rect x="70" y="150" width="260" height="240" rx="90" fill="url(#cream-head)" filter="url(#shadow-lg)" />

          {/* Minimal Body Detail */}
          <line x1="120" y1="280" x2="280" y2="280" stroke="#E5E5E5" strokeWidth="3" strokeLinecap="round" />
          <circle cx="200" cy="240" r="12" fill="#E4E4E7" filter="url(#shadow-sm)" />
          <circle cx="200" cy="240" r="4" fill="#38BDF8" opacity="0.5" />
          <circle cx="200" cy="310" r="12" fill="#E4E4E7" filter="url(#shadow-sm)" />
          <circle cx="200" cy="310" r="4" fill="#38BDF8" opacity="0.5" />

          {/* Head Base */}
          <rect x="90" y="40" width="220" height="160" rx="60" fill="url(#cream-head)" filter="url(#shadow-lg)" />

          {/* Face Screen */}
          <rect x="110" y="65" width="180" height="110" rx="35" fill="url(#screen-grad)" />

          {/* Eyes Group (handles dynamic scale, blink, flash) */}
          <g
            className={`
              ${state === 'idle' ? 'animate-blink' : ''}
              ${state === 'revealing' ? 'animate-flash' : ''}
            `}
            style={{ 
               transformOrigin: '200px 120px',
               transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' 
            }}
          >
            {/* Contains the reactive shape transforms */}
            <g style={{ 
               transform: eyeTransform, 
               transformOrigin: '200px 120px',
               transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' 
            }}>
              {/* Left Eye */}
              <rect
                x="145" y="90" width="35" height="45" rx="10"
                fill={state === 'revealing' ? '#FFF' : '#38BDF8'}
                filter={state === 'revealing' ? 'none' : 'url(#glow-eye)'}
              />
              {/* Right Eye */}
              <rect
                x="220" y="90" width="35" height="45" rx="10"
                fill={state === 'revealing' ? '#FFF' : '#38BDF8'}
                filter={state === 'revealing' ? 'none' : 'url(#glow-eye)'}
              />
            </g>
          </g>

          {/* Cap (Himalayan Topi) */}
          <g transform="translate(100, -10)" className={isEscalated3 ? 'animate-wobble' : ''} style={{ transformOrigin: '100px 40px' }}>
            {/* Cap Band - Duller red/brown base */}
            <path d="M 0 55 L 200 55 L 180 5 L 20 5 Z" fill="#8B5A2B" filter="url(#shadow-sm)" />
            {/* Front Band Detail */}
            <path d="M 10 45 L 190 45 L 175 15 L 25 15 Z" fill="#6B4226" />
            
            {/* Topi Signature Peak/Flap - Duller orange/mustard */}
            <polygon points="50,5 150,5 120,-30 80,-30" fill="#C5832B" />
            <polygon points="60,5 140,5 110,-25 90,-25" fill="#A46B22" />
          </g>
        </svg>
      </div>

      {/* ─── THOUGHT CLOUD (Thinking State Only) ──────────────── */}
      {state === 'thinking' && (
        <div
          className="absolute origin-bottom-left animate-thought-pop"
          style={{
            top: 'calc(50% - 280px)', // adjusted for bigger robot
            left: 'calc(50% + 140px)',
            transform: `scale(${cloudScale})`,
          }}
        >
          <div className="relative">
            {/* Context dots connecting to robot */}
            <div className="absolute -bottom-14 -left-16 w-5 h-5 rounded-full border border-sky-300/30 bg-[#030810]/90" />
            <div className="absolute -bottom-6 -left-8 w-8 h-8 rounded-full border border-sky-300/30 bg-[#030810]/90" />
            
            {/* Main cloud blob */}
            <div
              className="relative p-8 min-w-[320px] min-h-[240px] max-w-sm rounded-[3rem] border border-sky-400/40 flex items-center justify-center"
              style={{
                background: 'rgba(3, 8, 16, 0.85)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 0 40px rgba(56, 189, 248, 0.15)',
                borderTopLeftRadius: '2rem',
                borderBottomLeftRadius: '0.5rem',
              }}
            >
              <div className="flex flex-wrap gap-4 justify-center content-center relative z-10 w-full h-full">
                {floatingKeywords.map((kw, i) => {
                  const seenBefore = wordHistory.has(kw.toLowerCase());
                  const popDelay = isEscalated3 ? 0 : i * 350; // Simultaneous if escalated

                  return (
                    <span
                      key={`${kw}-${i}`}
                      className="font-light tracking-wide inline-block opacity-0 animate-word-pop"
                      style={{
                        animationDelay: `${popDelay}ms`,
                        color: seenBefore ? '#E0F2FE' : '#38BDF8',
                        fontSize: seenBefore ? '1.75rem' : '1.35rem',
                        textShadow: seenBefore ? '0 0 20px rgba(56, 189, 248, 0.9)' : 'none',
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
          0%, 100% { transform: translateY(0) scale(1.15); }
          50% { transform: translateY(${baseTranslateY}) scale(1.15); }
        }

        .animate-blink {
          animation: blink 4s infinite;
        }
        @keyframes blink {
          0%, 95%, 100% { transform: scaleY(1); }
          97% { transform: scaleY(0.1); }
        }

        .animate-flash {
          animation: flash 0.2s ease-in-out 3;
        }
        @keyframes flash {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 20px #FFF); }
          50% { opacity: 0; }
        }

        .animate-wobble {
          animation: wobble 1s ease-in-out infinite;
        }
        @keyframes wobble {
          0%, 100% { transform: rotate(-3deg); }
          25% { transform: rotate(4deg); }
          75% { transform: rotate(-8deg); }
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
})
