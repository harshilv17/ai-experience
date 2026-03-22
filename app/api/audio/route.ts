// app/api/audio/route.ts — Receive audio blob → run full pipeline
import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/orchestrator';
import { sseBroker } from '@/lib/sse-broker';
import type { AudioChunk } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MIN_SPEECH_SECONDS = parseInt(process.env.MIN_SPEECH_SECONDS || '6', 10);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const audioFile = formData.get('audio') as Blob | null;
    const chunkId = formData.get('chunkId') as string;
    const durationMs = parseInt(formData.get('durationMs') as string, 10);
    const speechDurationMs = parseInt(formData.get('speechDurationMs') as string, 10);
    const mimeType = (formData.get('mimeType') as string) || 'audio/webm;codecs=opus';
    const isConference = formData.get('conference') === 'true';

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (!chunkId) {
      return NextResponse.json({ error: 'No chunkId provided' }, { status: 400 });
    }

    // Convert Blob to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Speech duration guard
    if (speechDurationMs < MIN_SPEECH_SECONDS * 1000) {
      console.log(
        `[Audio API] Skipping chunk ${chunkId}: speech ${speechDurationMs}ms < ${MIN_SPEECH_SECONDS * 1000}ms minimum`
      );

      sseBroker.broadcast({
        type: 'cycle_skipped',
        data: {
          reason: 'insufficient_speech',
          speechDurationMs,
          minimumMs: MIN_SPEECH_SECONDS * 1000,
          chunkId,
        },
        timestamp: Date.now(),
      });

      return NextResponse.json({
        status: 'skipped',
        reason: 'insufficient_speech',
        speechDurationMs,
        chunkId,
      });
    }

    // Build AudioChunk
    const chunk: AudioChunk = {
      blob: buffer,
      mimeType,
      durationMs: durationMs || 30000,
      speechDurationMs: speechDurationMs || 0,
      timestamp: Date.now(),
      chunkId,
    };

    if (isConference) {
      // Conference mode: transcribe only, no emotion/image pipeline
      await orchestrator.processConferenceChunk(chunk);
      return NextResponse.json({ status: 'conference_chunk_processed', chunkId });
    }

    // Auto mode: full pipeline
    const result = await orchestrator.processChunk(chunk);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[Audio API] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
