// components/ProjectionDisplay.tsx — Fullscreen 5-phase immersive projection display
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { useDisplayTimer } from '@/hooks/useDisplayTimer';
import RobotMascot from './RobotMascot';
import FloatingKeywords from './FloatingKeywords';
import PromptPreview from './PromptPreview';
import EmotionOverlay from './EmotionOverlay';
import ResonanceMeter from './ResonanceMeter';
import EmotionRibbon from './EmotionRibbon';
import PoeticLine from './PoeticLine';
import AIThinkingTicker from './AIThinkingTicker';

export default function ProjectionDisplay() {
  useDisplayTimer(); // Transition displaying → showing_prompt after min image display time

  const currentImagePath = useAppStore((s) => s.currentImagePath);
  const pipelinePhase = useAppStore((s) => s.pipelinePhase);
  const floatingKeywords = useAppStore((s) => s.floatingKeywords);
  const consecutiveSameEmotion = useAppStore((s) => s.consecutiveSameEmotion);

  // Two image layers for crossfade
  const layerARef = useRef<HTMLImageElement>(null);
  const layerBRef = useRef<HTMLImageElement>(null);
  const activeLayerRef = useRef<'A' | 'B'>('A');
  const prevImageRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (currentImagePath && currentImagePath !== prevImageRef.current) {
      prevImageRef.current = currentImagePath;
      // V2 Escalation: Slow transition from 1200ms to 2500ms
      const duration = consecutiveSameEmotion >= 3 ? 2500 : 1200;
      crossfadeTo(currentImagePath, duration);
    }
  }, [currentImagePath, crossfadeTo, consecutiveSameEmotion]);

  // Determine if image layers should be visible (also show dimmed during showing_prompt)
  const showImage = pipelinePhase === 'revealing' || pipelinePhase === 'displaying' || pipelinePhase === 'showing_prompt';

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* ─── V2: ROBOT MASCOT & NEW COMPONENTS ────────────────── */}
      <RobotMascot phase={pipelinePhase} consecutiveSameEmotion={consecutiveSameEmotion} />
      <ResonanceMeter />
      <EmotionRibbon />
      <PoeticLine />
      <AIThinkingTicker />

      {/* ─── FLOATING KEYWORDS (during showing_prompt phase) ─── */}
      <FloatingKeywords
        words={floatingKeywords}
        gathering={false}
        phase={pipelinePhase}
      />

      {/* ─── PROMPT PREVIEW (DALL-E prompt during showing_prompt) ─ */}
      <PromptPreview phase={pipelinePhase} />

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
          filter: pipelinePhase === 'showing_prompt' ? 'brightness(0.25)' : 'none',
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
          filter: pipelinePhase === 'showing_prompt' ? 'brightness(0.25)' : 'none',
        }}
      />

      {/* ─── REVEAL MIST OVERLAY (during transition) ──────────── */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-2000"
        style={{
          zIndex: 9,
          opacity: pipelinePhase === 'revealing'
            ? (consecutiveSameEmotion >= 3 ? 0.85 : 0.6)
            : pipelinePhase === 'showing_prompt'
              ? 0.5
              : 0,
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
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
}
