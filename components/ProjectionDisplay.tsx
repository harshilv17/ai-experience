// components/ProjectionDisplay.tsx — Fullscreen dual-layer crossfade image display
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import EmotionOverlay from './EmotionOverlay';

export default function ProjectionDisplay() {
  const currentImagePath = useAppStore((s) => s.currentImagePath);

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
      // Layer A is visible, load into B, then crossfade
      layerB.onload = () => {
        layerB.style.opacity = '1';
        layerA.style.opacity = '0';

        // After transition completes, swap references
        setTimeout(() => {
          activeLayerRef.current = 'B';
        }, 850);
      };
      layerB.src = newSrc;
    } else {
      // Layer B is visible, load into A, then crossfade
      layerA.onload = () => {
        layerA.style.opacity = '1';
        layerB.style.opacity = '0';

        setTimeout(() => {
          activeLayerRef.current = 'A';
        }, 850);
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

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Layer A */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={layerARef}
        alt=""
        className="fixed inset-0 w-full h-full object-cover"
        style={{
          opacity: 1,
          transition: 'opacity 800ms ease-in-out',
          zIndex: 1,
        }}
      />

      {/* Layer B */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={layerBRef}
        alt=""
        className="fixed inset-0 w-full h-full object-cover"
        style={{
          opacity: 0,
          transition: 'opacity 800ms ease-in-out',
          zIndex: 2,
        }}
      />

      {/* Emotion overlay — sits on top of both layers */}
      <div style={{ zIndex: 10, position: 'relative' }}>
        <EmotionOverlay />
      </div>

      {/* Subtle gradient overlay at edges for projection quality */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 3,
          background: 'radial-gradient(ellipse at center, transparent 70%, rgba(0,0,0,0.3) 100%)',
        }}
      />
    </div>
  );
}
