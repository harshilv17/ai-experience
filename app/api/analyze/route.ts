// app/api/analyze/route.ts — Standalone emotion analysis endpoint
import { NextResponse } from 'next/server';
import { emotionAnalyzer } from '@/lib/emotion-analyzer';
import { v4 as uuidv4 } from 'uuid';
import type { TranscriptResult } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transcript, chunkId } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid transcript string' },
        { status: 400 }
      );
    }

    const transcriptResult: TranscriptResult = {
      text: transcript,
      language: 'en',
      durationSeconds: 0,
      chunkId: chunkId || uuidv4(),
      latencyMs: 0,
    };

    const result = await emotionAnalyzer.analyze(transcriptResult);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[Analyze API] Error:', error);

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
