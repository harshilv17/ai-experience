// components/ProjectionDisplay.tsx — Fullscreen 5-phase immersive projection display
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import WaterSpiritCanvas from './WaterSpiritCanvas';
import FloatingKeywords from './FloatingKeywords';
import EmotionOverlay from './EmotionOverlay';

export default function ProjectionDisplay() {
  const currentImagePath = useAppStore((s) => s.currentImagePath);
  const pipelinePhase = useAppStore((s) => s.pipelinePhase);
  const floatingKeywords = useAppStore((s) => s.floatingKeywords);

  // Two image layers for crossfade
  const layerARef = useRef<HTMLImageElement>(null);
  const layerBRef = useRef<HTMLImageElement>(null);
  const activeLayerRef = useRef<'A' | 'B'>('A');
  const prevImageRef = useRef<string | null>(null);

  const crossfadeTo = useCallback((newSrc: string) => {
    const layerA = layerARef.current;
    const layerB = layerBRef.current;
    if (!layerA || !layerB) return;

    if (activeLayerRef.current === 'A') {
      layerB.onload = () => {
        layerB.style.opacity = '1';
        layerA.style.opacity = '0';
        setTimeout(() => { activeLayerRef.current = 'B'; }, 1200);
      };
      layerB.src = newSrc;
    } else {
      layerA.onload = () => {
        layerA.style.opacity = '1';
        layerB.style.opacity = '0';
        setTimeout(() => { activeLayerRef.current = 'A'; }, 1200);
      };
      layerA.src = newSrc;
    }
  }, []);

  useEffect(() => {
    if (currentImagePath && currentImagePath !== prevImageRef.current) {
      prevImageRef.current = currentImagePath;
      crossfadeTo(currentImagePath);
    }
  }, [currentImagePath, crossfadeTo]);

  // Determine if image layers should be visible
  const showImage = pipelinePhase === 'revealing' || pipelinePhase === 'displaying';

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* ─── WATER SPIRIT ANIMATION LAYER ─────────────────────── */}
      <WaterSpiritCanvas phase={pipelinePhase} />

      {/* ─── FLOATING KEYWORDS (Mentimeter-style) ─────────────── */}
      <FloatingKeywords
        words={floatingKeywords}
        gathering={pipelinePhase === 'revealing'}
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
        className="fixed inset-0 pointer-events-none transition-opacity duration-2000"
        style={{
          zIndex: 9,
          opacity: pipelinePhase === 'revealing' ? 0.6 : 0,
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
