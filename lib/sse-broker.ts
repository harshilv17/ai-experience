// lib/sse-broker.ts — SSE connection manager singleton
import type { SystemEvent } from '@/types';

class SSEBroker {
  private clients: Map<string, ReadableStreamDefaultController<Uint8Array>> = new Map();
  private eventLog: SystemEvent[] = [];
  private encoder = new TextEncoder();

  addClient(clientId: string, controller: ReadableStreamDefaultController<Uint8Array>): void {
    this.clients.set(clientId, controller);
    console.log(`[SSEBroker] Client connected: ${clientId} (total: ${this.clients.size})`);
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`[SSEBroker] Client disconnected: ${clientId} (total: ${this.clients.size})`);
  }

  broadcast(event: SystemEvent): void {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    const encoded = this.encoder.encode(payload);

    const deadClients: string[] = [];

    this.clients.forEach((controller, clientId) => {
      try {
        controller.enqueue(encoded);
      } catch {
        // Dead connection — mark for removal
        deadClients.push(clientId);
      }
    });

    // Clean up dead clients
    for (const id of deadClients) {
      this.clients.delete(id);
      console.log(`[SSEBroker] Removed dead client: ${id}`);
    }

    // Append to event log (keep last 50)
    this.eventLog.push(event);
    if (this.eventLog.length > 50) {
      this.eventLog = this.eventLog.slice(-50);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getEventLog(): SystemEvent[] {
    return [...this.eventLog];
  }
}

// Singleton using globalThis pattern to survive Next.js hot reloads
const globalForBroker = globalThis as unknown as { sseBroker: SSEBroker };
export const sseBroker = globalForBroker.sseBroker ?? new SSEBroker();
if (process.env.NODE_ENV !== 'production') globalForBroker.sseBroker = sseBroker;
