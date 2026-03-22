// lib/prompt-templates.ts — All AI prompt strings live here
import type { EmotionResult } from '@/types';

// ─── WHISPER PROMPT ────────────────────────────────────────────────────────
export const WHISPER_PROMPT =
  'Storytelling audience sharing personal reflections about nature, mythology, water, mountains, Himalayan folklore, spiritual experience. English speech.';

// ─── GPT-4o EMOTION ANALYZER SYSTEM PROMPT ─────────────────────────────────
export const EMOTION_ANALYZER_SYSTEM_PROMPT = `You are an emotion analysis engine for a live storytelling art installation titled 'ACT 2: Birth of the Water Spirit'. Your task is to extract emotional, visual, and symbolic text tokens from transcribed audience reflections about Himalayan water systems.

EMOTION CLASSES (pick the dominant one):
- Hope: optimism, flowing, protected, restored, shared
- Fear: anxiety, melting, drying, turbulent
- Grief: loss, disappearing ice, mourning
- Anger: frustration, destructive forces, wasteful cities
- Renewal: rebirth, fresh starts, transformation

SCORING:
- score: integer 0–100 representing emotional intensity

KEYWORDS (Extract 5 to 8 single words total):
CRITICAL: At least 4 keywords MUST be exact words spoken in the transcript. Do NOT invent generic words like "fresh", "open", "new", "hope", "change" unless the speaker literally said them.
Extract the most interesting, specific, and vivid nouns, verbs, and adjectives from the speech.
Priority order:
1. Unique nouns the speaker used (glacier, river, grandmother, village, ceremony, etc.)
2. Vivid verbs (melting, flowing, crumbling, protecting, etc.)
3. Descriptive adjectives (sacred, ancient, turbulent, fragile, etc.)
4. Only if needed, add 1-2 emotional/symbolic tokens
Do NOT use generic filler words. Every keyword should feel specific to what the speaker actually said.
Ensure exactly 5 to 8 single words.

SAFETY:
- Set safe to false if ANY profanity, hate speech, slurs, or harmful content is detected

You MUST respond ONLY with valid JSON. No preamble.
{
  "emotion": "Hope" | "Fear" | "Grief" | "Anger" | "Renewal",
  "score": <number 0-100>,
  "keywords": ["word1", "word2", "word3", "word4", "word5"],
  "safe": <boolean>
}`;

// ─── IMAGE GENERATION SYSTEM CONTEXT (META PROMPT) ──────────────────────────
export const IMAGE_SYSTEM_CONTEXT = `You are creating a visual manifestation of the collective emotions of an audience thinking about water, glaciers, and the Himalayan ecosystem.

The entity you create is called the "Water Spirit".

The Water Spirit is not a monster or fantasy creature. It is a symbolic environmental presence formed from rivers, glaciers, snow, clouds, and mountain light.

Its appearance reflects the emotions and concerns of people about water and climate change.

If the emotions are hopeful, the spirit appears luminous, flowing, and protective.
If the emotions are fearful or grieving, the spirit appears fragile, melting, or turbulent.

The environment must always reflect the Himalayan landscape:
snow peaks, glaciers, rivers, mist, mountain forests, alpine light.

The visual style should feel cinematic, mythic, and natural — as if the mountains themselves are alive.
The output should be visually powerful, symbolic, and emotionally resonant.
STRICT RULES: No text, no letters, no human faces, no logos, no UI elements, no words.`;

