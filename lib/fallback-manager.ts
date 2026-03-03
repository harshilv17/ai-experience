// lib/fallback-manager.ts — Pre-seeded fallback image pool
import fs from 'fs';
import path from 'path';
import type { EmotionClass } from '@/types';

const EMOTIONS: EmotionClass[] = ['Hope', 'Fear', 'Grief', 'Anger', 'Renewal'];

export class FallbackManager {
  private pool: Map<EmotionClass, string[]> = new Map();
  private counters: Map<EmotionClass, number> = new Map();
  private fallbackDir: string;

  constructor(fallbackDir: string) {
    this.fallbackDir = fallbackDir;
    this.scanFallbackDirectories();
  }

  private scanFallbackDirectories(): void {
    for (const emotion of EMOTIONS) {
      const dirPath = path.join(this.fallbackDir, emotion.toLowerCase());
      const images: string[] = [];

      try {
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
              images.push(path.join(dirPath, file));
            }
          }
        } else {
          console.warn(`[FallbackManager] Directory not found: ${dirPath}`);
        }
      } catch (err) {
        console.warn(`[FallbackManager] Error scanning ${dirPath}:`, err);
      }

      this.pool.set(emotion, images);
      this.counters.set(emotion, 0);

      if (images.length > 0) {
        console.log(`[FallbackManager] Loaded ${images.length} fallback images for ${emotion}`);
      }
    }
  }

  getPoolImage(emotion: EmotionClass): string | null {
    // Try requested emotion first
    const emotionPool = this.pool.get(emotion) ?? [];
    if (emotionPool.length > 0) {
      const counter = this.counters.get(emotion) ?? 0;
      const image = emotionPool[counter % emotionPool.length];
      this.counters.set(emotion, counter + 1);
      return image;
    }

    // Fallback: try ANY emotion pool
    for (const e of EMOTIONS) {
      const pool = this.pool.get(e) ?? [];
      if (pool.length > 0) {
        const counter = this.counters.get(e) ?? 0;
        const image = pool[counter % pool.length];
        this.counters.set(e, counter + 1);
        return image;
      }
    }

    // Pool is completely empty
    return null;
  }

  addToPool(emotion: EmotionClass, localPath: string): void {
    const pool = this.pool.get(emotion) ?? [];
    pool.push(localPath);

    // Cap at 20 entries per emotion (remove oldest when over limit)
    if (pool.length > 20) {
      pool.splice(0, pool.length - 20);
    }

    this.pool.set(emotion, pool);
    console.log(`[FallbackManager] Added to ${emotion} pool (size: ${pool.length})`);
  }

  getPoolSize(): Record<EmotionClass, number> {
    const sizes: Record<string, number> = {};
    for (const emotion of EMOTIONS) {
      sizes[emotion] = (this.pool.get(emotion) ?? []).length;
    }
    return sizes as Record<EmotionClass, number>;
  }
}

// Singleton using globalThis pattern
const globalForFallback = globalThis as unknown as { fallbackManager: FallbackManager };
export const fallbackManager =
  globalForFallback.fallbackManager ??
  new FallbackManager(
    path.join(process.cwd(), process.env.FALLBACK_IMAGE_DIR || 'public/fallback')
  );
if (process.env.NODE_ENV !== 'production')
  globalForFallback.fallbackManager = fallbackManager;
