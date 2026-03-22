// components/CinematicFrame.tsx — HUD-style frame overlay with corner brackets and data readouts
'use client';

import { memo, useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import type { PipelinePhase } from '@/types';

interface Props {
  phase: PipelinePhase;
}

export default memo(function CinematicFrame({ phase }: Props) {
  const emotionHistory = useAppStore((s) => s.emotionHistory);
  const stats = useAppStore((s) => s.stats);
  const currentEmotion = useAppStore((s) => s.currentEmotion);
  const currentScore = useAppStore((s) => s.currentScore);

  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const isActive = phase !== 'displaying';
  const isProcessing = phase === 'processing' || phase === 'showing_prompt';

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[13] transition-opacity duration-1000 ${
        isActive ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* ─── CORNER BRACKETS ─────────────────────────────────── */}
      {/* Top-left */}
      <div className="absolute top-4 left-4">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <path d="M0,12 L0,0 L12,0" fill="none" stroke="rgba(218,165,32,0.2)" strokeWidth="1.5" />
        </svg>
      </div>
      {/* Top-right */}
      <div className="absolute top-4 right-4">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <path d="M28,0 L40,0 L40,12" fill="none" stroke="rgba(218,165,32,0.2)" strokeWidth="1.5" />
        </svg>
      </div>
      {/* Bottom-left */}
      <div className="absolute bottom-4 left-4">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <path d="M0,28 L0,40 L12,40" fill="none" stroke="rgba(218,165,32,0.2)" strokeWidth="1.5" />
        </svg>
      </div>
      {/* Bottom-right */}
      <div className="absolute bottom-4 right-4">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <path d="M28,40 L40,40 L40,28" fill="none" stroke="rgba(218,165,32,0.2)" strokeWidth="1.5" />
        </svg>
      </div>

      {/* ─── TOP-LEFT DATA READOUT ───────────────────────────── */}
      <div className="absolute top-8 left-8 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${
            isProcessing ? 'bg-amber-400 animate-pulse' : 'bg-amber-800'
          }`} />
          <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-amber-500/40">
            {time}
          </span>
        </div>
        <span className="text-[9px] font-mono tracking-[0.15em] text-amber-600/25">
          SYS.ACTIVE — HIMACHALI AI v2.0
        </span>
      </div>

      {/* ─── TOP-RIGHT DATA READOUT ──────────────────────────── */}
      <div className="absolute top-8 right-8 flex flex-col items-end gap-1.5">
        <span className="text-[9px] font-mono tracking-[0.15em] text-cyan-600/30">
          CYCLES: {stats.completedCycles}/{stats.totalCycles}
        </span>
        {stats.avgLatencyMs > 0 && (
          <span className="text-[9px] font-mono tracking-[0.15em] text-amber-600/20">
            AVG.LAT: {Math.round(stats.avgLatencyMs)}ms
          </span>
        )}
      </div>

      {/* ─── BOTTOM-LEFT EMOTION STREAM ──────────────────────── */}
      <div className="absolute bottom-10 left-8 flex flex-col gap-1">
        {currentEmotion && (
          <div className="flex items-center gap-2 emotion-hud-pop">
            <div className="w-1 h-4 rounded-full" style={{
              background: currentEmotion === 'Hope' ? '#fde047' :
                          currentEmotion === 'Fear' ? '#818cf8' :
                          currentEmotion === 'Grief' ? '#38bdf8' :
                          currentEmotion === 'Anger' ? '#fb7185' : '#34d399',
              boxShadow: `0 0 8px ${
                currentEmotion === 'Hope' ? 'rgba(253,224,71,0.4)' :
                currentEmotion === 'Fear' ? 'rgba(129,140,248,0.4)' :
                currentEmotion === 'Grief' ? 'rgba(56,189,248,0.4)' :
                currentEmotion === 'Anger' ? 'rgba(251,113,133,0.4)' : 'rgba(52,211,153,0.4)'
              }`,
            }} />
            <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-amber-500/40">
              {currentEmotion} {currentScore !== null ? `[${currentScore}]` : ''}
            </span>
          </div>
        )}
        <div className="flex gap-[3px] mt-1">
          {emotionHistory.slice(-20).map((entry, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full"
              style={{
                height: `${4 + (entry.score / 100) * 12}px`,
                background: entry.emotion === 'Hope' ? 'rgba(253,224,71,0.5)' :
                             entry.emotion === 'Fear' ? 'rgba(129,140,248,0.5)' :
                             entry.emotion === 'Grief' ? 'rgba(56,189,248,0.5)' :
                             entry.emotion === 'Anger' ? 'rgba(251,113,133,0.5)' : 'rgba(52,211,153,0.5)',
                opacity: 0.3 + (i / 20) * 0.7,
              }}
            />
          ))}
        </div>
      </div>

      {/* ─── DECORATIVE SCAN LINES (top & bottom) ────────────── */}
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(218,165,32,0.08) 30%, rgba(218,165,32,0.12) 50%, rgba(218,165,32,0.08) 70%, transparent 100%)',
      }} />
      <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(218,165,32,0.08) 30%, rgba(218,165,32,0.12) 50%, rgba(218,165,32,0.08) 70%, transparent 100%)',
      }} />

      <style jsx>{`
        .emotion-hud-pop {
          animation: hudPop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes hudPop {
          0% { opacity: 0; transform: translateX(-8px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
});
