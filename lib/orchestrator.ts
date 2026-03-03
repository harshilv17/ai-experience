// lib/orchestrator.ts — Central pipeline singleton
import { v4 as uuidv4 } from 'uuid';
import type {
  AudioChunk,
  OrchestratorState,
  CycleResult,
  CycleStats,
  EmotionResult,
  ApiStatusMap,
  SystemEvent,
  StateChangeEvent,
  EmotionReadyEvent,
  ImageReadyEvent,
  CycleCompleteEvent,
} from '@/types';
import { sseBroker } from './sse-broker';
import { transcriptionService } from './transcription';
import { emotionAnalyzer } from './emotion-analyzer';
import { imageGenerator } from './image-generator';
import { fallbackManager } from './fallback-manager';

class ChunkOrchestrator {
  private state: OrchestratorState = 'idle';
  private liveMode: boolean = false;
  private totalCycles: number = 0;
  private completedCycles: number = 0;
  private skippedCycles: number = 0;
  private fallbackCount: number = 0;
  private latencyHistory: number[] = [];
  private lastEmotion: EmotionResult | null = null;
  private apiStatus: ApiStatusMap = {
    whisper: 'unknown',
    gpt4o: 'unknown',
    dalle3: 'unknown',
  };

  // ─── HELPERS ────────────────────────────────────────────────────────────

  private broadcastEvent<T>(type: SystemEvent<T>['type'], data: T): void {
    sseBroker.broadcast({
      type,
      data,
      timestamp: Date.now(),
    });
  }

  private broadcastStateChange(): void {
    this.broadcastEvent<StateChangeEvent>('state_change', {
      state: this.state,
      liveMode: this.liveMode,
    });
  }

  // ─── MAIN ENTRY POINT ──────────────────────────────────────────────────

  async processChunk(chunk: AudioChunk): Promise<CycleResult> {
    // Guard: not live
    if (this.state !== 'live') {
      this.skippedCycles++;
      return {
        chunkId: chunk.chunkId,
        status: 'skipped',
        skipReason: 'not_live',
        totalLatencyMs: 0,
        apiLatencies: {},
        timestamp: Date.now(),
      };
    }

    // Guard: already processing
    if (this.state === 'processing') {
      this.skippedCycles++;
      return {
        chunkId: chunk.chunkId,
        status: 'skipped',
        skipReason: 'busy',
        totalLatencyMs: 0,
        apiLatencies: {},
        timestamp: Date.now(),
      };
    }

    // Begin processing
    this.state = 'processing';
    this.totalCycles++;
    this.broadcastStateChange();

    const startTime = Date.now();
    const apiLatencies: Record<string, number> = {};

    this.broadcastEvent('chunk_started', { chunkId: chunk.chunkId });

    // ─── STEP A: Transcription ──────────────────────────────────────────
    let transcript;
    try {
      transcript = await transcriptionService.transcribe(chunk);
      this.apiStatus.whisper = 'ok';
      apiLatencies.whisper = transcript.latencyMs;
      console.log(`[Orchestrator] Transcript: "${transcript.text.slice(0, 100)}..." (${transcript.latencyMs}ms)`);
    } catch (error: unknown) {
      this.apiStatus.whisper = 'error';
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Orchestrator] Whisper error:`, message);
      this.broadcastEvent('api_error', { api: 'whisper', error: message });

      this.state = 'live';
      this.broadcastStateChange();
      return {
        chunkId: chunk.chunkId,
        status: 'error',
        skipReason: 'whisper_error',
        totalLatencyMs: Date.now() - startTime,
        apiLatencies,
        timestamp: Date.now(),
      };
    }

    // ─── STEP B: Emotion Analysis ───────────────────────────────────────
    let emotionResult: EmotionResult;
    try {
      emotionResult = await emotionAnalyzer.analyze(transcript);
      this.apiStatus.gpt4o = 'ok';
      apiLatencies.gpt4o = emotionResult.latencyMs;
      this.lastEmotion = emotionResult;

      // Broadcast emotion immediately
      this.broadcastEvent<EmotionReadyEvent>('emotion_ready', {
        emotion: emotionResult.emotion,
        score: emotionResult.score,
        keywords: emotionResult.keywords,
        chunkId: emotionResult.chunkId,
      });

      console.log(
        `[Orchestrator] Emotion: ${emotionResult.emotion} (${emotionResult.score}) [${emotionResult.keywords.join(', ')}] (${emotionResult.latencyMs}ms)`
      );
    } catch (error: unknown) {
      this.apiStatus.gpt4o = 'error';
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Orchestrator] GPT-4o error:`, message);
      this.broadcastEvent('api_error', { api: 'gpt4o', error: message });

