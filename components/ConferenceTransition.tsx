// components/ConferenceTransition.tsx — Swirling water vortex transition for conference mode
'use client';

import { memo, useMemo, useState, useEffect, useRef } from 'react';

interface Props {
  active: boolean; // true when conferenceIsGenerating
}

function generateVortexRings(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    size: 60 + i * 55,
    duration: 3 + i * 0.4,
    delay: i * 0.15,
    opacity: 0.5 - i * 0.035,
    direction: i % 2 === 0 ? 1 : -1,
  }));
}

function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (i / count) * 360,
    radius: 80 + Math.random() * 180,
    size: 2 + Math.random() * 3,
    speed: 3 + Math.random() * 4,
    delay: Math.random() * 3,
    opacity: 0.3 + Math.random() * 0.5,
  }));
}

export default memo(function ConferenceTransition({ active }: Props) {
  const rings = useMemo(() => generateVortexRings(10), []);
  const particles = useMemo(() => generateParticles(40), []);
  const [textVisible, setTextVisible] = useState(false);
  const [dotsCount, setDotsCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle enter/exit with fade
  useEffect(() => {
    if (active) {
      // Cancel any pending fade-out
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      setFadingOut(false);
      setVisible(true);
    } else if (visible) {
      // Start fade-out
      setFadingOut(true);
      fadeTimerRef.current = setTimeout(() => {
        setVisible(false);
        setFadingOut(false);
        fadeTimerRef.current = null;
      }, 1500); // match CSS fade-out duration
    }
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [active, visible]);

  // Show text after vortex appears
  useEffect(() => {
    if (active && visible) {
      const timer = setTimeout(() => setTextVisible(true), 600);
      return () => clearTimeout(timer);
    } else if (!active) {
      setTextVisible(false);
      setDotsCount(0);
    }
  }, [active, visible]);

  // Animate the dots
  useEffect(() => {
    if (!textVisible) return;
    const interval = setInterval(() => {
      setDotsCount(prev => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, [textVisible]);

  if (!visible) return null;

  const dots = '.'.repeat(dotsCount);

  return (
    <div
      className={`fixed inset-0 z-[20] flex items-center justify-center ${
        fadingOut ? 'conference-transition-exit' : 'conference-transition-enter'
      }`}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(2, 6, 23, 0.92) 0%, rgba(0, 0, 0, 0.97) 100%)',
      }}
    >
      {/* ─── SWIRLING VORTEX RINGS ──────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center">
        {rings.map((ring) => (
          <div
            key={ring.id}
            className="absolute rounded-full vortex-ring"
            style={{
              width: `${ring.size}px`,
              height: `${ring.size}px`,
              border: `1.5px solid rgba(56, 189, 248, ${ring.opacity})`,
              boxShadow: `
                0 0 ${10 + ring.id * 3}px rgba(56, 189, 248, ${ring.opacity * 0.3}),
                inset 0 0 ${5 + ring.id * 2}px rgba(56, 189, 248, ${ring.opacity * 0.15})
              `,
              animation: `vortexSpin ${ring.duration}s linear ${ring.delay}s infinite ${ring.direction > 0 ? 'normal' : 'reverse'}`,
              transformOrigin: 'center center',
            }}
          />
        ))}

        {/* ─── CENTRAL GLOW ──────────────────────────────────────── */}
        <div
          className="absolute rounded-full vortex-core-pulse"
          style={{
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(56, 189, 248, 0.08) 40%, transparent 70%)',
            filter: 'blur(10px)',
          }}
        />
        <div
          className="absolute rounded-full vortex-core-inner"
          style={{
            width: '40px',
            height: '40px',
            background: 'radial-gradient(circle, rgba(186, 230, 253, 0.6) 0%, rgba(56, 189, 248, 0.3) 50%, transparent 80%)',
            filter: 'blur(3px)',
          }}
        />
      </div>

      {/* ─── ORBITING WATER PARTICLES ────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(147, 197, 253, ${p.opacity}) 0%, transparent 70%)`,
              boxShadow: `0 0 6px rgba(56, 189, 248, ${p.opacity * 0.5})`,
              animation: `vortexOrbit ${p.speed}s linear ${p.delay}s infinite`,
              transformOrigin: `${p.radius}px center`,
              left: `calc(50% - ${p.radius}px)`,
              top: '50%',
            }}
          />
        ))}
      </div>

      {/* ─── FLOWING WATER STREAKS ───────────────────────────────── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.5 }}>
        <defs>
          <linearGradient id="waterStreak" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0)" />
            <stop offset="50%" stopColor="rgba(56, 189, 248, 0.4)" />
            <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse
            key={i}
            cx="50%"
            cy="50%"
            rx={100 + i * 40}
            ry={60 + i * 25}
            fill="none"
            stroke="url(#waterStreak)"
            strokeWidth="0.8"
            className="water-streak-orbit"
            style={{
              transformOrigin: 'center',
              animation: `waterStreakSpin ${4 + i * 0.5}s linear ${i * 0.3}s infinite`,
              opacity: 0.4 - i * 0.05,
            }}
          />
        ))}
      </svg>

      {/* ─── TEXT OVERLAY ────────────────────────────────────────── */}
      <div
        className={`absolute z-10 flex flex-col items-center gap-6 transition-all duration-1000 ${
          textVisible && !fadingOut ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
        style={{ bottom: '18%' }}
      >
        {/* Main message */}
        <div className="text-center">
          <p
            className="text-[clamp(1rem,2.2vw,1.6rem)] tracking-[0.18em] font-light select-none"
            style={{
              color: 'rgba(186, 230, 253, 0.85)',
              textShadow: '0 0 30px rgba(56, 189, 248, 0.4), 0 0 60px rgba(56, 189, 248, 0.15)',
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}
          >
            Based on your voices, AI has conceived{dots}
          </p>
        </div>

        {/* Subtle sub-label */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-sky-400/30" />
          <p
            className="text-[clamp(0.65rem,1.2vw,0.85rem)] tracking-[0.3em] uppercase select-none conference-sub-breathe"
            style={{
              color: 'rgba(56, 189, 248, 0.45)',
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              fontWeight: 300,
            }}
          >
            weaving your resonance
          </p>
          <div className="w-8 h-[1px] bg-gradient-to-l from-transparent to-sky-400/30" />
        </div>
      </div>

      {/* ─── CSS KEYFRAMES ────────────────────────────────────────── */}
      <style jsx>{`
        .conference-transition-enter {
          animation: transitionFadeIn 800ms ease-out forwards;
        }
        @keyframes transitionFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        .conference-transition-exit {
          animation: transitionFadeOut 1500ms ease-in forwards;
        }
        @keyframes transitionFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes vortexSpin {
          0% { transform: rotate(0deg) scale(1); border-radius: 50%; }
          25% { transform: rotate(90deg) scale(1.03); border-radius: 48% 52% 50% 50%; }
          50% { transform: rotate(180deg) scale(0.97); border-radius: 50%; }
          75% { transform: rotate(270deg) scale(1.02); border-radius: 52% 48% 50% 50%; }
          100% { transform: rotate(360deg) scale(1); border-radius: 50%; }
        }

        .vortex-core-pulse {
          animation: corePulse 2s ease-in-out infinite;
        }
        @keyframes corePulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.4); opacity: 1; }
        }

        .vortex-core-inner {
          animation: coreInner 1.5s ease-in-out infinite;
        }
        @keyframes coreInner {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1; }
        }

        @keyframes vortexOrbit {
          0% { transform: rotate(0deg); opacity: 0.8; }
          50% { opacity: 0.4; }
          100% { transform: rotate(360deg); opacity: 0.8; }
        }

        @keyframes waterStreakSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .conference-sub-breathe {
          animation: subBreathe 3s ease-in-out infinite;
        }
        @keyframes subBreathe {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.65; }
        }
      `}</style>
    </div>
  );
});
