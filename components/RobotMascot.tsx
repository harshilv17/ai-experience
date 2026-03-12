// components/RobotMascot.tsx — SVG/CSS Robot Character (Section 2 & 11)
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import type { PipelinePhase } from '@/types';

interface Props {
  phase: PipelinePhase;
  consecutiveSameEmotion: number;
}

export default function RobotMascot({ phase, consecutiveSameEmotion }: Props) {
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

            {/* Himalayan Patterns */}
            <pattern id="cap-pat" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#2C3E50"/>
              <polygon points="20,5 35,20 20,35 5,20" fill="#C0392B"/>
              <polygon points="20,10 30,20 20,30 10,20" fill="#F39C12"/>
              <circle cx="5" cy="5" r="2" fill="#3498DB"/>
              <circle cx="35" cy="5" r="2" fill="#3498DB"/>
              <circle cx="5" cy="35" r="2" fill="#3498DB"/>
              <circle cx="35" cy="35" r="2" fill="#3498DB"/>
            </pattern>

            <pattern id="scarf-pat" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
              <rect width="60" height="60" fill="#2980B9"/>
              <path d="M0,15 L30,45 L60,15" stroke="#27AE60" strokeWidth="8" fill="none"/>
              <path d="M0,35 L30,65 L60,35" stroke="#C0392B" strokeWidth="8" fill="none"/>
              <circle cx="30" cy="15" r="5" fill="#F1C40F"/>
              <circle cx="30" cy="55" r="5" fill="#F1C40F"/>
              <circle cx="15" cy="30" r="3" fill="#FFF"/>
              <circle cx="45" cy="30" r="3" fill="#FFF"/>
            </pattern>

            <pattern id="vest-pat" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect width="80" height="80" fill="#8B0000"/>
              <rect x="10" y="10" width="60" height="60" fill="none" stroke="#F39C12" strokeWidth="3"/>
              <rect x="15" y="15" width="50" height="50" fill="none" stroke="#2980B9" strokeWidth="3"/>
              <path d="M25,30 h30 v20 h-30 Z" fill="none" stroke="#F1C40F" strokeWidth="4"/>
              <path d="M40,20 v40" stroke="#F1C40F" strokeWidth="4"/>
            </pattern>

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
          <path d="M 120 440 L 280 440 L 320 480 L 80 480 Z" fill="#D4D4D8" filter="url(#shadow-lg)"/>
          <rect x="160" y="400" width="80" height="50" fill="#A1A1AA" />

          {/* Arms */}
          <rect x="40" y="180" width="60" height="150" rx="30" fill="url(#cream-head)" filter="url(#shadow-lg)" />
          <rect x="300" y="180" width="60" height="150" rx="30" fill="url(#cream-head)" filter="url(#shadow-lg)" />

          {/* Body */}
          <rect x="70" y="150" width="260" height="260" rx="110" fill="url(#cream-head)" filter="url(#shadow-lg)" />

          {/* Vest */}
          <path d="M 70 170 A 100 100 0 0 1 330 170 L 330 380 A 100 100 0 0 1 70 380 Z" fill="url(#vest-pat)" />
          {/* Vest Center Opening */}
          <rect x="160" y="150" width="80" height="260" fill="url(#cream-head)" filter="url(#shadow-sm)" />
          <line x1="160" y1="150" x2="160" y2="400" stroke="#F39C12" strokeWidth="5" />
          <line x1="240" y1="150" x2="240" y2="400" stroke="#F39C12" strokeWidth="5" />

          {/* Gold Buttons */}
          <circle cx="200" cy="240" r="8" fill="#F1C40F" filter="url(#shadow-sm)" />
          <circle cx="200" cy="240" r="3" fill="#D35400" />
          <circle cx="200" cy="290" r="8" fill="#F1C40F" filter="url(#shadow-sm)" />
          <circle cx="200" cy="290" r="3" fill="#D35400" />
          <circle cx="200" cy="340" r="8" fill="#F1C40F" filter="url(#shadow-sm)" />
          <circle cx="200" cy="340" r="3" fill="#D35400" />

          {/* Scarf Back Loop */}
          <path d="M 60 170 C 130 240, 270 240, 340 170 C 270 270, 130 270, 60 170" fill="url(#scarf-pat)" filter="url(#shadow-lg)"/>

          {/* Head Base */}
          <rect x="90" y="40" width="220" height="160" rx="60" fill="url(#cream-head)" filter="url(#shadow-lg)" />

          {/* Front Scarf Wrap */}
          <path d="M 60 160 Q 200 220 340 160 Q 200 180 60 160" fill="url(#scarf-pat)" filter="url(#shadow-lg)" />
          {/* Scarf Dangling Ends */}
          <rect x="100" y="180" width="45" height="130" fill="url(#scarf-pat)" filter="url(#shadow-sm)" />
          <rect x="255" y="170" width="45" height="120" fill="url(#scarf-pat)" filter="url(#shadow-sm)" />
          {/* Fringes Blue Base */}
          <rect x="100" y="310" width="45" height="20" fill="#1A5276" />
          <rect x="255" y="290" width="45" height="20" fill="#1A5276" />
          {/* Fringe Cuts Left */}
          {Array.from({length: 8}).map((_, i) => (
             <line key={`fl-${i}`} x1={105 + i * 5} y1={310} x2={105 + i * 5} y2={330} stroke="#000" strokeWidth="1.5" opacity="0.4" />
          ))}
          {/* Fringe Cuts Right */}
          {Array.from({length: 8}).map((_, i) => (
             <line key={`fr-${i}`} x1={260 + i * 5} y1={290} x2={260 + i * 5} y2={310} stroke="#000" strokeWidth="1.5" opacity="0.4" />
          ))}

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
            {/* Cap Band */}
            <path d="M 0 55 L 200 55 L 180 5 L 20 5 Z" fill="url(#cap-pat)" filter="url(#shadow-sm)" />
            {/* Orange Triangular Peak/Flap */}
            <polygon points="50,5 150,5 120,-30 80,-30" fill="#F39C12" />
            <polygon points="60,5 140,5 110,-25 90,-25" fill="#E67E22" />
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
}
