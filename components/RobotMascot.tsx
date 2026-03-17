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
  const liveTranscript = useAppStore((s) => s.liveTranscript);

  // Dynamic Eye Animations
  const [eyeAnimIndex, setEyeAnimIndex] = useState(0);

  // Animated transcript words (typing effect)
  const [visibleWordCount, setVisibleWordCount] = useState(0);

  // Determine robot visual state based on pipeline phase
  const state = useMemo(() => {
    switch (phase) {
      case 'processing':
      case 'showing_prompt':
        return 'thinking';
      case 'revealing':
        return 'revealing';
      case 'displaying':
        return 'hidden';
      case 'idle':
      case 'listening':
      default:
        return 'idle';
    }
  }, [phase]);

  // Split transcript into words for animated display
  const transcriptWords = useMemo(() => {
    if (!liveTranscript) return [];
    return liveTranscript.split(/\s+/).filter(w => w.length > 0);
  }, [liveTranscript]);

  // Typing effect: reveal words one by one
  useEffect(() => {
    if (state !== 'thinking' || transcriptWords.length === 0) {
      setVisibleWordCount(0);
      return;
    }
    setVisibleWordCount(0);
    const interval = setInterval(() => {
      setVisibleWordCount(prev => {
        if (prev >= transcriptWords.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [state, transcriptWords]);

  // Eye expressive animation loop during "thinking"
  useEffect(() => {
    if (state === 'thinking') {
      const interval = setInterval(() => {
        setEyeAnimIndex(Math.floor(Math.random() * 4));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setEyeAnimIndex(0);
    }
  }, [state]);

  const eyeTransform = useMemo(() => {
    switch(eyeAnimIndex) {
      case 1: return 'scale(1.4, 0.4)';
      case 2: return 'scale(0.4, 1.4)';
      case 3: return 'scale(0.3, 0.3)';
      case 0:
      default: return 'scale(1, 1)';
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

  // Check if typing is still in progress
  const isStillTyping = visibleWordCount < transcriptWords.length;

  if (state === 'hidden') return null;

  return (
    <div className="fixed inset-0 z-[5] flex items-center justify-center pointer-events-none">

      {/* ─── THE NEW HIMALAYAN ROBOT ─────────────────────────── */}
      <div
        className={`relative transition-all duration-1000 ${
          state === 'revealing'
            ? 'scale-125 opacity-0'
            : 'scale-[1.15] opacity-100'
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

          {/* Eyes Group */}
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
            <path d="M 0 55 L 200 55 L 180 5 L 20 5 Z" fill="#8B5A2B" filter="url(#shadow-sm)" />
            <path d="M 10 45 L 190 45 L 175 15 L 25 15 Z" fill="#6B4226" />
            <polygon points="50,5 150,5 120,-30 80,-30" fill="#C5832B" />
            <polygon points="60,5 140,5 110,-25 90,-25" fill="#A46B22" />
          </g>
        </svg>
      </div>

      {/* ─── SPEECH BUBBLE (Thinking State) ───────────────────── */}
      {state === 'thinking' && (
        <div
          className="absolute animate-speech-bubble-pop"
          style={{
            top: 'calc(50% - 300px)',
            left: 'calc(50% + 120px)',
            transform: `scale(${cloudScale})`,
            transformOrigin: 'bottom left',
          }}
        >
          <div className="relative">
            {/* Speech bubble tail — three dots leading to robot */}
            <div className="absolute -bottom-16 -left-12 w-4 h-4 rounded-full bg-sky-400/20 border border-sky-400/30 animate-dot-pulse" style={{ animationDelay: '0.4s' }} />
            <div className="absolute -bottom-9 -left-6 w-6 h-6 rounded-full bg-sky-400/25 border border-sky-400/30 animate-dot-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="absolute -bottom-3 left-2 w-8 h-8 rounded-full bg-sky-400/20 border border-sky-400/30 animate-dot-pulse" style={{ animationDelay: '0s' }} />

            {/* Main speech bubble */}
            <div
              className="relative px-7 py-6 min-w-[340px] max-w-[440px] rounded-2xl border border-sky-400/30"
              style={{
                background: 'linear-gradient(135deg, rgba(3, 8, 22, 0.92), rgba(8, 15, 35, 0.88))',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 0 50px rgba(56, 189, 248, 0.12), inset 0 1px 0 rgba(56, 189, 248, 0.1)',
              }}
            >
              {/* Top label */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                <span className="text-[10px] tracking-[0.25em] uppercase text-sky-400/60 font-medium">
                  Processing Speech
                </span>
              </div>

              {/* Transcript words with typing animation */}
              <div className="min-h-[80px] max-h-[160px] overflow-hidden">
                {transcriptWords.length > 0 ? (
                  <p className="text-sky-100/90 text-sm leading-relaxed font-light">
                    {transcriptWords.slice(0, visibleWordCount).map((word, i) => (
                      <span
                        key={`tw-${i}`}
                        className="inline-block animate-word-fade-in mr-[0.3em]"
                        style={{ animationDelay: '0ms' }}
                      >
                        {word}
                      </span>
                    ))}
                    {isStillTyping && (
                      <span className="inline-block w-[2px] h-[14px] bg-sky-400 ml-0.5 animate-cursor-blink align-middle" />
                    )}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-sky-300/30">
                    <span className="text-sm tracking-wider animate-pulse">Listening</span>
                    <span className="flex gap-1">
                      <span className="w-1 h-1 rounded-full bg-sky-400/40 animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-1 h-1 rounded-full bg-sky-400/40 animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1 h-1 rounded-full bg-sky-400/40 animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </span>
                  </div>
                )}
              </div>

              {/* Keywords row at bottom */}
              {floatingKeywords.length > 0 && (
                <div className="mt-3 pt-3 border-t border-sky-500/10 flex flex-wrap gap-2">
                  {floatingKeywords.map((kw, i) => {
                    const seenBefore = wordHistory.has(kw.toLowerCase());
                    return (
                      <span
                        key={`kw-${kw}-${i}`}
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-medium animate-keyword-pop"
                        style={{
                          animationDelay: `${i * 150}ms`,
                          background: seenBefore
                            ? 'rgba(56, 189, 248, 0.2)'
                            : 'rgba(56, 189, 248, 0.08)',
                          color: seenBefore ? '#BAE6FD' : '#7DD3FC',
                          border: `1px solid ${seenBefore ? 'rgba(56, 189, 248, 0.4)' : 'rgba(56, 189, 248, 0.15)'}`,
                          textShadow: seenBefore ? '0 0 12px rgba(56, 189, 248, 0.6)' : 'none',
                        }}
                      >
                        {kw}
                      </span>
                    );
                  })}
                </div>
              )}
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

        .animate-speech-bubble-pop {
          animation: speechBubblePop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes speechBubblePop {
          0% { transform: scale(0.4) translateY(20px); opacity: 0; }
          100% { transform: scale(${cloudScale}) translateY(0); opacity: 1; }
        }

        .animate-dot-pulse {
          animation: dotPulse 2s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }

        .animate-word-fade-in {
          animation: wordFadeIn 200ms ease-out forwards;
        }
        @keyframes wordFadeIn {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .animate-cursor-blink {
          animation: cursorBlink 0.8s step-end infinite;
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .animate-keyword-pop {
          animation: keywordPop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }
        @keyframes keywordPop {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
})