      this.state = 'live';
      this.broadcastStateChange();
      return {
        chunkId: chunk.chunkId,
        status: 'error',
        skipReason: 'gpt4o_error',
        transcript,
        totalLatencyMs: Date.now() - startTime,
        apiLatencies,
        timestamp: Date.now(),
      };
    }

    // ─── STEP C: Image Generation ───────────────────────────────────────
    let imageResult;
    try {
      imageResult = await imageGenerator.generate(emotionResult, fallbackManager);
      this.apiStatus.dalle3 = imageResult.isFallback ? this.apiStatus.dalle3 : 'ok';
      apiLatencies.dalle3 = imageResult.latencyMs;

      // Add successfully generated images to fallback pool
      if (!imageResult.isFallback) {
        fallbackManager.addToPool(emotionResult.emotion, imageResult.localPath);
      } else {
        this.fallbackCount++;
      }

      // Broadcast image ready
      this.broadcastEvent<ImageReadyEvent>('image_ready', {
        servedPath: imageResult.servedPath,
        emotion: imageResult.emotion,
        isFallback: imageResult.isFallback,
        chunkId: imageResult.chunkId,
      });

      console.log(
        `[Orchestrator] Image: ${imageResult.servedPath} (fallback: ${imageResult.isFallback}) (${imageResult.latencyMs}ms)`
      );
    } catch (error: unknown) {
      this.apiStatus.dalle3 = 'error';
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Orchestrator] Image generation error:`, message);
      this.broadcastEvent('api_error', { api: 'dalle3', error: message });

      this.state = 'live';
      this.broadcastStateChange();
      return {
        chunkId: chunk.chunkId,
        status: 'error',
        skipReason: 'image_error',
        transcript,
        emotion: emotionResult,
        totalLatencyMs: Date.now() - startTime,
        apiLatencies,
        timestamp: Date.now(),
      };
    }

    // ─── FINALIZE ───────────────────────────────────────────────────────
    const totalLatencyMs = Date.now() - startTime;
    this.completedCycles++;

    // Update latency history (keep last 10)
    this.latencyHistory.push(totalLatencyMs);
    if (this.latencyHistory.length > 10) {
      this.latencyHistory = this.latencyHistory.slice(-10);
    }

    const result: CycleResult = {
      chunkId: chunk.chunkId,
      status: imageResult.isFallback ? 'fallback' : 'complete',
      transcript,
      emotion: emotionResult,
      image: imageResult,
      totalLatencyMs,
      apiLatencies,
      timestamp: Date.now(),
    };

    // Back to live
    this.state = 'live';
    this.broadcastStateChange();

    // Broadcast cycle complete
    this.broadcastEvent<CycleCompleteEvent>('cycle_complete', {
      result,
      stats: this.getStats(),
    });

    console.log(`[Orchestrator] Cycle complete: ${result.status} (${totalLatencyMs}ms total)`);
    return result;
  }

  // ─── CONTROL METHODS ───────────────────────────────────────────────────

  setLiveMode(on: boolean): void {
    if (on) {
      this.state = 'live';
      this.liveMode = true;
    } else {
      this.state = 'idle';
      this.liveMode = false;
    }
    this.broadcastStateChange();
    console.log(`[Orchestrator] Live mode: ${on ? 'ON' : 'OFF'}`);
  }

  pause(): void {
    this.state = 'paused';
    this.broadcastStateChange();
    console.log(`[Orchestrator] Paused`);
  }

  resume(): void {
    this.state = 'live';
    this.broadcastStateChange();
    console.log(`[Orchestrator] Resumed`);
  }

  skip(): void {
    this.skippedCycles++;
    this.broadcastEvent('cycle_skipped', { reason: 'operator_skip' });
    console.log(`[Orchestrator] Cycle skipped by operator`);
  }

  async forceGenerate(lastEmotion: EmotionResult | null): Promise<void> {
    const emotion = lastEmotion ?? this.lastEmotion ?? {
      emotion: 'Renewal' as const,
      score: 50,
      keywords: ['fresh', 'open', 'new'],
      safe: true,
      chunkId: uuidv4(),
      latencyMs: 0,
    };

    console.log(`[Orchestrator] Force generating with emotion: ${emotion.emotion}`);

    try {
      const imageResult = await imageGenerator.generate(emotion, fallbackManager);

      if (!imageResult.isFallback) {
        fallbackManager.addToPool(emotion.emotion, imageResult.localPath);
      } else {
        this.fallbackCount++;
      }

      this.broadcastEvent<ImageReadyEvent>('image_ready', {
        servedPath: imageResult.servedPath,
        emotion: imageResult.emotion,
        isFallback: imageResult.isFallback,
        chunkId: imageResult.chunkId,
      });
    } catch (error: unknown) {
      console.error(`[Orchestrator] Force generate failed:`, error);
      this.broadcastEvent('api_error', {
        api: 'dalle3',
        error: error instanceof Error ? error.message : 'Force generate failed',
      });
    }
  }

  getStats(): CycleStats {
    const avgLatencyMs =
      this.latencyHistory.length > 0
        ? Math.round(
            this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length
          )
        : 0;

    return {
      totalCycles: this.totalCycles,
      completedCycles: this.completedCycles,
      skippedCycles: this.skippedCycles,
      fallbackCount: this.fallbackCount,
      avgLatencyMs,
      lastCycleLatencyMs:
        this.latencyHistory.length > 0
          ? this.latencyHistory[this.latencyHistory.length - 1]
          : 0,
      lastEmotion: this.lastEmotion?.emotion ?? null,
      lastScore: this.lastEmotion?.score ?? null,
      apiStatus: { ...this.apiStatus },
    };
  }

  getState(): OrchestratorState {
    return this.state;
  }

  getLiveMode(): boolean {
    return this.liveMode;
  }

  getLastEmotion(): EmotionResult | null {
    return this.lastEmotion;
  }
}

// Singleton using globalThis pattern
const globalForOrchestrator = globalThis as unknown as { orchestrator: ChunkOrchestrator };
export const orchestrator =
  globalForOrchestrator.orchestrator ?? new ChunkOrchestrator();
if (process.env.NODE_ENV !== 'production')
  globalForOrchestrator.orchestrator = orchestrator;
