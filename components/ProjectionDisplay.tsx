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
import ParticleField from './ParticleField';
import ConstellationBg from './ConstellationBg';
import CinematicFrame from './CinematicFrame';
import GodRays from './GodRays';
import DataStreams from './DataStreams';
import PulseRings from './PulseRings';
import AudioCues from './AudioCues';

export default function ProjectionDisplay() {
  const currentImagePath = useAppStore((s) => s.currentImagePath);
  const currentVideoPath = useAppStore((s) => s.currentVideoPath);
  const pipelinePhase = useAppStore((s) => s.pipelinePhase);
  const floatingKeywords = useAppStore((s) => s.floatingKeywords);
  const consecutiveSameEmotion = useAppStore((s) => s.consecutiveSameEmotion);
  const currentEmotion = useAppStore((s) => s.currentEmotion);
  const allTranscriptWords = useAppStore((s) => s.allTranscriptWords);

  const layerARef = useRef<HTMLImageElement>(null);
  const layerBRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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

  useEffect(() => {
    if (!currentImagePath && prevImageRef.current) {
      fadeOutImages();
    }
  }, [currentImagePath, fadeOutImages]);

  const showImage = (pipelinePhase === 'revealing' || pipelinePhase === 'displaying') && !!currentImagePath && !currentVideoPath;
  const showVideo = (pipelinePhase === 'revealing' || pipelinePhase === 'displaying') && !!currentVideoPath;
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
      {/* ─── AURORA ANIMATED BACKGROUND ─────────────────────────── */}
      <div
        className="fixed inset-0 transition-opacity duration-[3000ms]"
        style={{
          zIndex: 0,
          opacity: isIdle || isProcessing ? 1 : 0.3,
        }}
      >
        {/* Aurora layer 1 — deep saffron + indigo sweep */}
        <div
          className="absolute inset-0 aurora-layer-1"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 80%, rgba(255, 153, 51, 0.04) 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 75% 25%, rgba(56, 189, 248, 0.04) 0%, transparent 50%),
              radial-gradient(ellipse 50% 50% at 50% 90%, rgba(196, 30, 58, 0.02) 0%, transparent 40%)
            `,
          }}
        />
        {/* Aurora layer 2 — teal + gold drift */}
        <div
          className="absolute inset-0 aurora-layer-2"
          style={{
            background: `
              radial-gradient(ellipse 70% 60% at 60% 70%, rgba(218, 165, 32, 0.03) 0%, transparent 50%),
              radial-gradient(ellipse 50% 30% at 30% 40%, rgba(20, 184, 166, 0.03) 0%, transparent 50%)
            `,
          }}
        />
        {/* Aurora layer 3 — emotion-tinted */}
        <div
          className="absolute inset-0 aurora-layer-3"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, ${emotionAccent} 0%, transparent 60%)`,
          }}
        />
      </div>

      {/* ─── HEXAGONAL GRID PATTERN ─────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none hex-grid-pulse"
        style={{
          zIndex: 1,
          opacity: isIdle ? 0.04 : isProcessing ? 0.02 : 0,
          transition: 'opacity 2s ease',
        }}
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexGrid" width="56" height="48.5" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
              <path
                d="M28,0 L56,14 L56,34.5 L28,48.5 L0,34.5 L0,14 Z"
                fill="none"
                stroke="rgba(56, 189, 248, 0.3)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexGrid)" />
        </svg>
      </div>

      {/* ─── SCANNING LINE ──────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-[2000ms]"
        style={{
          zIndex: 3,
          opacity: isIdle || isProcessing ? 1 : 0,
        }}
      >
        <div
          className={`absolute left-0 right-0 h-[1px] ${
            isProcessing ? 'scan-line-fast' : 'scan-line-slow'
          }`}
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.15) 20%, rgba(56, 189, 248, 0.3) 50%, rgba(56, 189, 248, 0.15) 80%, transparent 100%)',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.2), 0 0 30px rgba(56, 189, 248, 0.1)',
          }}
        />
      </div>

      {/* ─── CONSTELLATION BACKGROUND ─────────────────────────── */}
      <ConstellationBg phase={pipelinePhase} />

      {/* ─── DATA STREAMS ──────────────────────────────────────── */}
      <DataStreams phase={pipelinePhase} />

      {/* ─── PARTICLE FIELD ─────────────────────────────────────── */}
      <ParticleField phase={pipelinePhase} />

      {/* ─── GOD RAYS ──────────────────────────────────────────── */}
      <GodRays phase={pipelinePhase} />

      {/* ─── PULSE RINGS ───────────────────────────────────────── */}
      <PulseRings phase={pipelinePhase} />

      {/* ─── IDENTITY HEADER — THE BLUE RESONANCE ─────────────── */}
      <div
        className="fixed top-0 left-0 right-0 z-[15] flex flex-col items-center pt-3 pb-2 pointer-events-none transition-opacity duration-1000"
        style={{ opacity: pipelinePhase === 'displaying' ? 0 : 1 }}
      >
        <h1
          className="text-[clamp(1.2rem,2.8vw,2.2rem)] font-bold tracking-[0.25em] uppercase select-none identity-title-glow"
          style={{
            color: '#38BDF8',
            textShadow: '0 0 30px rgba(56,189,248,0.5), 0 0 60px rgba(56,189,248,0.25), 0 0 100px rgba(56,189,248,0.1)',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            letterSpacing: '0.25em',
          }}
        >
          THE BLUE RESONANCE
        </h1>
        <div className="mt-1 flex items-center gap-3">
          {/* Phase animated indicator — inline */}
          {pipelinePhase === 'listening' ? (
            <div className="flex items-center gap-[2px] h-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-[2px] bg-sky-400/60 rounded-full waveform-bar"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          ) : pipelinePhase === 'processing' ? (
            <div className="w-3 h-3 rounded-full border border-sky-800 border-t-sky-400 spinner-ring" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500/40 breathing-dot" />
          )}
          <p
            className="text-[clamp(1rem,1.9vw,1.35rem)] tracking-[0.2em] select-none identity-subtitle-breathe"
            style={{
              color: 'rgba(56,189,248,0.7)',
              textShadow: '0 0 20px rgba(56,189,248,0.35)',
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              fontWeight: 300,
            }}
          >
            {pipelinePhase === 'listening' ? 'Neer is listening…' :
             pipelinePhase === 'processing' ? 'Neer is analyzing…' :
             'Neer is listening…'}
          </p>
        </div>
      </div>

      {/* ─── ROBOT MASCOT & COMPONENTS ────────────────────────── */}
      <RobotMascot phase={pipelinePhase} consecutiveSameEmotion={consecutiveSameEmotion} />
      <ResonanceMeter />
      <EmotionRibbon />
      <PoeticLine />
      <AIThinkingTicker />
      <AudioCues />

      {/* ─── CINEMATIC FRAME (HUD overlay) ─────────────────────── */}
      <CinematicFrame phase={pipelinePhase} />

      {/* ─── FLOATING KEYWORDS ────────────────────────────────── */}
      <FloatingKeywords
        words={floatingKeywords}
        allWords={allTranscriptWords}
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

      {/* ─── VIDEO LAYER ───────────────────────────────────────── */}
      {currentVideoPath && (
        <video
          ref={videoRef}
          src={currentVideoPath}
          autoPlay
          loop
          muted={false}
          playsInline
          className="fixed inset-0 w-full h-full object-cover"
          style={{
            opacity: showVideo ? 1 : 0,
            transition: 'opacity 1500ms ease-in-out',
            zIndex: showVideo ? 8 : 0,
          }}
          onError={(e) => console.error('[ProjectionDisplay] Video playback error:', e)}
        />
      )}

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

      {/* ─── BOTTOM TAGLINE ─────────────────────────────────── */}
      <div
        className="fixed bottom-6 left-0 right-0 z-[13] flex justify-center pointer-events-none transition-opacity duration-1000"
        style={{ opacity: pipelinePhase === 'displaying' ? 0 : 0.6 }}
      >
        <p
          className="text-[clamp(0.8rem,1.5vw,1.05rem)] tracking-[0.22em] select-none"
          style={{
            color: 'rgba(186, 230, 253, 0.7)',
            textShadow: '0 0 15px rgba(56,189,248,0.2)',
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            fontWeight: 300,
            fontStyle: 'italic',
          }}
        >
          Your voices shape what comes next
        </p>
      </div>

      {/* ─── FILM GRAIN / NOISE OVERLAY ────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none film-grain"
        style={{
          zIndex: 12,
          opacity: 0.035,
          mixBlendMode: 'overlay',
        }}
      />

      {/* ─── CSS KEYFRAMES ────────────────────────────────────── */}
      <style jsx>{`
        /* ── Aurora animations ── */
        .aurora-layer-1 {
          animation: auroraDrift1 25s ease-in-out infinite;
        }
        @keyframes auroraDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          33% { transform: translate(40px, -20px) scale(1.1) rotate(1deg); }
          66% { transform: translate(-30px, 15px) scale(1.05) rotate(-1deg); }
        }

        .aurora-layer-2 {
          animation: auroraDrift2 30s ease-in-out infinite reverse;
        }
        @keyframes auroraDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          33% { transform: translate(-50px, 25px) scale(1.15) rotate(-2deg); }
          66% { transform: translate(35px, -30px) scale(1.05) rotate(1.5deg); }
        }

        .aurora-layer-3 {
          animation: auroraPulse 8s ease-in-out infinite;
        }
        @keyframes auroraPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        /* ── Hex grid pulse ── */
        .hex-grid-pulse {
          animation: hexPulse 6s ease-in-out infinite;
        }
        @keyframes hexPulse {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.06; }
        }

        /* ── Scanning line ── */
        .scan-line-slow {
          animation: scanVertical 12s ease-in-out infinite;
        }
        .scan-line-fast {
          animation: scanVertical 6s ease-in-out infinite;
        }
        @keyframes scanVertical {
          0% { top: -2px; }
          50% { top: 100%; }
          100% { top: -2px; }
        }

        /* ── Phase indicator animations ── */
        .waveform-bar {
          animation: waveformPulse 0.8s ease-in-out infinite alternate;
          height: 6px;
        }
        @keyframes waveformPulse {
          0% { height: 4px; opacity: 0.4; }
          100% { height: 16px; opacity: 1; }
        }

        .spinner-ring {
          animation: spinRing 1s linear infinite;
        }
        @keyframes spinRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .breathing-dot {
          animation: breatheDot 3s ease-in-out infinite;
        }
        @keyframes breatheDot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); box-shadow: 0 0 4px rgba(56, 189, 248, 0.2); }
          50% { opacity: 0.8; transform: scale(1.2); box-shadow: 0 0 12px rgba(56, 189, 248, 0.5); }
        }

        /* ── Film grain noise ── */
        .film-grain {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 128px 128px;
          animation: grainShift 0.5s steps(8) infinite;
        }
        @keyframes grainShift {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-2px, 3px); }
          50% { transform: translate(3px, -1px); }
          75% { transform: translate(-1px, -2px); }
          100% { transform: translate(2px, 1px); }
        }

        /* ── Identity header animations ── */
        .identity-title-glow {
          animation: titleGlow 4s ease-in-out infinite;
        }
        @keyframes titleGlow {
          0%, 100% { text-shadow: 0 0 30px rgba(56,189,248,0.5), 0 0 60px rgba(56,189,248,0.25); }
          50% { text-shadow: 0 0 40px rgba(56,189,248,0.7), 0 0 80px rgba(56,189,248,0.35), 0 0 120px rgba(56,189,248,0.15); }
        }
        .identity-subtitle-breathe {
          animation: subtitleBreathe 5s ease-in-out infinite;
        }
        @keyframes subtitleBreathe {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
