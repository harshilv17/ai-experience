// lib/emotion-analyzer.ts — GPT-4o structured emotion output with Zod validation
import OpenAI from 'openai';
import { z } from 'zod';
import type { TranscriptResult, EmotionResult } from '@/types';
import { EMOTION_ANALYZER_SYSTEM_PROMPT } from './prompt-templates';

// Strict Zod schema for GPT-4o output validation
const emotionSchema = z.object({
  emotion: z.enum(['Hope', 'Fear', 'Grief', 'Anger', 'Renewal']),
  score: z.number().min(0).max(100),
  keywords: z.array(z.string()).min(3).max(8),
  safe: z.boolean(),
});

class EmotionAnalyzer {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async analyze(transcript: TranscriptResult): Promise<EmotionResult> {
    const startTime = Date.now();

    // Guard: transcript too short
    if (transcript.text.trim().length < 10) {
      throw { code: 'TRANSCRIPT_TOO_SHORT', message: 'Transcript is too short for analysis' };
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 200,
        messages: [
          { role: 'system', content: EMOTION_ANALYZER_SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this speech: "${transcript.text}"` },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw { code: 'EMPTY_RESPONSE', message: 'GPT-4o returned empty content' };
      }

      // Parse and validate JSON response
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw {
          code: 'JSON_PARSE_ERROR',
          message: `Failed to parse GPT-4o response as JSON: ${content.slice(0, 200)}`,
        };
      }

      const validated = emotionSchema.parse(parsed);
      const latencyMs = Date.now() - startTime;

      // Handle unsafe content — redact keywords, neutralize score
      if (!validated.safe) {
        console.warn(`[EmotionAnalyzer] Unsafe content detected in chunk ${transcript.chunkId}`);
        return {
          emotion: validated.emotion,
          score: 0,
          keywords: ['[content filtered]'],
          safe: false,
          chunkId: transcript.chunkId,
          latencyMs,
        };
      }

      return {
        emotion: validated.emotion,
        score: validated.score,
        keywords: validated.keywords,
        safe: validated.safe,
        chunkId: transcript.chunkId,
        latencyMs,
      };
    } catch (error: unknown) {
      // If it's already a typed error from above, re-throw
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      // Zod validation error
      if (error instanceof z.ZodError) {
        throw {
          code: 'SCHEMA_INVALID',
          message: `GPT-4o response failed schema validation: ${error.message}`,
          chunkId: transcript.chunkId,
        };
      }

      const message = error instanceof Error ? error.message : 'Unknown GPT-4o error';
      throw {
        code: 'GPT4O_ERROR',
        message,
        chunkId: transcript.chunkId,
      };
    }
  }
}

// Singleton using globalThis pattern
const globalForAnalyzer = globalThis as unknown as { emotionAnalyzer: EmotionAnalyzer };
export const emotionAnalyzer =
  globalForAnalyzer.emotionAnalyzer ?? new EmotionAnalyzer();
if (process.env.NODE_ENV !== 'production')
  globalForAnalyzer.emotionAnalyzer = emotionAnalyzer;
