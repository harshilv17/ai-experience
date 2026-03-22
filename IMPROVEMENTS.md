# Improvements: Latency, UI & Bugs

## Pipeline fix (done)

- **Bug**: After an image was generated, the previous cycle’s floating keywords stayed on screen for the next image.
- **Change**: 
  - Image is shown **without any words** for a fixed period (default **18 seconds**, configurable via `NEXT_PUBLIC_DISPLAY_HOLD_MS`).
  - When a new chunk is ready while we’re in that “image only” window, transcript/emotion are **queued** and applied only after the hold ends.
  - Flow: **Image (15–20s) → then next prompt/keywords (robot + processing) → then next image**.
- **Details**: 
  - `setCurrentImage` clears `floatingKeywords` and `currentTranscript` so nothing overlays the image.
  - `FloatingKeywords` only renders during `processing`, not during `displaying`/`revealing`.
  - `useSSE` delays `transcript_ready` and `emotion_ready` until `displayStartedAt + DISPLAY_HOLD_MS`.

---

## Latency improvements (suggestions)

1. **Whisper**
   - Use **smaller chunks** (e.g. 15–20s) so transcription starts sooner (trade-off: more API calls).
   - Ensure **webm/opus** is used; avoid re-encoding on the server.

2. **GPT-4o**
   - Use **streaming** for emotion analysis so the UI can show “thinking” earlier (would require a small API change).
   - Keep **temperature** low (e.g. 0.2) for stable, fast responses.
   - Consider **gpt-4o-mini** for a latency/quality trade-off.

3. **DALL-E 3**
   - **Rate limit** is the main bottleneck; keep `IMAGE_RATE_LIMIT_MS` (e.g. 20s) to avoid 429s.
   - **Fallback pool**: pre-seed `public/fallback/{emotion}/` with good images so fallbacks look fine when DALL-E is slow or fails.
   - **Prompt length**: slightly shorter prompts can reduce processing time.

4. **Frontend**
   - **Optimistic UI**: show “listening” / “processing” as soon as chunk is sent; no need to wait for SSE.
   - **Image preload**: when `prompt_ready` fires, preload the previous image (if any) so crossfade is smooth.

5. **Backend**
   - Run **Whisper and GPT-4o in parallel** where possible (e.g. if you split transcript into segments later).
   - **Caching**: cache emotion results for identical or near-identical transcripts (e.g. hash of normalized text).

---

## UI improvements (suggestions)

1. **Projection view**
   - **Phase indicator**: subtle label or icon for “listening” / “processing” / “revealing” / “displaying”.
   - **Display timer**: small countdown or progress bar for the 15–20s image hold.
   - **Next-up hint**: after hold ends, short “Next: …” or keyword preview before the next image appears.
   - **Crossfade**: already 1.2–2.5s; consider a short blur or scale transition for a more “cinematic” feel.

2. **Control panel**
   - **Live transcript** with optional auto-scroll and highlight of last phrase.
   - **Emotion arc**: keep the timeline; add tooltips with score and keywords.
   - **API status**: show last success time and optional “last error” expandable.
   - **Dark theme**: consistent gray-900/950 and accent colors (e.g. sky/emerald) for a cleaner look.

3. **Robot mascot**
   - **Idle**: slow breath or subtle glow when waiting.
   - **Listening**: gentle pulse or wave.
   - **Processing**: current thought cloud is good; consider a short “generating…” subline when `prompt_ready` has been sent.
   - **Revealing**: keep current flash; optionally add a short “reveal” sound or haptic.

4. **Accessibility**
   - Ensure **focus order** and keyboard use on control panel (Live On/Off, Pause, Skip, etc.).
   - **Reduced motion**: respect `prefers-reduced-motion` for animations (crossfade, keyword pop-in, robot).

5. **Polish**
   - **Font**: consider a display font for the projection (e.g. for “Poetic line” or phase labels).
   - **Sound**: optional subtle cues for phase changes (e.g. soft tone when image appears).
   - **Loading skeletons**: for control panel stats and history so the UI doesn’t jump when data arrives.

---

## Env vars for pipeline timing

- `NEXT_PUBLIC_DISPLAY_HOLD_MS` — Min time (ms) to show only the image before showing the next cycle’s prompt/keywords (default: 18000).
- `NEXT_PUBLIC_OVERLAY_DURATION_MS` — How long the overlay is shown after image appears (default: 3000).
- `MIN_SPEECH_SECONDS` — Min speech duration in a chunk to run the pipeline (default: 6).
- `IMAGE_RATE_LIMIT_MS` — Min delay between DALL-E calls (default: 20000).
