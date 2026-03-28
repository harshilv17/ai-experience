// app/api/health/route.ts — API health check
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const results: Record<string, string> = {
    whisper: 'unknown',
    gpt4o: 'unknown',
    dalle3: 'unknown',
    sora: 'unknown',
    timestamp: String(Date.now()),
  };

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'sk-proj-replace-me') {
    results.whisper = 'no_api_key';
    results.gpt4o = 'no_api_key';
    results.dalle3 = 'no_api_key';
    results.sora = 'no_api_key';
    return NextResponse.json(results);
  }

  const client = new OpenAI({ apiKey });

  // Test GPT-4o — simple completion with minimal tokens
  try {
    await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Say OK' }],
      max_tokens: 5,
    });
    results.gpt4o = 'ok';
  } catch (error: unknown) {
    results.gpt4o = 'error';
    console.error('[Health] GPT-4o check failed:', error instanceof Error ? error.message : error);
  }

  // Test Whisper — just verify the API key works via models list
  // (Don't send actual audio — too expensive for a health check)
  try {
    await client.models.retrieve('whisper-1');
    results.whisper = 'ok';
  } catch (error: unknown) {
    results.whisper = 'error';
    console.error('[Health] Whisper check failed:', error instanceof Error ? error.message : error);
  }

  // Test DALL-E 3 — verify via model retrieval (don't generate — too expensive)
  try {
    await client.models.retrieve('dall-e-3');
    results.dalle3 = 'ok';
  } catch (error: unknown) {
    results.dalle3 = 'error';
    console.error('[Health] DALL-E check failed:', error instanceof Error ? error.message : error);
  }

  // Test Sora — verify via model retrieval
  try {
    await client.models.retrieve('sora-2');
    results.sora = 'ok';
  } catch (error: unknown) {
    results.sora = 'error';
    console.error('[Health] Sora check failed:', error instanceof Error ? error.message : error);
  }

  return NextResponse.json(results);
}
