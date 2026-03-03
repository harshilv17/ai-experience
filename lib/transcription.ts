// lib/transcription.ts — Whisper API wrapper
import OpenAI, { toFile } from 'openai';
import type { AudioChunk, TranscriptResult } from '@/types';
import { WHISPER_PROMPT } from './prompt-templates';

class TranscriptionService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async transcribe(chunk: AudioChunk): Promise<TranscriptResult> {
    const startTime = Date.now();

    try {
      // Convert Buffer to a File object for the OpenAI API
      const file = await toFile(chunk.blob, `chunk_${chunk.chunkId}.webm`, {
        type: chunk.mimeType,
      });

      const response = await this.client.audio.transcriptions.create({
        model: 'whisper-1',
        file,
        language: 'en',
        prompt: WHISPER_PROMPT,
      });

      const latencyMs = Date.now() - startTime;

      return {
        text: response.text,
        language: 'en',
        durationSeconds: chunk.durationMs / 1000,
        chunkId: chunk.chunkId,
        latencyMs,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown Whisper error';
      throw {
        code: 'WHISPER_ERROR',
        message,
        chunkId: chunk.chunkId,
      };
    }
  }
}

// Singleton using globalThis pattern
const globalForTranscription = globalThis as unknown as {
  transcriptionService: TranscriptionService;
};
export const transcriptionService =
  globalForTranscription.transcriptionService ?? new TranscriptionService();
if (process.env.NODE_ENV !== 'production')
  globalForTranscription.transcriptionService = transcriptionService;
