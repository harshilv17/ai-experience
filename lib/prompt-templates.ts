// lib/prompt-templates.ts — All AI prompt strings live here
import type { EmotionClass, EmotionResult } from '@/types';

// ─── WHISPER PROMPT ────────────────────────────────────────────────────────
export const WHISPER_PROMPT =
  'Conference audience reflection, emotional discussion, personal sharing, English speech.';

// ─── GPT-4o EMOTION ANALYZER SYSTEM PROMPT ─────────────────────────────────
export const EMOTION_ANALYZER_SYSTEM_PROMPT = `You are an emotion analysis engine for a live conference art installation. Your task is to classify the emotional content of transcribed speech.

EMOTION CLASSES (pick exactly one):
- Hope: optimism, aspiration, belief in positive outcomes
- Fear: anxiety, dread, apprehension about the future
- Grief: loss, sadness, mourning, longing
- Anger: frustration, outrage, indignation, resentment
- Renewal: rebirth, fresh starts, transformation, recovery

SCORING:
- score: integer 0–100 representing emotional intensity
  - 0 = completely neutral, no emotional content detected
  - 50 = moderate emotional expression
  - 100 = extreme emotional intensity

KEYWORDS:
- Extract 3 to 5 single evocative keywords that capture the emotional essence
- Keywords should be single words, not phrases

SAFETY:
- Set safe to false if ANY profanity, hate speech, slurs, threats, or harmful content is detected
- Otherwise set safe to true

You MUST respond ONLY with valid JSON. No preamble, no markdown fences, no explanation.

Required JSON schema:
{
  "emotion": "Hope" | "Fear" | "Grief" | "Anger" | "Renewal",
  "score": <number 0-100>,
  "keywords": ["word1", "word2", "word3"],
  "safe": <boolean>
}`;

// ─── DALL-E 3 EMOTION STYLE PROMPTS ────────────────────────────────────────
export const EMOTION_STYLE_PROMPTS: Record<EmotionClass, string> = {
  Hope: 'Warm golden light breaking through storm clouds, rays of amber and soft gold, ethereal mist, upward movement, expansive sky, painterly impressionist style',
  Fear: 'Dark labyrinthine corridors, deep shadow with cold blue-gray highlights, jagged angular forms, unsettling perspective, fog, psychological tension',
  Grief: 'Still water reflecting a fading dusk, muted earth tones, gentle rain, willow branches, soft blurred edges, melancholic and tender atmosphere',
  Anger: 'Explosive crimson fractal eruptions, sharp jagged geometric shards, high contrast red-orange against near-black, kinetic energy, chaos',
  Renewal: 'Fresh spring greens and whites, new growth pushing through soil, clean geometric lines, sunrise palette, clarity, forward motion',
};

// ─── BUILD DALL-E 3 PROMPT ─────────────────────────────────────────────────
export function buildImagePrompt(result: EmotionResult): string {
  const styleBase = EMOTION_STYLE_PROMPTS[result.emotion];
  const keywords = result.safe
    ? result.keywords.join(', ')
    : 'abstract, neutral, calm';

  return `${styleBase}. Visual themes: ${keywords}. Emotional intensity: ${result.score}/100 — reflect this in visual drama. Style: abstract expressionism, cinematic composition, 4K ultra-detailed. STRICT RULES: No text, no letters, no human faces, no logos, no UI elements.`;
}
