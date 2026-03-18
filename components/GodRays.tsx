// components/GodRays.tsx — Animated light rays radiating from behind the robot
'use client';

import { memo } from 'react';
import type { PipelinePhase } from '@/types';

interface Props {
  phase: PipelinePhase;
}

export default memo(function GodRays({ phase }: Props) {
  const isProcessing = phase === 'processing' || phase === 'showing_prompt';
  const isRevealing = phase === 'revealing';
  const isDisplaying = phase === 'displaying';

  return (
    <div
      className={`fixed inset-0 pointer-events-none transition-opacity duration-[2000ms] ${
        isDisplaying ? 'opacity-0' : isRevealing ? 'opacity-60' : isProcessing ? 'opacity-40' : 'opacity-20'
      }`}
      style={{ zIndex: 3 }}
    >
      {/* Central radial rays */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="god-rays-rotate"
          style={{
            width: '120vmax',
            height: '120vmax',
            background: `
              conic-gradient(
                from 0deg,
                transparent 0deg,
                rgba(56, 189, 248, 0.02) 5deg,
                transparent 10deg,
                transparent 20deg,
                rgba(99, 102, 241, 0.015) 25deg,
                transparent 30deg,
                transparent 45deg,
                rgba(56, 189, 248, 0.02) 50deg,
                transparent 55deg,
                transparent 70deg,
                rgba(147, 197, 253, 0.015) 75deg,
                transparent 80deg,
                transparent 90deg,
                rgba(56, 189, 248, 0.02) 95deg,
                transparent 100deg,
                transparent 115deg,
                rgba(79, 70, 229, 0.015) 120deg,
                transparent 125deg,
                transparent 140deg,
                rgba(56, 189, 248, 0.02) 145deg,
                transparent 150deg,
                transparent 160deg,
                rgba(147, 197, 253, 0.015) 165deg,
                transparent 170deg,
                transparent 180deg,
                rgba(56, 189, 248, 0.02) 185deg,
                transparent 190deg,
                transparent 200deg,
                rgba(99, 102, 241, 0.015) 205deg,
                transparent 210deg,
                transparent 225deg,
                rgba(56, 189, 248, 0.02) 230deg,
                transparent 235deg,
                transparent 250deg,
                rgba(147, 197, 253, 0.015) 255deg,
                transparent 260deg,
                transparent 270deg,
                rgba(56, 189, 248, 0.02) 275deg,
                transparent 280deg,
                transparent 295deg,
                rgba(79, 70, 229, 0.015) 300deg,
                transparent 305deg,
                transparent 320deg,
                rgba(56, 189, 248, 0.02) 325deg,
                transparent 330deg,
                transparent 340deg,
                rgba(147, 197, 253, 0.015) 345deg,
                transparent 350deg,
                transparent 360deg
              )
            `,
            animationDuration: isProcessing ? '30s' : '60s',
          }}
        />
      </div>

      {/* Radial mask to soften the center */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 5%, rgba(0, 0, 0, 0.3) 30%, rgba(0, 0, 0, 0.8) 55%)',
        }}
      />

      <style jsx>{`
        .god-rays-rotate {
          animation: raysRotate var(--ray-duration, 60s) linear infinite;
        }
        @keyframes raysRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});
