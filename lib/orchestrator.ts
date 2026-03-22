// lib/orchestrator.ts — Central pipeline singleton (V2: chunk queue, watchdog, poetic moment)
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
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
  PoeticMomentEvent,
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

  // V2: Chunk queue (max depth 1)
  private chunkQueue: AudioChunk | null = null;
  private isProcessing: boolean = false;

  // V2: Watchdog timer per cycle
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private watchdogChunkId: string | null = null;

  // Conference mode: accumulate transcripts
  private conferenceChunks: string[] = [];
  private conferenceChunkIndex: number = 0;


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

  // V2: Clear watchdog timer
  private clearWatchdog(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
      this.watchdogChunkId = null;
    }
  }

  // V2: Start watchdog timer for a cycle
  private startWatchdog(chunkId: string, emotion: EmotionResult): void {
    this.clearWatchdog();
    this.watchdogChunkId = chunkId;
    this.watchdogTimer = setTimeout(() => {
      if (this.watchdogChunkId === chunkId) {
        console.warn(`[Orchestrator] Watchdog triggered — forcing fallback`);
        const fallbackPath = fallbackManager.getPoolImage(emotion.emotion);
        if (fallbackPath) {
          const publicIndex = fallbackPath.indexOf('public/');
          const servedPath =
            publicIndex >= 0
              ? '/' + fallbackPath.slice(publicIndex + 'public/'.length)
              : `/api/image/${path.basename(fallbackPath)}`;

          this.broadcastEvent<ImageReadyEvent>('image_ready', {
            servedPath,
            emotion: emotion.emotion,
            isFallback: true,
            chunkId,
          });
          this.fallbackCount++;
        }
        this.watchdogTimer = null;
        this.watchdogChunkId = null;
      }
    }, 60000);
  }

  // ─── MAIN ENTRY POINT ──────────────────────────────────────────────────

  async processChunk(chunk: AudioChunk): Promise<CycleResult> {
    // Guard: not live (includes idle, paused)
    if (this.state !== 'live' && this.state !== 'processing') {
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

    // V2: If already processing, queue the chunk (max depth 1, drop older)
    if (this.isProcessing) {
      console.log(`[Orchestrator] Already processing — queuing chunk ${chunk.chunkId.slice(0, 8)}`);
      this.chunkQueue = chunk; // overwrites any previously queued chunk
      return {
        chunkId: chunk.chunkId,
        status: 'skipped',
        skipReason: 'queued',
        totalLatencyMs: 0,
        apiLatencies: {},
        timestamp: Date.now(),
      };
    }

    return this.executeChunk(chunk);
  }

  private async executeChunk(chunk: AudioChunk): Promise<CycleResult> {
    // Begin processing
    this.isProcessing = true;
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

      // Broadcast transcript immediately so client can show floating keywords
      // while GPT-4o + DALL-E are still working (reduces perceived latency)
      const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'it', 'i', 'we', 'he', 'she', 'they', 'you', 'my', 'our', 'this', 'that', 'with', 'from', 'by', 'as', 'be', 'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'not', 'no', 'so', 'if', 'then', 'than', 'just', 'also', 'very', 'really', 'about', 'like', 'some', 'all', 'any', 'each', 'every', 'been', 'being', 'its', 'their', 'there', 'here', 'what', 'when', 'where', 'which', 'who', 'how', 'more', 'most', 'other', 'into', 'over', 'after', 'before', 'between', 'through', 'during', 'up', 'down', 'out', 'off', 'only', 'own', 'same', 'too', 'much', 'many', 'such', 'well', 'back', 'still', 'even', 'get', 'got', 'make', 'made', 'take', 'took', 'come', 'came', 'go', 'went', 'say', 'said', 'know', 'knew', 'think', 'thought', 'see', 'saw', 'want', 'us', 'me']);
      const words = transcript.text
        .split(/\s+/)
        .map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase())
        .filter(w => w.length > 2 && !stopWords.has(w))
        .filter((w, i, arr) => arr.indexOf(w) === i)
        .slice(0, 12);

      this.broadcastEvent('transcript_ready', {
        text: transcript.text,
        words,
        chunkId: chunk.chunkId,
      });
    } catch (error: unknown) {
      this.apiStatus.whisper = 'error';
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Orchestrator] Whisper error:`, message);
      this.broadcastEvent('api_error', { api: 'whisper', error: message });

      this.finishProcessing();
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

      // V2 Section 10: Poetic Moment detection
      const wordCount = transcript.text.trim().split(/\s+/).length;
      if (emotionResult.score >= 80 && wordCount <= 12) {
        this.broadcastEvent<PoeticMomentEvent>('poetic_moment', {
          text: transcript.text,
          emotion: emotionResult.emotion,
        });
        console.log(`[Orchestrator] Poetic moment detected: "${transcript.text}"`);
      }

      // V2 Section 6: Start watchdog timer after transcript_ready
      console.log("hiii");


      this.startWatchdog(chunk.chunkId, emotionResult);

    } catch (error: unknown) {
      this.apiStatus.gpt4o = 'error';
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Orchestrator] GPT-4o error:`, message);
      this.broadcastEvent('api_error', { api: 'gpt4o', error: message });

      this.finishProcessing();
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
      imageResult = await imageGenerator.generate(emotionResult, fallbackManager, transcript.text);
      this.apiStatus.dalle3 = imageResult.isFallback ? this.apiStatus.dalle3 : 'ok';
      apiLatencies.dalle3 = imageResult.latencyMs;

      // Add successfully generated images to fallback pool
      if (!imageResult.isFallback) {
        fallbackManager.addToPool(emotionResult.emotion, imageResult.localPath);
      } else {
        this.fallbackCount++;
      }

      // V2: Clear watchdog — image arrived successfully
      this.clearWatchdog();

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

      this.clearWatchdog();
      this.finishProcessing();
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

    // Broadcast cycle complete
    this.broadcastEvent<CycleCompleteEvent>('cycle_complete', {
      result,
      stats: this.getStats(),
    });

    console.log(`[Orchestrator] Cycle complete: ${result.status} (${totalLatencyMs}ms total)`);

    // V2: Finish processing and check queue
    this.finishProcessing();

    return result;
  }

  // V2: Finish processing and drain queue
  private finishProcessing(): void {
    this.isProcessing = false;
    if (this.liveMode) {
      this.state = 'live';
    } else {
      this.state = 'idle';
    }
    this.broadcastStateChange();

    // Drain queue: if a chunk is waiting, process it
    if (this.chunkQueue && this.liveMode) {
      const nextChunk = this.chunkQueue;
      this.chunkQueue = null;
      console.log(`[Orchestrator] Draining queue — processing chunk ${nextChunk.chunkId.slice(0, 8)}`);
      // Fire-and-forget: don't await, let it run independently
      this.executeChunk(nextChunk).catch((err) => {
        console.error(`[Orchestrator] Queued chunk failed:`, err);
      });
    }
  }

  // ─── CONTROL METHODS ───────────────────────────────────────────────────

  setLiveMode(on: boolean): void {
    if (on) {
      this.state = 'live';
      this.liveMode = true;
    } else {
      this.state = 'idle';
      this.liveMode = false;
      this.chunkQueue = null; // V2: clear queue on stop
      this.clearWatchdog();
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

  // ─── CONFERENCE MODE ───────────────────────────────────────────────────────

  /** Signal clients that conference listening has started */
  conferenceStart(): void {
    this.broadcastEvent('pipeline_phase', { phase: 'listening' });
    this.conferenceChunks = [];
    this.conferenceChunkIndex = 0;
    console.log('[Orchestrator] Conference started');
  }

  /** Signal clients that conference listening has ended */
  conferenceEnd(): void {
    this.broadcastEvent('pipeline_phase', { phase: 'idle' });
    console.log('[Orchestrator] Conference ended');
  }

  /** Transcribe one audio chunk in conference mode — no emotion/image pipeline */
  async processConferenceChunk(chunk: AudioChunk): Promise<void> {
    try {
      if (this.conferenceChunks.length === 0) {
        this.conferenceStart();
      }

      const transcript = await transcriptionService.transcribe(chunk);
      this.apiStatus.whisper = 'ok';

      if (!transcript.text.trim()) return;

      this.conferenceChunks.push(transcript.text);
      this.conferenceChunkIndex++;

      // Extract displayable words (same stop-word logic as main pipeline)
      const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'it', 'i', 'we', 'he', 'she', 'they', 'you', 'my', 'our', 'this', 'that', 'with', 'from', 'by', 'as', 'be', 'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'not', 'no', 'so', 'if', 'then', 'than', 'just', 'also', 'very', 'really', 'about', 'like', 'some', 'all', 'any', 'each', 'every', 'been', 'being', 'its', 'their', 'there', 'here', 'what', 'when', 'where', 'which', 'who', 'how', 'more', 'most', 'other', 'into', 'over', 'after', 'before', 'between', 'through', 'during', 'up', 'down', 'out', 'off', 'only', 'own', 'same', 'too', 'much', 'many', 'such', 'well', 'back', 'still', 'even', 'get', 'got', 'make', 'made', 'take', 'took', 'come', 'came', 'go', 'went', 'say', 'said', 'know', 'knew', 'think', 'thought', 'see', 'saw', 'want', 'us', 'me']);
      const words = transcript.text
        .split(/\s+/)
        .map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase())
        .filter(w => w.length > 2 && !stopWords.has(w))
        .filter((w, i, arr) => arr.indexOf(w) === i)
        .slice(0, 12);

      this.broadcastEvent('conference_transcript_chunk', {
        partialText: transcript.text,
        words,
        chunkIndex: this.conferenceChunkIndex,
      });

      console.log(`[Orchestrator] Conference chunk ${this.conferenceChunkIndex}: "${transcript.text.slice(0, 80)}..."`);
    } catch (error: unknown) {
      this.apiStatus.whisper = 'error';
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Orchestrator] Conference transcription error:`, message);
      this.broadcastEvent('api_error', { api: 'whisper', error: message });
    }
  }

  /** Merge all buffered transcripts and run full pipeline → image or video */
  async generateConferenceResult(outputType: 'image' | 'video'): Promise<void> {
    if (this.conferenceChunks.length === 0) {
      console.warn('[Orchestrator] generateConferenceResult called with no chunks');
      return;
    }

    const fullTranscript = this.conferenceChunks.join(' ');
    console.log(`[Orchestrator] Conference generate (${outputType}): ${this.conferenceChunks.length} chunks, ${fullTranscript.length} chars`);

    // Broadcast generating state
    this.broadcastEvent('conference_generating', { outputType });

    // Build a synthetic AudioChunk for transcription result
    const chunkId = uuidv4();

    try {
      // Run emotion analysis on the full transcript
      const syntheticTranscript = {
        text: fullTranscript,
        language: 'en',
        durationSeconds: this.conferenceChunks.length * 15,
        chunkId,
        latencyMs: 0,
      };

      const emotionResult = await emotionAnalyzer.analyze(syntheticTranscript);
      this.apiStatus.gpt4o = 'ok';
      this.lastEmotion = emotionResult;

      this.broadcastEvent('emotion_ready', {
        emotion: emotionResult.emotion,
        score: emotionResult.score,
        keywords: emotionResult.keywords,
        chunkId,
      });

      if (outputType === 'video') {
        // Video generation is stubbed — generate image first, then broadcast
        // When a real video API is wired up, replace this block.
        console.log('[Orchestrator] Video generation stub — generating still image instead');
      }

      // Generate image (used for both image and video stub)
      const imageResult = await imageGenerator.generate(emotionResult, fallbackManager, fullTranscript);

      if (!imageResult.isFallback) {
        fallbackManager.addToPool(emotionResult.emotion, imageResult.localPath);
      }

      // Only broadcast if we actually have an image to show
      if (imageResult.servedPath) {
        this.broadcastEvent('conference_result', {
          servedPath: imageResult.servedPath,
          outputType,
          emotion: emotionResult.emotion,
          score: emotionResult.score,
          fullTranscript,
        });

        // Also broadcast image_ready so the projection display shows it
        this.broadcastEvent('image_ready', {
          servedPath: imageResult.servedPath,
          emotion: imageResult.emotion,
          isFallback: imageResult.isFallback,
          chunkId,
        });

        console.log(`[Orchestrator] Conference result: ${imageResult.servedPath}`);
      } else {
        console.warn('[Orchestrator] Conference result: no image generated (fallback pool empty)');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Orchestrator] Conference generate error:`, message);
      this.broadcastEvent('api_error', { api: 'dalle3', error: message });
    } finally {
      // Clear conference buffer
      this.conferenceChunks = [];
      this.conferenceChunkIndex = 0;
    }
  }

  async forceGenerate(lastEmotion: EmotionResult | null): Promise<void> {
    const emotion = lastEmotion ?? this.lastEmotion ?? {
      emotion: 'Renewal' as const,
      score: 50,
      keywords: ['glacier', 'mountain', 'flowing', 'sacred', 'water'],
      safe: true,
      chunkId: uuidv4(),
      latencyMs: 0,
    };

    console.log(`[Orchestrator] Force generating with emotion: ${emotion.emotion}`);

    // Broadcast chunk_started so the UI enters "listening" phase
    this.broadcastEvent('chunk_started', { chunkId: emotion.chunkId });

    // Small delay so the user sees the "listening" animation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Broadcast emotion_ready so floating keywords appear
    this.broadcastEvent<EmotionReadyEvent>('emotion_ready', {
      emotion: emotion.emotion,
      score: emotion.score,
      keywords: emotion.keywords,
      chunkId: emotion.chunkId,
    });

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
