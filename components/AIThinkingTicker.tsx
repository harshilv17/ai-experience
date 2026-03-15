// components/AIThinkingTicker.tsx — Terminal typewriter overlay for JSON (Section 12)
'use client';

import { useAppStore } from '@/store/appStore';
import { useEffect, useState, useRef, memo } from 'react';

export default memo(function AIThinkingTicker() {
  const liveEmotionJSON = useAppStore((s) => s.liveEmotionJSON);
  const phase = useAppStore((s) => s.pipelinePhase);
  const [displayedText, setDisplayedText] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show during processing, showing_prompt, or revealing phases
  const show =
    (phase === 'processing' || phase === 'showing_prompt' || phase === 'revealing') && liveEmotionJSON !== null;

  useEffect(() => {
    if (!liveEmotionJSON) {
      setDisplayedText('');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    // Typewriter effect
    let charIndex = 0;
    setDisplayedText('');

    const typeChar = () => {
      if (charIndex < liveEmotionJSON.length) {
        setDisplayedText((prev) => prev + liveEmotionJSON.charAt(charIndex));
        charIndex++;
        // Randomize typing speed slightly (10-40ms)
        timeoutRef.current = setTimeout(typeChar, 10 + Math.random() * 30);
      }
    };

    typeChar();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [liveEmotionJSON]);

  if (!show && displayedText.length === 0) return null;

  return (
    <div
      className={`fixed bottom-12 right-6 w-80 z-[12] transition-all duration-700 ease-in-out ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-black/80 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
        <div className="text-[10px] text-green-500/60 uppercase tracking-widest mb-2 border-b border-green-500/20 pb-1 flex justify-between items-center">
          <span>GPT-4o Subroutine</span>
          <span className="animate-pulse">_</span>
        </div>
        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed overflow-hidden">
          {displayedText}
          <span className="animate-pulse opacity-70">█</span>
        </pre>
      </div>
    </div>
  );
})
