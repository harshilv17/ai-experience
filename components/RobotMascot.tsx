// components/RobotMascot.tsx — Himachali-themed AI Robot with traditional elements
'use client';

import { useMemo, useState, useEffect, useRef, memo } from 'react';
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

  const [eyeAnimIndex, setEyeAnimIndex] = useState(0);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const [showGreeting, setShowGreeting] = useState(false);
  const [eyeFlickerOpacity, setEyeFlickerOpacity] = useState(1);
  const [headTiltDeg, setHeadTiltDeg] = useState(0);
  const headTiltRef = useRef(0);

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

  const transcriptWords = useMemo(() => {
    if (!liveTranscript) return [];
    return liveTranscript.split(/\s+/).filter(w => w.length > 0);
  }, [liveTranscript]);

  useEffect(() => {
    if (state !== 'thinking' || transcriptWords.length === 0) {
      setVisibleWordCount(0);
      return;
    }
    setVisibleWordCount(0);
    const interval = setInterval(() => {
      setVisibleWordCount(prev => {
        if (prev >= transcriptWords.length) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 120);
    return () => clearInterval(interval);
  }, [state, transcriptWords]);

  useEffect(() => {
    if (state === 'thinking') {
      const interval = setInterval(() => { setEyeAnimIndex(Math.floor(Math.random() * 4)); }, 1000);
      return () => clearInterval(interval);
    } else { setEyeAnimIndex(0); }
  }, [state]);

  // ── Eye flicker during listening (subtle brightness variation) ──
  useEffect(() => {
    if (phase === 'listening' || state === 'idle') {
      const interval = setInterval(() => {
        setEyeFlickerOpacity(0.7 + Math.random() * 0.3);
      }, phase === 'listening' ? 400 : 1200);
      return () => { clearInterval(interval); setEyeFlickerOpacity(1); };
    }
    setEyeFlickerOpacity(1);
  }, [phase, state]);

  // ── Gentle head tilt during idle/listening ──
  useEffect(() => {
    if (state === 'idle' || phase === 'listening') {
      const interval = setInterval(() => {
        const target = -2 + Math.random() * 4; // -2 to +2 degrees
        // Smooth interpolation
        headTiltRef.current = headTiltRef.current + (target - headTiltRef.current) * 0.3;
        setHeadTiltDeg(headTiltRef.current);
      }, phase === 'listening' ? 800 : 1500);
      return () => { clearInterval(interval); setHeadTiltDeg(0); };
    }
    setHeadTiltDeg(0);
  }, [state, phase]);

  const eyeTransform = useMemo(() => {
    switch(eyeAnimIndex) {
      case 1: return 'scale(1.4, 0.4)';
      case 2: return 'scale(0.4, 1.4)';
      case 3: return 'scale(0.3, 0.3)';
      default: return 'scale(1, 1)';
    }
  }, [eyeAnimIndex]);

  const isEscalated2 = consecutiveSameEmotion === 2;
  const isEscalated3 = consecutiveSameEmotion >= 3;
  const baseTranslateY = state === 'idle' ? '-8px' : isEscalated2 ? '-14px' : '-10px';
  const animDuration = state === 'idle' ? '4s' : isEscalated3 ? '2s' : '2.5s';
  const cloudScale = isEscalated3 ? 1.3 : isEscalated2 ? 1.15 : 1;

  const wordHistory = useMemo(() => {
    const history = new Set<string>();
    sessionKeywords.forEach((w) => history.add(w.toLowerCase()));
    return history;
  }, [sessionKeywords]);

  const isStillTyping = visibleWordCount < transcriptWords.length;

  // Greeting bubble — show 5s after mount, auto-hide after 6s
  useEffect(() => {
    const showTimer = setTimeout(() => setShowGreeting(true), 5000);
    const hideTimer = setTimeout(() => setShowGreeting(false), 11000);
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer); };
  }, []);

  if (state === 'hidden') return null;

  return (
    <div className="fixed inset-0 z-[5] flex items-center justify-center pointer-events-none">

      {/* ─── BREATHING GLOW AURA (enhanced — reacts to listening) ── */}
      <div
        className={`absolute rounded-full transition-all duration-700 ${
          phase === 'listening' ? 'opacity-60 neer-listening-glow' :
          state === 'thinking' ? 'opacity-50 breathing-glow' :
          state === 'revealing' ? 'opacity-70 breathing-glow' :
          'opacity-25 breathing-glow'
        }`}
        style={{
          width: phase === 'listening' ? '550px' : '500px',
          height: phase === 'listening' ? '550px' : '500px',
          background: phase === 'listening'
            ? 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(56, 189, 248, 0.08) 30%, rgba(79, 70, 229, 0.04) 55%, transparent 75%)'
            : 'radial-gradient(circle, rgba(255, 153, 51, 0.08) 0%, rgba(56, 189, 248, 0.1) 30%, rgba(79, 70, 229, 0.04) 55%, transparent 75%)',
          filter: 'blur(25px)',
        }}
      />

      {/* ─── HOLOGRAPHIC ORBITAL RINGS ────────────────────────── */}
      <div className="absolute" style={{ width: '520px', height: '520px' }}>
        <div className={`absolute inset-0 orbital-ring-1 transition-opacity duration-1000 ${
          state === 'revealing' ? 'opacity-70' : state === 'thinking' ? 'opacity-40' : 'opacity-20'
        }`} style={{ border: '1px solid rgba(255, 153, 51, 0.15)', borderRadius: '50%', transform: 'rotateX(70deg) rotateZ(0deg)' }} />
        <div className={`absolute inset-4 orbital-ring-2 transition-opacity duration-1000 ${
          state === 'revealing' ? 'opacity-60' : state === 'thinking' ? 'opacity-35' : 'opacity-15'
        }`} style={{ border: '1px solid rgba(56, 189, 248, 0.12)', borderRadius: '50%', transform: 'rotateX(75deg) rotateZ(45deg)' }} />
        <div className={`absolute inset-10 orbital-ring-3 transition-opacity duration-1000 ${
          state === 'thinking' ? 'opacity-30' : 'opacity-10'
        }`} style={{ border: '1px solid rgba(52, 211, 153, 0.1)', borderRadius: '50%', transform: 'rotateX(65deg) rotateZ(-20deg)' }} />
      </div>

      {/* ─── THE HIMACHALI ROBOT ───────────────────────────────── */}
      <div
        className={`relative transition-all duration-1000 ${
          state === 'revealing' ? 'scale-125 opacity-0' : 'scale-[1.15] opacity-100'
        }`}
        style={{ animation: state !== 'revealing' ? `robotBob ${animDuration} ease-in-out infinite` : 'none' }}
      >
        <svg width="420" height="560" viewBox="0 0 420 560" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Himachali color palette */}
            <linearGradient id="body-warm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FAF5EE" />
              <stop offset="100%" stopColor="#E8DDD0" />
            </linearGradient>
            <linearGradient id="pattu-red" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#C41E3A" />
              <stop offset="50%" stopColor="#A31530" />
              <stop offset="100%" stopColor="#8B0A25" />
            </linearGradient>
            <linearGradient id="pattu-border" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#DAA520" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
            <linearGradient id="topi-main" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B6914" />
              <stop offset="100%" stopColor="#6B4226" />
            </linearGradient>
            <linearGradient id="topi-band" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#C5832B" />
              <stop offset="15%" stopColor="#E8A838" />
              <stop offset="30%" stopColor="#C5832B" />
              <stop offset="45%" stopColor="#E8A838" />
              <stop offset="60%" stopColor="#C5832B" />
              <stop offset="75%" stopColor="#E8A838" />
              <stop offset="100%" stopColor="#C5832B" />
            </linearGradient>
            <linearGradient id="screen-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1025" />
              <stop offset="100%" stopColor="#0a0810" />
            </linearGradient>
            <linearGradient id="led-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FF9933" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FF9933" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="hover-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
              <stop offset="40%" stopColor="#DAA520" stopOpacity="0.15" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>

            <filter id="shadow-lg"><feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000" floodOpacity="0.4" /></filter>
            <filter id="shadow-sm"><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.3" /></filter>
            <filter id="glow-eye">
              <feGaussianBlur stdDeviation={isEscalated3 ? "8" : "5"} result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="warm-glow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>

            {/* Himachali pattern for body band */}
            <pattern id="himachali-pattern" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse">
              <rect width="20" height="10" fill="#C41E3A" />
              <path d="M0,5 L5,0 L10,5 L5,10 Z" fill="#FFD700" opacity="0.6" />
              <path d="M10,5 L15,0 L20,5 L15,10 Z" fill="#FFD700" opacity="0.6" />
              <line x1="0" y1="0" x2="20" y2="0" stroke="#DAA520" strokeWidth="0.5" />
              <line x1="0" y1="10" x2="20" y2="10" stroke="#DAA520" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* ── FLOATING PLATFORM / HOVER BASE ── */}
          {/* Shadow on "ground" — soft ellipse */}
          <ellipse cx="210" cy="540" rx="100" ry="12" fill="rgba(0,0,0,0.3)" />
          <ellipse cx="210" cy="540" rx="70" ry="8" fill="rgba(0,0,0,0.15)" />

          {/* Light cone from body bottom — the "hover glow" */}
          <path d="M 180 460 L 140 530 Q 210 545 280 530 L 240 460 Z"
            fill="url(#hover-glow)" opacity="0.25" />

          {/* Hover ring — glowing ellipse */}
          <ellipse cx="210" cy="530" rx="85" ry="10"
            fill="none" stroke="#DAA520" strokeWidth="1.5" opacity="0.25"
            className="hover-ring-pulse" />
          <ellipse cx="210" cy="530" rx="65" ry="8"
            fill="none" stroke="#38BDF8" strokeWidth="1" opacity="0.15"
            className="hover-ring-pulse-inner" />

          {/* Small energy dots on the ring */}
          <circle cx="145" cy="528" r="2" fill="#DAA520" opacity="0.3" className="hover-dot" />
          <circle cx="275" cy="528" r="2" fill="#DAA520" opacity="0.3" className="hover-dot" style={{animationDelay: '1s'}} />
          <circle cx="210" cy="536" r="1.5" fill="#38BDF8" opacity="0.2" className="hover-dot" style={{animationDelay: '0.5s'}} />

          {/* Rounded body bottom cap — smooth transition from body */}
          <ellipse cx="210" cy="453" rx="80" ry="14" fill="url(#body-warm)" />
          <ellipse cx="210" cy="453" rx="80" ry="14" fill="none" stroke="#E8DDD0" strokeWidth="1" opacity="0.4" />

          {/* ── ARMS (with traditional bangles) ── */}
          <rect x="35" y="230" width="55" height="140" rx="28" fill="url(#body-warm)" filter="url(#shadow-lg)" />
          <rect x="330" y="230" width="55" height="140" rx="28" fill="url(#body-warm)" filter="url(#shadow-lg)" />
          {/* Bangle decorations */}
          <ellipse cx="62" cy="340" rx="22" ry="6" fill="none" stroke="#DAA520" strokeWidth="2.5" opacity="0.7" />
          <ellipse cx="62" cy="350" rx="20" ry="5" fill="none" stroke="#C41E3A" strokeWidth="2" opacity="0.5" />
          <ellipse cx="358" cy="340" rx="22" ry="6" fill="none" stroke="#DAA520" strokeWidth="2.5" opacity="0.7" />
          <ellipse cx="358" cy="350" rx="20" ry="5" fill="none" stroke="#C41E3A" strokeWidth="2" opacity="0.5" />

          {/* ── BODY ── */}
          <rect x="75" y="175" width="270" height="280" rx="95" fill="url(#body-warm)" filter="url(#shadow-lg)" />

          {/* Pattu / Shawl draped across body */}
          <path d="M 90 200 Q 100 190 120 195 L 120 390 Q 100 380 90 370 Z" fill="url(#pattu-red)" opacity="0.85" />
          <path d="M 330 200 Q 320 190 300 195 L 300 390 Q 320 380 330 370 Z" fill="url(#pattu-red)" opacity="0.85" />
          {/* Pattu golden borders */}
          <line x1="120" y1="195" x2="120" y2="390" stroke="#DAA520" strokeWidth="2.5" opacity="0.7" />
          <line x1="300" y1="195" x2="300" y2="390" stroke="#DAA520" strokeWidth="2.5" opacity="0.7" />
          <line x1="93" y1="205" x2="93" y2="365" stroke="#DAA520" strokeWidth="1.5" opacity="0.5" />
          <line x1="327" y1="205" x2="327" y2="365" stroke="#DAA520" strokeWidth="1.5" opacity="0.5" />

          {/* Himachali pattern band across chest */}
          <rect x="130" y="285" width="160" height="16" rx="3" fill="url(#himachali-pattern)" opacity="0.7" />
          <rect x="130" y="283" width="160" height="2" fill="#DAA520" opacity="0.8" />
          <rect x="130" y="301" width="160" height="2" fill="#DAA520" opacity="0.8" />

          {/* Body centerpiece — mandala-inspired */}
          <circle cx="210" cy="250" r="18" fill="none" stroke="#DAA520" strokeWidth="1.5" opacity="0.5" />
          <circle cx="210" cy="250" r="12" fill="none" stroke="#C41E3A" strokeWidth="1" opacity="0.4" />
          <circle cx="210" cy="250" r="6" fill="#FF9933" opacity="0.4" filter="url(#warm-glow)" />
          {/* Tiny mandala dots */}
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <circle key={angle} cx={210 + Math.cos(rad) * 15} cy={250 + Math.sin(rad) * 15} r="1.5" fill="#DAA520" opacity="0.6" />
            );
          })}

          {/* Lower body accent */}
          <circle cx="210" cy="340" r="10" fill="none" stroke="#E8DDD0" strokeWidth="1.5" opacity="0.5" />
          <circle cx="210" cy="340" r="4" fill="#38BDF8" opacity="0.3" />

          {/* ── HEAD (with reactive tilt) ── */}
          <g style={{ transform: `rotate(${headTiltDeg}deg)`, transformOrigin: '210px 135px', transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <rect x="100" y="50" width="220" height="170" rx="60" fill="url(#body-warm)" filter="url(#shadow-lg)" />

          {/* Face Screen */}
          <rect x="120" y="78" width="180" height="115" rx="35" fill="url(#screen-grad)" />

          {/* Face screen inner border glow */}
          <rect x="120" y="78" width="180" height="115" rx="35" fill="none" stroke="rgba(255, 153, 51, 0.1)" strokeWidth="1" />

          {/* LED Strip below face */}
          <rect x="150" y="193" width="120" height="3" rx="1.5" className="led-strip-anim" fill="url(#led-gradient)" style={{ opacity: state === 'thinking' ? 0.9 : phase === 'listening' ? 0.7 : 0.4 }} />

          {/* Eyes (with flicker opacity during listening) */}
          <g className={`${state === 'idle' ? 'animate-blink' : ''} ${state === 'revealing' ? 'animate-flash' : ''}`}
             style={{ transformOrigin: '210px 132px', transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', opacity: eyeFlickerOpacity }}>
            <g style={{ transform: eyeTransform, transformOrigin: '210px 132px', transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <rect x="150" y="102" width="38" height="48" rx="12"
                fill={state === 'revealing' ? '#FFF' : '#38BDF8'}
                filter={state === 'revealing' ? 'none' : 'url(#glow-eye)'} />
              <rect x="232" y="102" width="38" height="48" rx="12"
                fill={state === 'revealing' ? '#FFF' : '#38BDF8'}
                filter={state === 'revealing' ? 'none' : 'url(#glow-eye)'} />
            </g>
          </g>

          {/* Small smile line */}
          <path d="M 190 163 Q 210 172 230 163" fill="none" stroke="#38BDF8" strokeWidth="2" opacity="0.25" strokeLinecap="round" />

          {/* ── AUTHENTIC HIMACHALI TOPI ── */}
          <g transform="translate(100, -3)" className={isEscalated3 ? 'animate-wobble' : ''} style={{ transformOrigin: '110px 40px' }}>
            {/* Topi top — cream/off-white dome */}
            <path d="M 20 14 L 200 14 L 210 8 L 10 8 Z" fill="#F5F0E6" filter="url(#shadow-sm)" />
            <path d="M 25 14 L 195 14 L 188 5 L 32 5 Z" fill="#EDE8DA" />
            {/* Slight fold line on cream top */}
            <line x1="60" y1="10" x2="160" y2="10" stroke="#D4CFC0" strokeWidth="0.5" opacity="0.5" />

            {/* ── CRIMSON BAND (main embroidery area) ── */}
            <rect x="8" y="14" width="204" height="44" fill="#C41E3A" />
            {/* Subtle curve at bottom of band */}
            <path d="M 5 58 L 8 14 L 212 14 L 215 58 Q 110 62 5 58 Z" fill="#C41E3A" filter="url(#shadow-sm)" />

            {/* ── TOP FRAMING STRIPES (white, gold, black, gold) ── */}
            <line x1="8" y1="14" x2="212" y2="14" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="8" y1="16.5" x2="212" y2="16.5" stroke="#DAA520" strokeWidth="1.5" />
            <line x1="8" y1="18.5" x2="212" y2="18.5" stroke="#1a1a1a" strokeWidth="1.5" />
            <line x1="8" y1="20" x2="212" y2="20" stroke="#DAA520" strokeWidth="1" />

            {/* ── BOTTOM FRAMING STRIPES (gold, black, gold, white) ── */}
            <line x1="5" y1="52" x2="215" y2="52" stroke="#DAA520" strokeWidth="1" />
            <line x1="5" y1="53.5" x2="215" y2="53.5" stroke="#1a1a1a" strokeWidth="1.5" />
            <line x1="5" y1="55.5" x2="215" y2="55.5" stroke="#DAA520" strokeWidth="1.5" />
            <line x1="5" y1="57.5" x2="215" y2="57.5" stroke="#FFFFFF" strokeWidth="2" />

            {/* ── LEFT DIAMOND MOTIF (at x~55) ── */}
            <g transform="translate(55, 36)">
              {/* Outer green diamond */}
              <polygon points="0,-15 18,0 0,15 -18,0" fill="#1B7340" />
              {/* Orange/salmon fill diamond */}
              <polygon points="0,-12 14,0 0,12 -14,0" fill="#F47B20" />
              {/* Second green ring */}
              <polygon points="0,-9 10,0 0,9 -10,0" fill="#1B7340" />
              {/* Orange inner */}
              <polygon points="0,-7 8,0 0,7 -8,0" fill="#F58B4C" />
              {/* Black diamond */}
              <polygon points="0,-5 5.5,0 0,5 -5.5,0" fill="#1a1a1a" />
              {/* White diamond */}
              <polygon points="0,-3.5 4,0 0,3.5 -4,0" fill="#FFFFFF" />
              {/* Black inner */}
              <polygon points="0,-2 2.5,0 0,2 -2.5,0" fill="#1a1a1a" />
              {/* Pink center dot */}
              <circle cx="0" cy="0" r="1.2" fill="#E91E8C" />
            </g>
            {/* Flanking gold squares & green accents — left diamond */}
            <rect x="30" y="30" width="3" height="3" fill="#DAA520" transform="rotate(45, 31.5, 31.5)" />
            <rect x="30" y="38" width="3" height="3" fill="#DAA520" transform="rotate(45, 31.5, 39.5)" />
            <rect x="76" y="30" width="3" height="3" fill="#DAA520" transform="rotate(45, 77.5, 31.5)" />
            <rect x="76" y="38" width="3" height="3" fill="#DAA520" transform="rotate(45, 77.5, 39.5)" />
            <rect x="33" y="34" width="2" height="2" fill="#32CD32" transform="rotate(45, 34, 35)" />
            <rect x="73" y="34" width="2" height="2" fill="#32CD32" transform="rotate(45, 74, 35)" />

            {/* ── CENTER STAR/DIAMOND MOTIF (at x~110) ── */}
            <g transform="translate(110, 36)">
              {/* Star burst — cross diamonds */}
              <polygon points="0,-14 4,-4 14,0 4,4 0,14 -4,4 -14,0 -4,-4" fill="#E75480" opacity="0.8" />
              {/* Inner motifs on star */}
              <polygon points="0,-9 3,-3 9,0 3,3 0,9 -3,3 -9,0 -3,-3" fill="#1a1a1a" opacity="0.7" />
              <polygon points="0,-6 2,-2 6,0 2,2 0,6 -2,2 -6,0 -2,-2" fill="#FFFFFF" />
              <polygon points="0,-3.5 1.5,-1.5 3.5,0 1.5,1.5 0,3.5 -1.5,1.5 -3.5,0 -1.5,-1.5" fill="#1a1a1a" />
              {/* Pink/magenta center */}
              <circle cx="0" cy="0" r="1.5" fill="#E91E8C" />
              {/* Corner accent diamonds on star */}
              <rect x="-2" y="-13" width="3" height="3" fill="#F47B20" transform="rotate(45, -0.5, -11.5)" />
              <rect x="-2" y="10" width="3" height="3" fill="#F47B20" transform="rotate(45, -0.5, 11.5)" />
              <rect x="-13" y="-2" width="3" height="3" fill="#FFFFFF" transform="rotate(45, -11.5, -0.5)" />
              <rect x="10" y="-2" width="3" height="3" fill="#FFFFFF" transform="rotate(45, 11.5, -0.5)" />
            </g>
            {/* Flanking elements — center motif */}
            <rect x="92" y="27" width="2.5" height="2.5" fill="#DAA520" transform="rotate(45, 93.25, 28.25)" />
            <rect x="92" y="42" width="2.5" height="2.5" fill="#DAA520" transform="rotate(45, 93.25, 43.25)" />
            <rect x="126" y="27" width="2.5" height="2.5" fill="#DAA520" transform="rotate(45, 127.25, 28.25)" />
            <rect x="126" y="42" width="2.5" height="2.5" fill="#DAA520" transform="rotate(45, 127.25, 43.25)" />
            <rect x="96" y="34" width="2" height="2" fill="#00CED1" transform="rotate(45, 97, 35)" />
            <rect x="122" y="34" width="2" height="2" fill="#00CED1" transform="rotate(45, 123, 35)" />

            {/* ── RIGHT DIAMOND MOTIF (at x~165) ── */}
            <g transform="translate(165, 36)">
              {/* Outer green diamond */}
              <polygon points="0,-15 18,0 0,15 -18,0" fill="#00A86B" />
              {/* Cyan/teal fill */}
              <polygon points="0,-12 14,0 0,12 -14,0" fill="#20B2AA" />
              {/* Green ring */}
              <polygon points="0,-9 10,0 0,9 -10,0" fill="#1B7340" />
              {/* Yellow-green inner */}
              <polygon points="0,-7 8,0 0,7 -8,0" fill="#9ACD32" />
              {/* Gold diamond */}
              <polygon points="0,-5 5.5,0 0,5 -5.5,0" fill="#DAA520" />
              {/* Orange inner */}
              <polygon points="0,-3.5 4,0 0,3.5 -4,0" fill="#F47B20" />
              {/* Pink center */}
              <polygon points="0,-2 2.5,0 0,2 -2.5,0" fill="#E91E8C" />
              <circle cx="0" cy="0" r="1" fill="#FFD700" />
            </g>
            {/* Flanking elements — right diamond */}
            <rect x="143" y="30" width="3" height="3" fill="#DAA520" transform="rotate(45, 144.5, 31.5)" />
            <rect x="143" y="38" width="3" height="3" fill="#DAA520" transform="rotate(45, 144.5, 39.5)" />
            <rect x="186" y="30" width="3" height="3" fill="#F47B20" transform="rotate(45, 187.5, 31.5)" />
            <rect x="186" y="38" width="3" height="3" fill="#F47B20" transform="rotate(45, 187.5, 39.5)" />
            <rect x="146" y="34" width="2" height="2" fill="#32CD32" transform="rotate(45, 147, 35)" />
            <rect x="183" y="34" width="2" height="2" fill="#E91E8C" transform="rotate(45, 184, 35)" />

            {/* ── SCATTERED SMALL ACCENT DIAMONDS between motifs ── */}
            {/* Between left and center */}
            <rect x="83" y="24" width="2" height="2" fill="#00CED1" transform="rotate(45, 84, 25)" />
            <rect x="87" y="44" width="2" height="2" fill="#32CD32" transform="rotate(45, 88, 45)" />
            {/* Between center and right */}
            <rect x="134" y="24" width="2" height="2" fill="#E91E8C" transform="rotate(45, 135, 25)" />
            <rect x="138" y="44" width="2" height="2" fill="#DAA520" transform="rotate(45, 139, 45)" />
            {/* Far edges */}
            <rect x="16" y="32" width="2.5" height="2.5" fill="#F47B20" transform="rotate(45, 17.25, 33.25)" />
            <rect x="16" y="38" width="2" height="2" fill="#32CD32" transform="rotate(45, 17, 39)" />
            <rect x="198" y="32" width="2.5" height="2.5" fill="#F47B20" transform="rotate(45, 199.25, 33.25)" />
            <rect x="198" y="38" width="2" height="2" fill="#32CD32" transform="rotate(45, 199, 39)" />

            {/* Side flap details */}
            <path d="M 5 58 L -2 65 Q 2 68 8 62 Z" fill="#B01030" opacity="0.7" />
            <path d="M 215 58 L 222 65 Q 218 68 212 62 Z" fill="#B01030" opacity="0.7" />
          </g>

          {/* ── NECKLACE / GARLAND ── */}
          </g>{/* close head tilt group */}

          <path d="M 145 200 Q 160 215 210 220 Q 260 215 275 200"
            fill="none" stroke="#DAA520" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
          <path d="M 155 205 Q 170 218 210 222 Q 250 218 265 205"
            fill="none" stroke="#C41E3A" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          {/* Pendant */}
          <circle cx="210" cy="224" r="5" fill="#DAA520" opacity="0.5" />
          <circle cx="210" cy="224" r="2.5" fill="#C41E3A" opacity="0.6" />

          {/* ── SMALL TIKKA ON FOREHEAD ── */}
          <circle cx="210" cy="83" r="4" fill="#C41E3A" opacity="0.6" />
          <circle cx="210" cy="83" r="2" fill="#FFD700" opacity="0.5" />
        </svg>
      </div>

      {/* ─── GREETING CLOUD (on first load) ─────────────────── */}
      {showGreeting && state === 'idle' && (
        <div
          className="absolute greeting-cloud-pop"
          style={{ top: 'calc(50% - 260px)', left: 'calc(50% + 100px)', transformOrigin: 'bottom left' }}
        >
          <div className="relative">
            {/* Trail dots leading from robot */}
            <div className="absolute -bottom-10 -left-8 w-3 h-3 rounded-full bg-amber-400/15 border border-amber-400/20 animate-dot-pulse" style={{ animationDelay: '0.3s' }} />
            <div className="absolute -bottom-5 -left-3 w-5 h-5 rounded-full bg-amber-400/15 border border-amber-400/20 animate-dot-pulse" style={{ animationDelay: '0.15s' }} />

            {/* The greeting cloud */}
            <div className="relative px-6 py-4 rounded-[22px] backdrop-blur-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(10, 5, 20, 0.85), rgba(20, 12, 35, 0.8))',
                border: '1px solid rgba(218, 165, 32, 0.2)',
                boxShadow: '0 0 30px rgba(255, 153, 51, 0.06), 0 8px 25px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
              {/* Shimmer border */}
              <div className="absolute inset-0 rounded-[22px] holo-border pointer-events-none"
                style={{
                  padding: '1px',
                  background: 'linear-gradient(135deg, rgba(255,153,51,0.2), rgba(56,189,248,0.1), rgba(218,165,32,0.2))',
                  backgroundSize: '400% 400%',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }} />

              <div className="flex items-center gap-3">
                <span className="text-2xl">🙏</span>
                <div>
                  <p className="text-amber-100/90 text-base font-light tracking-wide">Namaste, Everyone!</p>
                  <p className="text-sky-300/40 text-[10px] tracking-[0.2em] uppercase mt-1">Himachali AI • Ready to Listen</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SPEECH BUBBLE (Thinking State) ───────────────────── */}
      {state === 'thinking' && (
        <div
          className="absolute animate-speech-bubble-pop"
          style={{ top: 'calc(50% - 310px)', left: 'calc(50% + 130px)', transform: `scale(${cloudScale})`, transformOrigin: 'bottom left' }}
        >
          <div className="relative">
            <div className="absolute -bottom-16 -left-12 w-4 h-4 rounded-full bg-amber-400/15 border border-amber-400/25 animate-dot-pulse" style={{ animationDelay: '0.4s' }} />
            <div className="absolute -bottom-9 -left-6 w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/25 animate-dot-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="absolute -bottom-3 left-2 w-8 h-8 rounded-full bg-amber-400/15 border border-amber-400/25 animate-dot-pulse" style={{ animationDelay: '0s' }} />

            <div className="relative px-7 py-6 min-w-[340px] max-w-[440px] rounded-2xl speech-bubble-glow"
              style={{ background: 'linear-gradient(135deg, rgba(10, 5, 20, 0.94), rgba(15, 10, 30, 0.9))', backdropFilter: 'blur(24px)' }}>
              <div className="absolute inset-0 rounded-2xl holo-border pointer-events-none"
                style={{
                  padding: '1px',
                  background: 'linear-gradient(135deg, rgba(255,153,51,0.25), rgba(56,189,248,0.15), rgba(255,153,51,0.25), rgba(218,165,32,0.2))',
                  backgroundSize: '400% 400%',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }} />
              <div className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ boxShadow: '0 0 50px rgba(255, 153, 51, 0.08), 0 0 100px rgba(56, 189, 248, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.06)' }} />

              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] tracking-[0.25em] uppercase text-amber-400/60 font-medium">Processing Speech</span>
              </div>

              <div className="min-h-[80px] max-h-[160px] overflow-hidden relative z-10">
                {transcriptWords.length > 0 ? (
                  <p className="text-sky-100/90 text-sm leading-relaxed font-light">
                    {transcriptWords.slice(0, visibleWordCount).map((word, i) => (
                      <span key={`tw-${i}`} className="inline-block animate-word-fade-in mr-[0.3em]">{word}</span>
                    ))}
                    {isStillTyping && <span className="inline-block w-[2px] h-[14px] bg-amber-400 ml-0.5 animate-cursor-blink align-middle" />}
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-amber-300/30">
                    <span className="text-sm tracking-wider animate-pulse">Listening</span>
                    <span className="flex gap-1">
                      {[0, 0.15, 0.3].map((d, i) => <span key={i} className="w-1 h-1 rounded-full bg-amber-400/40 animate-bounce" style={{ animationDelay: `${d}s` }} />)}
                    </span>
                  </div>
                )}
              </div>

              {floatingKeywords.length > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-500/10 relative z-10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400/50" />
                    <span className="text-[8px] tracking-[0.3em] uppercase text-amber-500/30">Keywords Detected</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {floatingKeywords.map((kw, i) => {
                      const seenBefore = wordHistory.has(kw.toLowerCase());
                      const variant = i % 3;
                      return (
                        <div key={`kw-${kw}-${i}`}
                          className="animate-keyword-pop keyword-mini-float"
                          style={{
                            animationDelay: `${i * 150}ms`,
                            ['--float-delay' as string]: `${i * 0.3}s`,
                          }}>
                          <div className="relative px-3 py-1.5 rounded-[14px] backdrop-blur-sm"
                            style={{
                              background: seenBefore
                                ? 'rgba(255, 153, 51, 0.1)'
                                : variant === 0 ? 'rgba(56, 189, 248, 0.06)'
                                : variant === 1 ? 'rgba(218, 165, 32, 0.06)'
                                : 'rgba(52, 211, 153, 0.06)',
                              border: `1px solid ${seenBefore
                                ? 'rgba(255, 153, 51, 0.25)'
                                : variant === 0 ? 'rgba(56, 189, 248, 0.15)'
                                : variant === 1 ? 'rgba(218, 165, 32, 0.15)'
                                : 'rgba(52, 211, 153, 0.15)'}`,
                              boxShadow: seenBefore
                                ? '0 0 12px rgba(255, 153, 51, 0.1), 0 2px 8px rgba(0,0,0,0.15)'
                                : '0 0 8px rgba(56, 189, 248, 0.05), 0 2px 8px rgba(0,0,0,0.1)',
                            }}>
                            {/* Top shine */}
                            <div className="absolute top-0 left-[20%] right-[20%] h-[0.5px] rounded-full"
                              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
                            <span className="text-xs font-medium tracking-wide"
                              style={{
                                color: seenBefore ? '#FDE68A' : variant === 0 ? '#7DD3FC' : variant === 1 ? '#FCD34D' : '#6EE7B7',
                                textShadow: seenBefore ? '0 0 10px rgba(255, 153, 51, 0.4)' : 'none',
                              }}>{kw}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
        .animate-blink { animation: blink 4s infinite; }
        @keyframes blink { 0%, 95%, 100% { transform: scaleY(1); } 97% { transform: scaleY(0.1); } }
        .animate-flash { animation: flash 0.2s ease-in-out 3; }
        @keyframes flash { 0%, 100% { opacity: 1; filter: drop-shadow(0 0 20px #FFF); } 50% { opacity: 0; } }

        .greeting-cloud-pop { animation: greetingPop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards, greetingFadeOut 1.5s ease-in 4.5s forwards; }
        @keyframes greetingPop { 0% { transform: scale(0.3) translateY(15px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes greetingFadeOut { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.9) translateY(-10px); } }
        .animate-wobble { animation: wobble 1s ease-in-out infinite; }
        @keyframes wobble { 0%, 100% { transform: rotate(-3deg); } 25% { transform: rotate(4deg); } 75% { transform: rotate(-8deg); } }

        .breathing-glow { animation: breatheGlow 4s ease-in-out infinite; }
        @keyframes breatheGlow { 0%, 100% { transform: scale(0.95); opacity: 0.2; } 50% { transform: scale(1.08); opacity: 0.4; } }

        /* ── Enhanced listening glow — faster, bluer, stronger ── */
        .neer-listening-glow { animation: listeningGlow 2.5s ease-in-out infinite; }
        @keyframes listeningGlow {
          0%, 100% { transform: scale(0.98); opacity: 0.35; filter: blur(25px); }
          50% { transform: scale(1.12); opacity: 0.65; filter: blur(30px); }
        }

        .orbital-ring-1 { animation: orbitSpin1 8s linear infinite; }
        @keyframes orbitSpin1 { 0% { transform: rotateX(70deg) rotateZ(0deg); } 100% { transform: rotateX(70deg) rotateZ(360deg); } }
        .orbital-ring-2 { animation: orbitSpin2 12s linear infinite reverse; }
        @keyframes orbitSpin2 { 0% { transform: rotateX(75deg) rotateZ(45deg); } 100% { transform: rotateX(75deg) rotateZ(405deg); } }
        .orbital-ring-3 { animation: orbitSpin3 18s linear infinite; }
        @keyframes orbitSpin3 { 0% { transform: rotateX(65deg) rotateZ(-20deg); } 100% { transform: rotateX(65deg) rotateZ(340deg); } }

        .led-strip-anim { animation: ledSweep 2.5s ease-in-out infinite; }
        @keyframes ledSweep { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }

        .speech-bubble-glow { box-shadow: 0 0 50px rgba(255, 153, 51, 0.08), 0 0 100px rgba(56, 189, 248, 0.04); }
        .holo-border { animation: holoBorderShift 4s ease-in-out infinite; }
        @keyframes holoBorderShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        .animate-speech-bubble-pop { animation: speechBubblePop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes speechBubblePop { 0% { transform: scale(0.4) translateY(20px); opacity: 0; } 100% { transform: scale(${cloudScale}) translateY(0); opacity: 1; } }
        .animate-dot-pulse { animation: dotPulse 2s ease-in-out infinite; }
        @keyframes dotPulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.2); } }
        .animate-word-fade-in { animation: wordFadeIn 200ms ease-out forwards; }
        @keyframes wordFadeIn { 0% { opacity: 0; transform: translateY(4px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-cursor-blink { animation: cursorBlink 0.8s step-end infinite; }
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-keyword-pop { animation: keywordPop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards; opacity: 0; }
        @keyframes keywordPop { 0% { transform: scale(0.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .keyword-mini-float { animation: keywordPop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards, kwMiniFloat 3s ease-in-out infinite; animation-delay: var(--float-delay, 0s); }
        @keyframes kwMiniFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

        .hover-ring-pulse { animation: hoverRingPulse 3s ease-in-out infinite; }
        @keyframes hoverRingPulse { 0%, 100% { opacity: 0.15; transform: scale(1); } 50% { opacity: 0.35; transform: scale(1.05); } }
        .hover-ring-pulse-inner { animation: hoverRingPulse 3s ease-in-out infinite 0.5s; }
        .hover-dot { animation: hoverDotGlow 2s ease-in-out infinite; }
        @keyframes hoverDotGlow { 0%, 100% { opacity: 0.15; r: 1.5; } 50% { opacity: 0.5; r: 3; } }
      `}</style>
    </div>
  );
})
