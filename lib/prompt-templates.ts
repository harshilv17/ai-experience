// lib/prompt-templates.ts — All AI prompt strings live here
import type { EmotionClass, EmotionResult } from '@/types';

// ─── WHISPER PROMPT ────────────────────────────────────────────────────────
export const WHISPER_PROMPT =
  'Storytelling audience sharing personal reflections about nature, mythology, water, mountains, Himalayan folklore, spiritual experience. English speech.';

// ─── GPT-4o EMOTION ANALYZER SYSTEM PROMPT ─────────────────────────────────
export const EMOTION_ANALYZER_SYSTEM_PROMPT = `You are an emotion analysis engine for a live storytelling art installation themed around Himalayan water spirits. Your task is to classify the emotional content of transcribed speech.

EMOTION CLASSES (pick exactly one):
- Hope: optimism, aspiration, belief in positive outcomes, warmth, light
- Fear: anxiety, dread, apprehension, the unknown, deep waters
- Grief: loss, sadness, mourning, longing, fading memories
- Anger: frustration, outrage, indignation, destructive forces
- Renewal: rebirth, fresh starts, transformation, spring thaw, new growth

SCORING:
- score: integer 0–100 representing emotional intensity
  - 0 = completely neutral, no emotional content detected
  - 50 = moderate emotional expression
  - 100 = extreme emotional intensity

KEYWORDS:
- Extract 3 to 5 single evocative keywords that capture the emotional essence
- Prefer nature/water/mountain imagery words when relevant (river, glacier, mist, peak, moon)
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

// ─── HIMALAYAN WATER SPIRIT BASE CONTEXT ───────────────────────────────────
const HIMALAYAN_BASE =
  'A mystical Himalayan water spirit, sacred glacier river, glowing luminescent water energy, misty snow-capped mountains, spiritual folklore aesthetic, cinematic lighting, ultra-detailed fantasy art';

// ─── DALL-E 3 EMOTION STYLE PROMPTS (HIMALAYAN THEMED) ─────────────────────
export const EMOTION_STYLE_PROMPTS: Record<EmotionClass, string> = {
  Hope: `${HIMALAYAN_BASE}, warm golden sunrise breaking over Himalayan peaks, the water spirit radiates amber and gold light, sacred rivers flowing upward with hope, prayer flags catching dawn wind, ethereal mist parting to reveal glacial blue sky, uplifting and transcendent`,
  Fear: `${HIMALAYAN_BASE}, deep cavern beneath a frozen glacier, the water spirit watches from dark depths with cold blue-white eyes, jagged ice formations, moonless night, unsettling shadows in the mist, the unknown lurking beneath sacred waters, psychological tension and awe`,
  Grief: `${HIMALAYAN_BASE}, a water spirit weeping into a still mountain lake at dusk, muted indigo and silver tones, fading light reflecting on glacial water, willow-like tendrils of luminous water trailing away, melancholic atmosphere, gentle snowfall, tender and contemplative`,
  Anger: `${HIMALAYAN_BASE}, a wrathful water spirit commanding a raging glacial river, explosive crimson and deep blue energy, jagged mountains splitting, torrential rapids with supernatural force, storm clouds and lightning over Himalayan peaks, raw untamed power`,
  Renewal: `${HIMALAYAN_BASE}, spring thaw releasing a reborn water spirit from glacial ice, fresh turquoise and emerald light, new wildflowers growing through snow, crystal clear mountain streams, sunrise palette, clean geometric ice patterns breaking apart into flowing water, forward motion and transformation`,
};

// ─── BUILD DALL-E 3 PROMPT ─────────────────────────────────────────────────
export function buildImagePrompt(result: EmotionResult): string {
  const styleBase = EMOTION_STYLE_PROMPTS[result.emotion];
  const keywords = result.safe
    ? result.keywords.join(', ')
    : 'abstract, neutral, calm';

  return `${styleBase}. Visual themes woven into the scene: ${keywords}. Emotional intensity: ${result.score}/100 — reflect this in the drama of the water and light. Style: mythological fantasy art, cinematic composition, 4K ultra-detailed. STRICT RULES: No text, no letters, no human faces, no logos, no UI elements, no words.`;
}
