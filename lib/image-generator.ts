// lib/image-generator.ts — DALL-E 3 wrapper with rate limiting, caching, and fallback
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import type { EmotionResult, ImageResult } from '@/types';
import { buildImagePrompt } from './prompt-templates';
import type { FallbackManager } from './fallback-manager';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class ImageGenerator {
  private client: OpenAI;
  private lastGenTime: number = 0;
  private cacheDir: string;
  private rateLimitMs: number;
  private maxRetries: number;
  private retryBackoffMs: number;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.cacheDir = process.env.CACHE_DIR || '/tmp/ai-exp-cache';
    this.rateLimitMs = parseInt(process.env.IMAGE_RATE_LIMIT_MS || '20000', 10);
    this.maxRetries = parseInt(process.env.MAX_API_RETRIES || '2', 10);
    this.retryBackoffMs = parseInt(process.env.RETRY_BACKOFF_MS || '2000', 10);
    this.ensureCacheDir();
  }

  async generate(
    emotion: EmotionResult,
    fallbackManager: FallbackManager
  ): Promise<ImageResult> {
    const startTime = Date.now();
    const prompt = buildImagePrompt(emotion);

    // ─── RATE LIMIT LOGIC ──────────────────────────────────
    const timeSinceLast = Date.now() - this.lastGenTime;
    if (timeSinceLast < this.rateLimitMs) {
      const waitMs = this.rateLimitMs - timeSinceLast;
      console.log(`[ImageGenerator] Rate limiting: waiting ${waitMs}ms`);
      await sleep(waitMs);
    }

    // ─── GENERATION WITH RETRY ─────────────────────────────
    let lastError: unknown = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        console.log(
          `[ImageGenerator] Generating image (attempt ${attempt + 1}/${this.maxRetries})`
        );

        const response = await this.client.images.generate({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1792x1024',
          quality: 'standard',
        });

        const remoteUrl = response.data[0]?.url;
        if (!remoteUrl) {
          throw new Error('DALL-E 3 returned no URL');
        }

        // Download and cache locally
        const filename = `img_${emotion.chunkId}_${Date.now()}.png`;
        const localPath = path.join(this.cacheDir, filename);
        await this.downloadImage(remoteUrl, localPath);

        this.lastGenTime = Date.now();
        const latencyMs = Date.now() - startTime;

        return {
          remoteUrl,
          localPath,
          servedPath: `/api/image/${filename}`,
          prompt,
          emotion: emotion.emotion,
          isFallback: false,
          chunkId: emotion.chunkId,
          latencyMs,
        };
      } catch (error: unknown) {
        lastError = error;
        console.error(
          `[ImageGenerator] Attempt ${attempt + 1} failed:`,
          error instanceof Error ? error.message : error
        );
        if (attempt < this.maxRetries - 1) {
          await sleep(this.retryBackoffMs);
        }
      }
    }

    // ─── FALLBACK ──────────────────────────────────────────
    console.warn(
      `[ImageGenerator] All retries exhausted, falling back. Last error:`,
      lastError instanceof Error ? lastError.message : lastError
    );

    const fallbackPath = fallbackManager.getPoolImage(emotion.emotion);
    if (!fallbackPath) {
      throw {
        code: 'NO_FALLBACK_AVAILABLE',
        message: 'All generation retries exhausted and no fallback images available',
        chunkId: emotion.chunkId,
      };
    }

    const latencyMs = Date.now() - startTime;

    // For fallback images from public/fallback, serve them via their public path
    const publicIndex = fallbackPath.indexOf('public/');
    const servedPath =
      publicIndex >= 0
        ? '/' + fallbackPath.slice(publicIndex + 'public/'.length)
        : `/api/image/${path.basename(fallbackPath)}`;

    return {
      remoteUrl: '',
      localPath: fallbackPath,
      servedPath,
      prompt,
      emotion: emotion.emotion,
      isFallback: true,
      chunkId: emotion.chunkId,
      latencyMs,
    };
  }

  private async downloadImage(url: string, destPath: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);
    console.log(`[ImageGenerator] Cached image: ${destPath} (${buffer.length} bytes)`);
  }

  ensureCacheDir(): void {
    try {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    } catch (err) {
      console.error(`[ImageGenerator] Failed to create cache dir:`, err);
    }
  }
}

// Singleton using globalThis pattern
const globalForGenerator = globalThis as unknown as { imageGenerator: ImageGenerator };
export const imageGenerator =
  globalForGenerator.imageGenerator ?? new ImageGenerator();
if (process.env.NODE_ENV !== 'production')
  globalForGenerator.imageGenerator = imageGenerator;

// Re-export the class type for use in other modules
export type { ImageGenerator };
