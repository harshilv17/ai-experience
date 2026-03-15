// components/ProjectionDisplay.tsx — Fullscreen immersive projection display with phased pipeline
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import RobotMascot from './RobotMascot';
import FloatingKeywords from './FloatingKeywords';
import EmotionOverlay from './EmotionOverlay';
import ResonanceMeter from './ResonanceMeter';
import EmotionRibbon from './EmotionRibbon';
import PoeticLine from './PoeticLine';
import AIThinkingTicker from './AIThinkingTicker';

export default function ProjectionDisplay() {
  const currentImagePath = useAppStore((s) => s.currentImagePath);
  const pipelinePhase = useAppStore((s) => s.pipelinePhase);
  const floatingKeywords = useAppStore((s) => s.floatingKeywords);
  const consecutiveSameEmotion = useAppStore((s) => s.consecutiveSameEmotion);
  const currentEmotion = useAppStore((s) => s.currentEmotion);

  const layerARef = useRef<HTMLImageElement>(null);
  const layerBRef = useRef<HTMLImageElement>(null);
  const activeLayerRef = useRef<'A' | 'B'>('A');
  const prevImageRef = useRef<string | null>(null);
  const prevPhaseRef = useRef<string>(pipelinePhase);

  const crossfadeTo = useCallback((newSrc: string, durationMs: number = 1200) => {
    const layerA = layerARef.current;
    const layerB = layerBRef.current;
    if (!layerA || !layerB) return;

    if (activeLayerRef.current === 'A') {
      layerB.onload = () => {
        layerB.style.transition = `opacity ${durationMs}ms ease-in-out`;
        layerA.style.transition = `opacity ${durationMs}ms ease-in-out`;
        layerB.style.opacity = '1';
        layerA.style.opacity = '0';
        setTimeout(() => { activeLayerRef.current = 'B'; }, durationMs);
      };
      layerB.src = newSrc;
    } else {
      layerA.onload = () => {
        layerA.style.transition = `opacity ${durationMs}ms ease-in-out`;
        layerB.style.transition = `opacity ${durationMs}ms ease-in-out`;
        layerA.style.opacity = '1';
        layerB.style.opacity = '0';
        setTimeout(() => { activeLayerRef.current = 'A'; }, durationMs);
      };
      layerA.src = newSrc;
    }
  }, []);

  const fadeOutImages = useCallback(() => {
    const layerA = layerARef.current;
    const layerB = layerBRef.current;
    const fadeMs = 1500;
    if (layerA) {
      layerA.style.transition = `opacity ${fadeMs}ms ease-in-out`;
      layerA.style.opacity = '0';
    }
    if (layerB) {
      layerB.style.transition = `opacity ${fadeMs}ms ease-in-out`;
      layerB.style.opacity = '0';
    }
    prevImageRef.current = null;
  }, []);

  useEffect(() => {
    if (currentImagePath && currentImagePath !== prevImageRef.current) {
      prevImageRef.current = currentImagePath;
      const duration = consecutiveSameEmotion >= 3 ? 2500 : 1200;
      crossfadeTo(currentImagePath, duration);
    }
  }, [currentImagePath, crossfadeTo, consecutiveSameEmotion]);

  useEffect(() => {
    if (pipelinePhase === 'idle' && (prevPhaseRef.current === 'displaying' || prevPhaseRef.current === 'revealing')) {
      fadeOutImages();
    }
    prevPhaseRef.current = pipelinePhase;
  }, [pipelinePhase, fadeOutImages]);

  const showImage = pipelinePhase === 'revealing' || pipelinePhase === 'displaying';
  const isIdle = pipelinePhase === 'idle';
  const isProcessing = pipelinePhase === 'processing' || pipelinePhase === 'listening';

  const emotionAccent = currentEmotion
    ? ({
        Hope: 'rgba(253, 224, 71, 0.08)',
        Fear: 'rgba(129, 140, 248, 0.08)',
        Grief: 'rgba(56, 189, 248, 0.08)',
        Anger: 'rgba(251, 113, 133, 0.08)',
        Renewal: 'rgba(52, 211, 153, 0.08)',
      }[currentEmotion] ?? 'transparent')
    : 'transparent';

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* ─── AMBIENT BACKGROUND ───────────────────────────────── */}
      <div
        className="fixed inset-0 transition-opacity duration-[3000ms]"
        style={{
          zIndex: 0,
          opacity: isIdle || isProcessing ? 1 : 0,
          background: `
            radial-gradient(ellipse at 20% 80%, rgba(56, 189, 248, 0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(129, 140, 248, 0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, ${emotionAccent} 0%, transparent 60%)
          `,
        }}
      />

      {/* ─── SUBTLE GRID PATTERN (idle) ───────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-[2000ms]"
        style={{
          zIndex: 1,
          opacity: isIdle ? 0.03 : 0,
          backgroundImage: `
            linear-gradient(rgba(56, 189, 248, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ─── PHASE INDICATOR ──────────────────────────────────── */}
      <div
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[14] transition-all duration-700"
        style={{ opacity: isIdle || isProcessing ? 0.6 : 0 }}
      >
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-sky-500/10 bg-black/40 backdrop-blur-md">
          <div className={`w-2 h-2 rounded-full ${
            isProcessing ? 'bg-sky-400 animate-pulse' : 'bg-sky-800'
          }`} />
          <span className="text-[11px] tracking-[0.3em] uppercase text-sky-300/50 font-light">
            {pipelinePhase === 'listening' ? 'Listening' :
             pipelinePhase === 'processing' ? 'Analyzing' :
             'Awaiting Speech'}
          </span>
        </div>
      </div>

      {/* ─── ROBOT MASCOT & COMPONENTS ────────────────────────── */}
      <RobotMascot phase={pipelinePhase} consecutiveSameEmotion={consecutiveSameEmotion} />
      <ResonanceMeter />
      <EmotionRibbon />
      <PoeticLine />
      <AIThinkingTicker />

      {/* ─── FLOATING KEYWORDS ────────────────────────────────── */}
      <FloatingKeywords
        words={floatingKeywords}
        gathering={pipelinePhase === 'revealing'}
        phase={pipelinePhase}
      />

      {/* ─── IMAGE LAYER A ────────────────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={layerARef}
        alt=""
        className="fixed inset-0 w-full h-full object-cover"
        style={{
          opacity: 0,
          transition: 'opacity 1200ms ease-in-out',
          zIndex: showImage ? 6 : 0,
        }}
      />

      {/* ─── IMAGE LAYER B ────────────────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={layerBRef}
        alt=""
        className="fixed inset-0 w-full h-full object-cover"
        style={{
          opacity: 0,
          transition: 'opacity 1200ms ease-in-out',
          zIndex: showImage ? 7 : 0,
        }}
      />

      {/* ─── REVEAL MIST OVERLAY (during transition) ──────────── */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-[2000ms]"
        style={{
          zIndex: 9,
          opacity: pipelinePhase === 'revealing' ? (consecutiveSameEmotion >= 3 ? 0.85 : 0.6) : 0,
          background: 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.15) 0%, rgba(0, 0, 0, 0.5) 60%, rgba(0, 0, 0, 0.8) 100%)',
        }}
      />

      {/* ─── EMOTION OVERLAY ──────────────────────────────────── */}
      <div style={{ zIndex: 10, position: 'relative' }}>
        <EmotionOverlay />
      </div>

      {/* ─── EDGE VIGNETTE ────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 11,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* ─── BOTTOM GRADIENT (always present) ─────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          zIndex: 11,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
        }}
      />
    </div>
  );
}
