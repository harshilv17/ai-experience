// app/api/control/route.ts — Operator commands
import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/orchestrator';
import { imageGenerator } from '@/lib/image-generator';
import { fallbackManager } from '@/lib/fallback-manager';
import { sseBroker } from '@/lib/sse-broker';
import type { ControlCommand } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_COMMANDS: ControlCommand[] = [
  'live_on',
  'live_off',
  'pause',
  'resume',
  'skip',
  'force_generate',
  'force_generate_with_prompt',
  'conference_start',
  'conference_stop',
  'set_capture_mode',
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cmd, prompt, outputType, mode } = body as { cmd: ControlCommand; prompt?: string; outputType?: 'image' | 'video'; mode?: string };

    if (!cmd || !VALID_COMMANDS.includes(cmd)) {
      return NextResponse.json(
        { error: `Unknown command. Valid commands: ${VALID_COMMANDS.join(', ')}` },
        { status: 400 }
      );
    }

    switch (cmd) {
      case 'live_on':
        orchestrator.setLiveMode(true);
        break;
      case 'live_off':
        orchestrator.setLiveMode(false);
        break;
      case 'pause':
        orchestrator.pause();
        break;
      case 'resume':
        orchestrator.resume();
        break;
      case 'skip':
        orchestrator.skip();
        break;
      case 'force_generate':
        await orchestrator.forceGenerate(null);
        break;
      case 'force_generate_with_prompt': {
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
          return NextResponse.json(
            { error: 'force_generate_with_prompt requires a non-empty prompt string' },
            { status: 400 }
          );
        }
        // Generate image directly with the operator-supplied prompt
        const result = await imageGenerator.generateWithCustomPrompt(
          prompt.trim(),
          fallbackManager,
          sseBroker
        );
        // Broadcast image_ready so the projection display updates
        sseBroker.broadcast({
          type: 'image_ready',
          data: {
            servedPath: result.servedPath,
            emotion: result.emotion,
            isFallback: result.isFallback,
            chunkId: result.chunkId,
          },
          timestamp: Date.now(),
        });
        return NextResponse.json({ ok: true, result });
      }
      case 'conference_start':
        orchestrator.conferenceStart();
        console.log('[Control] Conference mode started');
        break;
      case 'conference_stop': {
        const type = outputType === 'video' ? 'video' : 'image';
        orchestrator.conferenceEnd();
        // Fire-and-forget: let it run without holding the HTTP response
        orchestrator.generateConferenceResult(type).catch((err) =>
          console.error('[Control] Conference generate error:', err)
        );
        return NextResponse.json({ ok: true, status: 'generating', outputType: type });
      }
      case 'set_capture_mode': {
        if (mode) {
           sseBroker.broadcast({ type: 'control', data: { cmd: 'set_capture_mode', mode }, timestamp: Date.now() });
        }
        break;
      }
    }

    return NextResponse.json({
      ok: true,
      state: orchestrator.getState(),
      stats: orchestrator.getStats(),
    });
  } catch (error: unknown) {
    console.error('[Control API] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
