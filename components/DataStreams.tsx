// components/DataStreams.tsx — Vertical streams of fading characters flowing in the background
'use client';

import { memo, useMemo, useState, useEffect } from 'react';
import type { PipelinePhase } from '@/types';

interface StreamColumn {
  id: number;
  x: number;
  chars: string[];
  speed: number;
  opacity: number;
  delay: number;
}

const GLYPHS = 'अआइउऊएऐओकखगचतदनपमयरलवशसह꣐꣑꣒꣓꣔꣕꣖0123456789';

function generateStreams(count: number): StreamColumn[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (i / count) * 100 + Math.random() * 3,
    chars: Array.from({ length: 8 + Math.floor(Math.random() * 12) }, () =>
      GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
    ),
    speed: 15 + Math.random() * 20,
    opacity: 0.03 + Math.random() * 0.06,
    delay: Math.random() * -30,
  }));
}

interface Props {
  phase: PipelinePhase;
}

export default memo(function DataStreams({ phase }: Props) {
  const [mounted, setMounted] = useState(false);
  const streams = useMemo(() => (mounted ? generateStreams(14) : []), [mounted]);

  useEffect(() => { setMounted(true); }, []);

  const isProcessing = phase === 'processing' || phase === 'showing_prompt';
  const isDisplaying = phase === 'displaying';

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden transition-opacity duration-[2000ms] ${
        isDisplaying ? 'opacity-0' : isProcessing ? 'opacity-100' : 'opacity-60'
      }`}
      style={{ zIndex: 1 }}
    >
      {streams.map((stream) => (
        <div
          key={stream.id}
          className="absolute top-0 stream-fall"
          style={{
            left: `${stream.x}%`,
            animationDuration: `${stream.speed}s`,
            animationDelay: `${stream.delay}s`,
            opacity: isProcessing ? stream.opacity * 2 : stream.opacity,
          }}
        >
          <div className="flex flex-col items-center">
            {stream.chars.map((char, ci) => (
              <span
                key={ci}
                className="text-[10px] font-mono leading-[1.6] select-none"
                style={{
                  color: ci === 0
                    ? 'rgba(186, 230, 253, 0.6)'
                    : `rgba(56, 189, 248, ${0.4 - ci * 0.03})`,
                  textShadow: ci === 0
                    ? '0 0 8px rgba(56, 189, 248, 0.5)'
                    : 'none',
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>
      ))}

      <style jsx>{`
        .stream-fall {
          animation: streamFall var(--stream-speed, 20s) linear infinite;
        }
        @keyframes streamFall {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
});
