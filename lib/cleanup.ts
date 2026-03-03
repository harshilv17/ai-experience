// lib/cleanup.ts — Graceful shutdown handler
import fs from 'fs';
import path from 'path';
import { sseBroker } from './sse-broker';

function gracefulShutdown(signal: string): void {
  console.log(`\n[Cleanup] Received ${signal}. Shutting down gracefully...`);

  // 1. Broadcast state change to idle
  sseBroker.broadcast({
    type: 'state_change',
    data: { state: 'idle', liveMode: false },
    timestamp: Date.now(),
  });

  // 2. Clean up temp cache files older than 24 hours
  const cacheDir = process.env.CACHE_DIR || '/tmp/ai-exp-cache';
  try {
    if (fs.existsSync(cacheDir)) {
      const files = fs.readdirSync(cacheDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(cacheDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs > maxAge) {
            fs.unlinkSync(filePath);
            console.log(`[Cleanup] Removed old cache file: ${file}`);
          }
        } catch {
          // Skip files we can't stat/delete
        }
      }
    }
  } catch (err) {
    console.error('[Cleanup] Error cleaning cache:', err);
  }

  console.log('[Cleanup] Shutdown complete');
  process.exit(0);
}

// Register handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export { gracefulShutdown };
