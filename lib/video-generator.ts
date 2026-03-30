// lib/video-generator.ts — OpenAI Sora (Videos API) wrapper with async polling
import fs from 'fs';
import path from 'path';
import type { EmotionResult } from '@/types';
import { buildImagePrompt, IMAGE_SYSTEM_CONTEXT } from './prompt-templates';
import { sseBroker } from './sse-broker';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface VideoResult {
  localPath: string;             // /tmp/ai-exp-cache/vid_<uuid>.mp4
  servedPath: string;            // /api/video/<filename>
  prompt: string;
  emotion: EmotionResult['emotion'];
  chunkId: string;
  latencyMs: number;
  durationSeconds: number;
}

class VideoGenerator {
  private apiKey: string;
  private cacheDir: string;
  private baseUrl = 'https://api.openai.com/v1';
  private model = 'sora-2';
  private defaultDuration = '16';        // 4 | 8 | 12 | 16 | 20
  private defaultSize = '1920x1080';     // landscape for projection

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.cacheDir = process.env.CACHE_DIR || '/tmp/ai-exp-cache';
    this.ensureCacheDir();
  }

  /**
   * Generate a video from an emotion result (used in conference mode).
   * This is async: submit → poll → download → return local path.
   */
  async generate(
    emotion: EmotionResult,
    transcript?: string,
    chunkId?: string,
  ): Promise<VideoResult> {
    const id = chunkId || `vid_${Date.now()}`;
    const startTime = Date.now();

    // Build the same rich prompt we use for DALL-E, adapted for video
    const basePrompt = buildImagePrompt(emotion, transcript);
    const fullPrompt = `${IMAGE_SYSTEM_CONTEXT}\n\n${basePrompt}\n\nCreate a cinematic slow-motion video instead of a still image. Camera should slowly drift or orbit. Include particle effects: floating water droplets, mist, snow. The scene should feel alive and breathing.`;

    // Broadcast prompt
    sseBroker.broadcast({
      type: 'prompt_ready',
      data: { prompt: fullPrompt, chunkId: id },
      timestamp: Date.now(),
    });

    console.log(`[VideoGenerator] Submitting job to Sora API (${this.model}, ${this.defaultDuration}s, ${this.defaultSize})`);

    // ─── STEP 1: Submit generation job ──────────────────────────────
    const submitRes = await fetch(`${this.baseUrl}/videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        prompt: fullPrompt,
        size: this.defaultSize,
        n: 1,
      }),
    });

    if (!submitRes.ok) {
      const errBody = await submitRes.text();
      throw new Error(`Sora API submit failed (${submitRes.status}): ${errBody}`);
    }

    const submitData = await submitRes.json() as { id: string; status: string };
    const videoId = submitData.id;
    console.log(`[VideoGenerator] Job submitted: ${videoId} (status: ${submitData.status})`);

    // ─── STEP 2: Poll for completion ────────────────────────────────
    const maxPollTime = 5 * 60 * 1000; // 5 minute timeout
    const pollInterval = 10_000;        // 10 seconds
    const pollStart = Date.now();
    let status = submitData.status;
    let progress = 0;

    while (status !== 'completed' && status !== 'failed') {
      if (Date.now() - pollStart > maxPollTime) {
        throw new Error(`Sora video generation timed out after ${maxPollTime / 1000}s`);
      }

      await sleep(pollInterval);

      const pollRes = await fetch(`${this.baseUrl}/videos/${videoId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });

      if (!pollRes.ok) {
        console.warn(`[VideoGenerator] Poll error (${pollRes.status}), retrying...`);
        continue;
      }

      const pollData = await pollRes.json() as { status: string; progress?: number; error?: string };
      status = pollData.status;
      progress = pollData.progress ?? progress;

      // Broadcast progress to clients
      const eventType = 'video_progress';
      sseBroker.broadcast({
        type: eventType,
        data: { videoId, status, progress, chunkId: id },
        timestamp: Date.now(),
      });

      console.log(`[VideoGenerator] Poll: status=${status}, progress=${progress}%`);

      if (status === 'failed') {
        throw new Error(`Sora video generation failed: ${pollData.error || 'unknown error'}`);
      }
    }

    // ─── STEP 3: Download the video ─────────────────────────────────
    console.log(`[VideoGenerator] Downloading video content...`);
    const contentRes = await fetch(`${this.baseUrl}/videos/${videoId}/content`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });

    if (!contentRes.ok) {
      throw new Error(`Failed to download video: ${contentRes.status} ${contentRes.statusText}`);
    }

    const arrayBuffer = await contentRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = `vid_${id}_${Date.now()}.mp4`;
    const localPath = path.join(this.cacheDir, filename);
    fs.writeFileSync(localPath, buffer);

    const latencyMs = Date.now() - startTime;
    console.log(`[VideoGenerator] Video saved: ${localPath} (${buffer.length} bytes, ${latencyMs}ms total)`);

    return {
      localPath,
      servedPath: `/api/video/${filename}`,
      prompt: fullPrompt,
      emotion: emotion.emotion,
      chunkId: id,
      latencyMs,
      durationSeconds: parseInt(this.defaultDuration, 10),
    };
  }

  private ensureCacheDir(): void {
    try {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    } catch (err) {
      console.error(`[VideoGenerator] Failed to create cache dir:`, err);
    }
  }
}

// Singleton using globalThis pattern
const globalForVideoGen = globalThis as unknown as { videoGenerator: VideoGenerator };
export const videoGenerator =
  globalForVideoGen.videoGenerator ?? new VideoGenerator();
if (process.env.NODE_ENV !== 'production')
  globalForVideoGen.videoGenerator = videoGenerator;
