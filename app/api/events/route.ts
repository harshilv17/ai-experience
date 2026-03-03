// app/api/events/route.ts — SSE stream endpoint
import { sseBroker } from '@/lib/sse-broker';
import { orchestrator } from '@/lib/orchestrator';
import type { SystemEvent, StateChangeEvent } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  const clientId = crypto.randomUUID();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      sseBroker.addClient(clientId, controller);

      // Send initial connection confirmation immediately
      const connectEvent: SystemEvent<StateChangeEvent> = {
        type: 'state_change',
        data: {
          state: orchestrator.getState(),
          liveMode: orchestrator.getLiveMode(),
        },
        timestamp: Date.now(),
      };

      try {
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(connectEvent)}\n\n`)
        );
      } catch {
        sseBroker.removeClient(clientId);
      }
    },
    cancel() {
      sseBroker.removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
