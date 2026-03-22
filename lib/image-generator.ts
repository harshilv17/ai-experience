// lib/image-generator.ts — DALL-E 3 wrapper with rate limiting, caching, and fallback
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import type { EmotionResult, ImageResult } from '@/types';
import { buildImagePrompt, IMAGE_SYSTEM_CONTEXT } from './prompt-templates';
import { FallbackManager } from './fallback-manager';
import { sseBroker } from './sse-broker';

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
    this.rateLimitMs = parseInt(process.env.IMAGE_RATE_LIMIT_MS || '5000', 10);
    this.maxRetries = parseInt(process.env.MAX_API_RETRIES || '2', 10);
    this.retryBackoffMs = parseInt(process.env.RETRY_BACKOFF_MS || '2000', 10);
    this.ensureCacheDir();
  }

  async generate(
    emotion: EmotionResult,
    fallbackManager: FallbackManager,
    transcript?: string
  ): Promise<ImageResult> {
    const basePrompt = buildImagePrompt(emotion, transcript);
    const fullPrompt = `${IMAGE_SYSTEM_CONTEXT}\n\n${basePrompt}`;

    // V2: Broadcast prompt_ready before calling DALL-E API (Section 4)
    sseBroker.broadcast({
      type: 'prompt_ready',
      data: { prompt: fullPrompt, chunkId: emotion.chunkId },
      timestamp: Date.now(),
    });

    return this._generateWithPrompt(fullPrompt, emotion.emotion, emotion.chunkId, fallbackManager);
  }

  // Operator override: generate image using a fully custom prompt string
  async generateWithCustomPrompt(
    customPrompt: string,
    fallbackManager: FallbackManager,
    broker: typeof sseBroker
  ): Promise<ImageResult> {
    const chunkId = `operator_${Date.now()}`;

    broker.broadcast({
      type: 'prompt_ready',
      data: { prompt: customPrompt, chunkId },
      timestamp: Date.now(),
    });

    return this._generateWithPrompt(customPrompt, 'Renewal', chunkId, fallbackManager);
  }

  private async _generateWithPrompt(
    fullPrompt: string,
    emotion: EmotionResult['emotion'],
    chunkId: string,
    fallbackManager: FallbackManager
  ): Promise<ImageResult> {
    const startTime = Date.now();

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
          prompt: fullPrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        });

        const remoteUrl = response.data?.[0]?.url;
        if (!remoteUrl) {
          throw new Error('DALL-E 3 returned no URL');
        }

        // Download and cache locally
        const filename = `img_${chunkId}_${Date.now()}.png`;
        const localPath = path.join(this.cacheDir, filename);
        await this.downloadImage(remoteUrl, localPath);

        this.lastGenTime = Date.now();
        const latencyMs = Date.now() - startTime;

        return {
          remoteUrl,
          localPath,
          servedPath: `/api/image/${filename}`,
          prompt: fullPrompt,
          emotion,
          isFallback: false,
          chunkId,
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

    const fallbackPath = fallbackManager.getPoolImage(emotion);
    if (!fallbackPath) {
      // No fallback images available — broadcast an api_error so the client
      // can show a message, but do NOT throw. Return a sentinel result.
      sseBroker.broadcast({
        type: 'api_error',
        data: { api: 'dalle3', error: 'DALL-E rate limit hit and no fallback images available yet. Generate at least one image first, or add fallback images to public/fallback/<emotion>/.' },
        timestamp: Date.now(),
      });
      return {
        remoteUrl: '',
        localPath: '',
        servedPath: '',
        prompt: fullPrompt,
        emotion,
        isFallback: true,
        chunkId,
        latencyMs: Date.now() - startTime,
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
      prompt: fullPrompt,
      emotion,
      isFallback: true,
      chunkId,
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
