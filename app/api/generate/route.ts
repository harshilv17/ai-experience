// app/api/generate/route.ts — Standalone image generation endpoint
import { NextResponse } from 'next/server';
import { imageGenerator } from '@/lib/image-generator';
import { fallbackManager } from '@/lib/fallback-manager';
import { v4 as uuidv4 } from 'uuid';
import type { EmotionResult, EmotionClass } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_EMOTIONS: EmotionClass[] = ['Hope', 'Fear', 'Grief', 'Anger', 'Renewal'];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { emotion, score, keywords, chunkId } = body;

    if (!emotion || !VALID_EMOTIONS.includes(emotion)) {
      return NextResponse.json(
        { error: `Invalid emotion. Must be one of: ${VALID_EMOTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    const emotionResult: EmotionResult = {
      emotion: emotion as EmotionClass,
      score: typeof score === 'number' ? score : 50,
      keywords: Array.isArray(keywords)
        ? keywords
        : ['abstract', 'expressive', 'vivid'],
      safe: true,
      chunkId: chunkId || uuidv4(),
      latencyMs: 0,
    };

    const result = await imageGenerator.generate(emotionResult, fallbackManager);

    // Add to fallback pool if not already a fallback
    if (!result.isFallback) {
      fallbackManager.addToPool(emotionResult.emotion, result.localPath);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[Generate API] Error:', error);

    if (error && typeof error === 'object' && 'code' in error) {
      const typed = error as { code: string; message?: string };
      return NextResponse.json(
        { error: typed.message || typed.code, code: typed.code },
        { status: 422 }
      );
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