// ─── DALL-E 3 DYNAMIC PROMPT BUILDER ───────────────────────────────────────
export function buildImagePrompt(result: EmotionResult, transcript?: string): string {
  const keywords = result.safe
    ? result.keywords.join(', ')
    : 'abstract, pure water, calm';

  // Include a condensed version of the transcript (max 200 chars) for context
  const speechContext = transcript && result.safe
    ? transcript.slice(0, 200).trim()
    : '';

  let moodDescription = '';
  switch (result.emotion) {
    case 'Hope':
    case 'Renewal':
      moodDescription = 'Its form reflects hopeful intention, appearing luminous, ethereal, and fiercely protective. The water glows with vibrant turquoise and golden hour lighting. Volumetric rays of light pierce through glacial mist. The spirit flows upward like anti-gravity water, lifting gracefully toward the sky. The mood is solemn, transcendent, and highly hopeful.';
      break;
    case 'Fear':
      moodDescription = 'Its form reflects deep fear and anxiety for disappearing ice. The spirit is fragmented, caught in a swirling vortex of deep abyssal blues and stark, unsettling shadows (chiaroscuro). The water is turbulent, thrashing against jagged ice formations. The mood is tense, fragile, and awe-inspiring, reflecting climate crisis.';
      break;
    case 'Grief':
      moodDescription = 'Its form reflects profound grief for disappearing ice, appearing fragile, weeping, and slowly melting. The colors are muted silver, slate, and deep indigo twilight. Slow-moving, heavy water trails off the entity like tears. The spirit is dissolving back into the environment. The mood is delicate, melancholic, and tenderly mournful.';
      break;
    case 'Anger':
      moodDescription = 'Its form reflects roaring anger at wasteful destruction. The water is explosive, kinetic, and violently turbulent. Crimson and deep violet lighting cuts through dark storm clouds above. Lightning reflects on the shattering glacial rapids. The spirit stands tall as a towering, overwhelming wave. The mood is wrathful and untamed.';
      break;
  }

  return `--- Emotion Analysis ---
Detected Emotion: ${result.emotion}
Intensity Score: ${result.score}/100
Emotional Keywords: ${keywords}
Content Safety: ${result.safe ? 'Clean' : 'Filtered'}

Collective visual tokens: ${keywords}
Dominant emotion: ${result.emotion} (Intensity: ${result.score}/100)
${speechContext ? `\nAudience voice (verbatim): "${speechContext}"\n` : ''}
Create a visual representation of the Water Spirit emerging from the Himalayan landscape.
The spirit should appear shaped from melting glaciers and flowing rivers.
${moodDescription}
The environment should show vast snow peaks, glacial water, and soft alpine light.

Art Direction: Cinematic lighting, 8k resolution, Unreal Engine 5 render style, magical realism, hyper-detailed particle effects (floating water droplets, swirling mist, blowing snow), National Geographic landscape photography combined with high-end fantasy conceptual art.`;
}

// ─── CONFERENCE MODE PROMPT BUILDER ────────────────────────────────────────────
/** Builds a full prompt from the complete conference session transcript */
export function buildConferenceImagePrompt(result: EmotionResult, fullTranscript: string): string {
  const keywords = result.safe ? result.keywords.join(', ') : 'abstract, pure water, calm';
  // Use more of the transcript for conference mode (captures the full session)
  const speechContext = result.safe ? fullTranscript.slice(0, 500).trim() : '';

  // Build the same mood description as buildImagePrompt
  let moodDescription = '';
  switch (result.emotion) {
    case 'Hope':
    case 'Renewal':
      moodDescription = 'Its form reflects hopeful intention, appearing luminous, ethereal, and fiercely protective. The water glows with vibrant turquoise and golden hour lighting. Volumetric rays of light pierce through glacial mist. The spirit flows upward like anti-gravity water, lifting gracefully toward the sky. The mood is solemn, transcendent, and highly hopeful.';
      break;
    case 'Fear':
      moodDescription = 'Its form reflects deep fear and anxiety for disappearing ice. The spirit is fragmented, caught in a swirling vortex of deep abyssal blues and stark, unsettling shadows (chiaroscuro). The water is turbulent, thrashing against jagged ice formations. The mood is tense, fragile, and awe-inspiring, reflecting climate crisis.';
      break;
    case 'Grief':
      moodDescription = 'Its form reflects profound grief for disappearing ice, appearing fragile, weeping, and slowly melting. The colors are muted silver, slate, and deep indigo twilight. Slow-moving, heavy water trails off the entity like tears. The spirit is dissolving back into the environment. The mood is delicate, melancholic, and tenderly mournful.';
      break;
    case 'Anger':
      moodDescription = 'Its form reflects roaring anger at wasteful destruction. The water is explosive, kinetic, and violently turbulent. Crimson and deep violet lighting cuts through dark storm clouds above. Lightning reflects on the shattering glacial rapids. The spirit stands tall as a towering, overwhelming wave. The mood is wrathful and untamed.';
      break;
  }

  return `--- Full Conference Session Emotion Analysis ---
Detected Dominant Emotion: ${result.emotion}
Intensity Score: ${result.score}/100
Session Keywords: ${keywords}
Content Safety: ${result.safe ? 'Clean' : 'Filtered'}

This image captures the COLLECTIVE emotional arc of the entire conference session.
Collective visual tokens: ${keywords}
Dominant emotion across session: ${result.emotion} (Intensity: ${result.score}/100)
${speechContext ? `\nFull session transcript (condensed): "${speechContext}"\n` : ''}
Create a powerful, cinematic visual representation of the Water Spirit emerging from the Himalayan landscape — one that captures the full emotional journey of the session.
The spirit should appear shaped from melting glaciers and flowing rivers.
${moodDescription}
The environment should show vast snow peaks, glacial water, and soft alpine light.

Art Direction: Cinematic lighting, 8k resolution, Unreal Engine 5 render style, magical realism, hyper-detailed particle effects (floating water droplets, swirling mist, blowing snow), National Geographic landscape photography combined with high-end fantasy conceptual art. Extra emphasis on SCALE and GRANDEUR to reflect the full scope of the session.`;
}
