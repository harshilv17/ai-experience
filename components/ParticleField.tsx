// components/ParticleField.tsx — CSS-only reactive particle system for projection background
'use client';

import { useMemo, useState, useEffect, memo } from 'react';
import type { PipelinePhase } from '@/types';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  hue: number; // for color variation
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 10 + Math.random() * 15,
    delay: Math.random() * -20,
    opacity: 0.15 + Math.random() * 0.4,
    hue: 190 + Math.random() * 30, // cyan to blue range
  }));
}

interface Props {
  phase: PipelinePhase;
}

export default memo(function ParticleField({ phase }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const particles = useMemo(() => (isMounted ? generateParticles(36) : []), [isMounted]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isListening = phase === 'listening';
  const isProcessing = phase === 'processing' || phase === 'showing_prompt';
  const isRevealing = phase === 'revealing';
  const isDisplaying = phase === 'displaying';

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden transition-opacity duration-[2000ms] ${
        isDisplaying ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ zIndex: 2 }}
    >
      {particles.map((p) => {
        const speedMultiplier = isProcessing ? 0.5 : isListening ? 0.7 : 1;
        const particleOpacity = isProcessing
          ? p.opacity * 2
          : isListening
          ? p.opacity * 1.4
          : isRevealing
          ? p.opacity * 2.5
          : p.opacity;

        return (
          <div
            key={p.id}
            className={`absolute rounded-full ${
              isRevealing ? 'particle-rush' : ''
            }`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: Math.min(particleOpacity, 1),
              background: `radial-gradient(circle, hsla(${p.hue}, 80%, 70%, ${Math.min(
                particleOpacity + 0.2,
                1
              )}) 0%, transparent 70%)`,
              boxShadow: isProcessing
                ? `0 0 ${p.size * 3}px hsla(${p.hue}, 80%, 60%, 0.4)`
                : isRevealing
                ? `0 0 ${p.size * 4}px hsla(${p.hue}, 80%, 60%, 0.6)`
                : 'none',
              animation: `particleDrift ${p.duration * speedMultiplier}s ease-in-out ${p.delay}s infinite`,
              transition: 'opacity 1.5s ease, box-shadow 1.5s ease',
            }}
          />
        );
      })}

      {/* Larger accent orbs — 6 bigger, slower, more colorful particles */}
      {isMounted &&
        [0, 1, 2, 3, 4, 5].map((i) => {
          const orbX = 15 + i * 14;
          const orbY = 25 + (i % 3) * 20;
          const orbSize = 6 + i * 2;
          const orbHue = 190 + i * 15;
          const orbDuration = 18 + i * 4;

          return (
            <div
              key={`orb-${i}`}
              className={`absolute rounded-full transition-all duration-[2000ms] ${
                isRevealing ? 'particle-rush' : ''
              }`}
              style={{
                left: `${orbX}%`,
                top: `${orbY}%`,
                width: `${orbSize}px`,
                height: `${orbSize}px`,
                opacity: isProcessing ? 0.5 : isListening ? 0.35 : 0.2,
                background: `radial-gradient(circle, hsla(${orbHue}, 85%, 65%, 0.6) 0%, hsla(${orbHue}, 70%, 50%, 0.1) 60%, transparent 80%)`,
                boxShadow: `0 0 ${orbSize * 4}px hsla(${orbHue}, 80%, 60%, ${
                  isProcessing ? 0.3 : 0.1
                })`,
                animation: `orbFloat ${orbDuration}s ease-in-out ${-i * 3}s infinite`,
              }}
            />
          );
        })}

      <style jsx>{`
        @keyframes particleDrift {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          20% {
            transform: translate(12px, -18px) scale(1.15);
          }
          40% {
            transform: translate(-8px, -30px) scale(0.9);
          }
          60% {
            transform: translate(18px, -12px) scale(1.1);
          }
          80% {
            transform: translate(-6px, -24px) scale(0.95);
          }
        }

        @keyframes orbFloat {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -30px) scale(1.2);
          }
          50% {
            transform: translate(-15px, -50px) scale(0.85);
          }
          75% {
            transform: translate(25px, -20px) scale(1.1);
          }
        }

        .particle-rush {
          animation: rushToCenter 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
        }

        @keyframes rushToCenter {
          0% {
            opacity: 1;
          }
          70% {
            opacity: 0.8;
            transform: translate(
              calc(50vw - 100%),
              calc(50vh - 100%)
            ) scale(0.3);
          }
          100% {
            opacity: 0;
            transform: translate(
              calc(50vw - 100%),
              calc(50vh - 100%)
            ) scale(0);
          }
        }
      `}</style>
    </div>
  );
});
