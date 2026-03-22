// components/PromptPreview.tsx — DALL-E prompt & token preview during showing_prompt phase
'use client';

import { useAppStore } from '@/store/appStore';
import type { PipelinePhase } from '@/types';

interface Props {
  phase: PipelinePhase;
}

export default function PromptPreview({ phase }: Props) {
  const liveImagePrompt = useAppStore((s) => s.liveImagePrompt);
  const currentEmotion = useAppStore((s) => s.currentEmotion);
  const currentKeywords = useAppStore((s) => s.currentKeywords);

  if (phase !== 'showing_prompt') return null;

  // Estimate token count (rough: ~4 chars per token for English)
  const tokenEstimate = liveImagePrompt ? Math.ceil(liveImagePrompt.length / 4) : 0;

  return (
    <div
      className="fixed inset-0 pointer-events-none flex flex-col items-center justify-center px-6 md:px-12 py-8"
      style={{ zIndex: 12 }}
    >
      {/* Section label */}
      <div className="mb-4 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
        <span className="text-sky-400/80 text-xs font-semibold uppercase tracking-[0.2em]">
          Next Image Prompt
        </span>
      </div>

      {/* Prompt text — scrollable card */}
      <div
        className="max-w-4xl w-full max-h-[35vh] overflow-y-auto rounded-2xl px-6 py-5 mb-5 scrollbar-thin"
        style={{
          background: 'linear-gradient(135deg, rgba(3, 8, 16, 0.9) 0%, rgba(15, 23, 42, 0.85) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 0 80px rgba(56, 189, 248, 0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <p className="text-sky-200/95 font-mono text-sm leading-relaxed">
          {liveImagePrompt || (
            <span className="text-sky-400/50 italic">Generating prompt...</span>
          )}
        </p>
      </div>

      {/* Meta: emotion, tokens, keywords */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {currentEmotion && (
          <span
            className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#7DD3FC',
              border: '1px solid rgba(56, 189, 248, 0.35)',
            }}
          >
            {currentEmotion}
          </span>
        )}
        {tokenEstimate > 0 && (
          <span className="text-sky-400/60 font-mono text-xs">
            ~{tokenEstimate} tokens
          </span>
        )}
        {currentKeywords.length > 0 && (
          <span className="text-sky-300/50 text-xs max-w-md truncate">
            {currentKeywords.join(' · ')}
          </span>
        )}
      </div>
    </div>
  );
}
