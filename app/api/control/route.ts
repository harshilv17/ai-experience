// app/api/control/route.ts — Operator commands
import { NextResponse } from 'next/server';
import { orchestrator } from '@/lib/orchestrator';
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
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cmd } = body as { cmd: ControlCommand };

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
