// components/WaterSpiritCanvas.tsx — Animated Himalayan water spirit with mist and particles
'use client';

import { useRef, useMemo, useState, useEffect, memo } from 'react';
import type { PipelinePhase } from '@/types';

interface Props {
  phase: PipelinePhase;
}

// Generate stable particle data once
function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 8 + Math.random() * 12,
    delay: Math.random() * -20,
    opacity: 0.2 + Math.random() * 0.5,
  }));
}

function generateRipples(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: i * 1.5,
    duration: 4 + Math.random() * 2,
  }));
}

export default memo(function WaterSpiritCanvas({ phase }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const particles = useMemo(() => isMounted ? generateParticles(35) : [], [isMounted]);
  const ripples = useMemo(() => isMounted ? generateRipples(5) : [], [isMounted]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Phase-dependent speed multiplier for particles
  const speedClass = phase === 'processing' ? 'spirit-active' : phase === 'listening' ? 'spirit-listening' : '';

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 overflow-hidden transition-opacity duration-1000 ${
        phase === 'displaying' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ zIndex: 5 }}
    >
      {/* ─── BACKGROUND MIST LAYERS ─────────────────────────────── */}
      <div className="absolute inset-0">
        {/* Base deep gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 70%, #0a1628 0%, #030810 60%, #000000 100%)',
          }}
        />

        {/* Animated mist layer 1 */}
        <div
          className="absolute inset-0 animate-mist-drift-1"
          style={{
            background: 'radial-gradient(ellipse at 30% 60%, rgba(56, 189, 248, 0.06) 0%, transparent 60%)',
          }}
        />

        {/* Animated mist layer 2 */}
        <div
          className="absolute inset-0 animate-mist-drift-2"
          style={{
            background: 'radial-gradient(ellipse at 70% 40%, rgba(147, 197, 253, 0.05) 0%, transparent 50%)',
          }}
        />

        {/* Animated mist layer 3 — stronger during processing */}
        <div
          className={`absolute inset-0 transition-opacity duration-2000 ${
            phase === 'processing' || phase === 'revealing' ? 'opacity-100' : 'opacity-30'
          }`}
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(56, 189, 248, 0.08) 0%, transparent 40%)',
            animation: 'mistPulse 6s ease-in-out infinite',
          }}
        />
      </div>

      {/* ─── WATER RIPPLES (show during processing/revealing) ───── */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
          phase === 'processing' || phase === 'revealing' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="absolute rounded-full border"
            style={{
              borderColor: 'rgba(56, 189, 248, 0.15)',
              animation: `rippleExpand ${ripple.duration}s ease-out ${ripple.delay}s infinite`,
              width: '20px',
              height: '20px',
            }}
          />
        ))}
      </div>

      {/* ─── SPIRIT SILHOUETTE ──────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`relative transition-all duration-1000 ${speedClass} ${
            phase === 'revealing' ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          {/* Spirit glow aura */}
          <div
            className={`absolute -inset-16 rounded-full transition-all duration-1000 ${
              phase === 'listening'
                ? 'opacity-60'
                : phase === 'processing'
                ? 'opacity-80'
                : 'opacity-30'
            }`}
            style={{
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(56, 189, 248, 0.05) 50%, transparent 70%)',
              animation: phase === 'listening' ? 'glowPulse 2s ease-in-out infinite' : phase === 'processing' ? 'glowPulse 1.2s ease-in-out infinite' : 'glowPulse 4s ease-in-out infinite',
            }}
          />

          {/* Spirit SVG */}
          <svg
            viewBox="0 0 200 300"
            className={`w-32 h-48 md:w-48 md:h-72 transition-transform duration-2000 ${
              phase === 'listening' ? 'animate-spirit-listen' : phase === 'processing' ? 'animate-spirit-think' : 'animate-spirit-idle'
            }`}
            style={{ filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.4))' }}
          >
            {/* Spirit body — abstract water form */}
            <defs>
              <linearGradient id="spiritGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(147, 197, 253, 0.9)" />
                <stop offset="50%" stopColor="rgba(56, 189, 248, 0.7)" />
                <stop offset="100%" stopColor="rgba(14, 165, 233, 0.3)" />
              </linearGradient>
              <filter id="spiritGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Head — luminous orb */}
            <circle
              cx="100" cy="60" r="28"
              fill="url(#spiritGrad)"
              filter="url(#spiritGlow)"
              opacity="0.9"
            />

            {/* Inner eye glow */}
            <circle
              cx="100" cy="55" r="8"
              fill="rgba(224, 242, 254, 0.9)"
              className={phase === 'listening' ? 'animate-eye-pulse' : ''}
            />

            {/* Body — flowing water form */}
            <path
              d="M70,90 Q100,80 130,90 Q140,130 135,170 Q130,200 125,230 Q120,260 100,280 Q80,260 75,230 Q70,200 65,170 Q60,130 70,90Z"
              fill="url(#spiritGrad)"
              filter="url(#spiritGlow)"
              opacity="0.7"
              className="animate-body-flow"
            />

            {/* Water tendrils */}
            <path
              d="M65,170 Q40,190 30,220 Q25,240 35,250"
              stroke="rgba(56, 189, 248, 0.4)"
              strokeWidth="3"
              fill="none"
              className="animate-tendril-left"
            />
            <path
              d="M135,170 Q160,190 170,220 Q175,240 165,250"
              stroke="rgba(56, 189, 248, 0.4)"
              strokeWidth="3"
              fill="none"
              className="animate-tendril-right"
            />
          </svg>

          {/* Phase label */}
          <div className={`absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-700 ${
            phase === 'idle' ? 'opacity-0' : 'opacity-70'
          }`}>
            <span className="text-sky-300/60 text-sm tracking-[0.3em] uppercase font-light">
              {phase === 'listening' && '✦ listening ✦'}
              {phase === 'processing' && '✦ weaving vision ✦'}
              {phase === 'revealing' && '✦ emerging ✦'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── FLOATING PARTICLES ──────────────────────────────────── */}
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full transition-opacity duration-2000 ${
            phase === 'idle' ? 'opacity-30' : phase === 'processing' ? 'opacity-80' : 'opacity-50'
          }`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, rgba(147, 197, 253, ${p.opacity}) 0%, transparent 70%)`,
            animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* ─── CSS ANIMATIONS ──────────────────────────────────────── */}
      <style jsx>{`
        @keyframes mistPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
        }

        @keyframes rippleExpand {
          0% { width: 20px; height: 20px; opacity: 0.6; }
          100% { width: 400px; height: 400px; opacity: 0; }
        }

        @keyframes glowPulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }

        @keyframes particleFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(10px, -20px) scale(1.2); }
          50% { transform: translate(-5px, -35px) scale(0.8); }
          75% { transform: translate(15px, -15px) scale(1.1); }
        }

        .animate-mist-drift-1 {
          animation: mistDrift1 20s ease-in-out infinite;
        }
        @keyframes mistDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
        }

        .animate-mist-drift-2 {
          animation: mistDrift2 25s ease-in-out infinite reverse;
        }
        @keyframes mistDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 15px) scale(1.15); }
        }

        .animate-spirit-idle {
          animation: spiritBob 6s ease-in-out infinite;
        }
        @keyframes spiritBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .animate-spirit-listen {
          animation: spiritListen 3s ease-in-out infinite;
        }
        @keyframes spiritListen {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          30% { transform: translateY(-5px) rotate(3deg); }
          70% { transform: translateY(-3px) rotate(-2deg); }
        }

        .animate-spirit-think {
          animation: spiritThink 2s ease-in-out infinite;
        }
        @keyframes spiritThink {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          25% { transform: translateY(-6px) rotate(5deg) scale(1.02); }
          75% { transform: translateY(-4px) rotate(-4deg) scale(0.98); }
        }

        .animate-eye-pulse {
          animation: eyePulse 1.5s ease-in-out infinite;
        }
        @keyframes eyePulse {
          0%, 100% { r: 8; opacity: 0.9; }
          50% { r: 10; opacity: 1; }
        }

        .animate-body-flow {
          animation: bodyFlow 8s ease-in-out infinite;
        }
        @keyframes bodyFlow {
          0%, 100% { d: path("M70,90 Q100,80 130,90 Q140,130 135,170 Q130,200 125,230 Q120,260 100,280 Q80,260 75,230 Q70,200 65,170 Q60,130 70,90Z"); }
          50% { d: path("M72,92 Q100,78 128,92 Q138,132 133,172 Q128,202 123,232 Q118,262 100,278 Q82,262 77,232 Q72,202 67,172 Q62,132 72,92Z"); }
        }

        .animate-tendril-left {
          animation: tendrilLeft 5s ease-in-out infinite;
        }
        @keyframes tendrilLeft {
          0%, 100% { d: path("M65,170 Q40,190 30,220 Q25,240 35,250"); opacity: 0.4; }
          50% { d: path("M65,170 Q35,195 25,225 Q20,245 30,255"); opacity: 0.7; }
        }

        .animate-tendril-right {
          animation: tendrilRight 5s ease-in-out 0.5s infinite;
        }
        @keyframes tendrilRight {
          0%, 100% { d: path("M135,170 Q160,190 170,220 Q175,240 165,250"); opacity: 0.4; }
          50% { d: path("M135,170 Q165,195 175,225 Q180,245 170,255"); opacity: 0.7; }
        }

        .spirit-active {
          filter: drop-shadow(0 0 40px rgba(56, 189, 248, 0.5));
        }

        .spirit-listening {
          filter: drop-shadow(0 0 25px rgba(56, 189, 248, 0.3));
        }
      `}</style>
    </div>
  );
})
