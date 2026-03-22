// components/AIThinkingTicker.tsx — Immersive emotion display panel (replaces raw JSON terminal)
'use client';

import { useAppStore } from '@/store/appStore';
import { memo } from 'react';

export default memo(function AIThinkingTicker() {
  const liveTranscript = useAppStore((s) => s.liveTranscript);
  const currentTranscript = useAppStore((s) => s.currentTranscript);
  const floatingKeywords = useAppStore((s) => s.floatingKeywords);
  const currentEmotion = useAppStore((s) => s.currentEmotion);
  const currentScore = useAppStore((s) => s.currentScore);
  const phase = useAppStore((s) => s.pipelinePhase);

  // Show during processing, showing_prompt, or revealing phases
  const show =
    phase === 'processing' || phase === 'showing_prompt' || phase === 'revealing' || phase === 'listening';

  const transcript = liveTranscript || currentTranscript || '';

  // Truncate transcript for display — show last ~60 chars
  const truncatedTranscript = transcript.length > 60
    ? '…' + transcript.slice(-60)
    : transcript;

  const emotionColor = currentEmotion
    ? ({
        Hope:    '#fde047',
        Fear:    '#818cf8',
        Grief:   '#38bdf8',
        Anger:   '#fb7185',
        Renewal: '#34d399',
      }[currentEmotion] ?? '#38bdf8')
    : '#38bdf8';

  if (!show && !transcript && !currentEmotion) return null;

  return (
    <div
      className={`fixed bottom-12 right-6 w-72 z-[12] transition-all duration-700 ease-in-out ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div
        className="backdrop-blur-xl rounded-2xl p-5 shadow-[0_0_40px_rgba(56,189,248,0.08)]"
        style={{
          background: 'linear-gradient(145deg, rgba(8,5,20,0.88), rgba(12,8,28,0.85))',
          border: '1px solid rgba(56,189,248,0.12)',
        }}
      >
        {/* Header — subtle status */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 ticker-pulse-dot" />
          <span className="text-[9px] tracking-[0.3em] uppercase text-sky-400/50 font-light">
            {phase === 'listening' ? 'Listening…' : 'Interpreting collective emotion…'}
          </span>
        </div>

        {/* Listening to — transcript snippet */}
        {transcript && (
          <div className="mb-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-sky-300/30 block mb-1.5">
              Listening to:
            </span>
            <p
              className="text-[13px] text-sky-100/80 font-light italic leading-relaxed"
              style={{ textShadow: '0 0 10px rgba(56,189,248,0.1)' }}
            >
              &ldquo;{truncatedTranscript}&rdquo;
            </p>
          </div>
        )}

        {/* Memories detected — keywords */}
        {floatingKeywords.length > 0 && (
          <div className="mb-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-sky-300/30 block mb-1.5">
              Memories detected:
            </span>
            <p className="text-[13px] text-amber-200/80 font-light tracking-wide">
              {floatingKeywords.slice(0, 5).join(' • ')}
            </p>
          </div>
        )}

        {/* Emotion */}
        {currentEmotion && currentScore !== null && (
          <div>
            <span className="text-[10px] tracking-[0.2em] uppercase text-sky-300/30 block mb-1.5">
              Emotion:
            </span>
            <div className="flex items-center gap-2.5">
              <div
                className="w-2 h-6 rounded-full ticker-emotion-bar"
                style={{
                  background: emotionColor,
                  boxShadow: `0 0 12px ${emotionColor}60`,
                }}
              />
              <span
                className="text-[15px] font-medium tracking-wide"
                style={{
                  color: emotionColor,
                  textShadow: `0 0 15px ${emotionColor}40`,
                }}
              >
                {currentEmotion} ({currentScore}%)
              </span>
            </div>
          </div>
        )}

        {/* Subtle bottom line */}
        <div
          className="mt-4 pt-3 border-t"
          style={{ borderColor: 'rgba(56,189,248,0.06)' }}
        >
          <span className="text-[8px] tracking-[0.3em] uppercase text-sky-500/20 font-light">
            Understanding voices…
          </span>
        </div>
      </div>

      <style jsx>{`
        .ticker-pulse-dot {
          animation: tickerDotPulse 2s ease-in-out infinite;
        }
        @keyframes tickerDotPulse {
          0%, 100% { opacity: 0.4; box-shadow: 0 0 4px rgba(56,189,248,0.2); }
          50% { opacity: 1; box-shadow: 0 0 12px rgba(56,189,248,0.5); }
        }
        .ticker-emotion-bar {
          animation: emotionBarPulse 1.5s ease-in-out infinite;
        }
        @keyframes emotionBarPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
})
