# AI Experience — Real-Time Generative AI Visual Installation

A **production-ready, audience-driven generative AI visual installation** for live conferences. Captures audio from a roaming wireless mic, classifies emotion, and generates abstract art projected in real-time.

## Quick Start

```bash
cd ai-experience
npm install
cp .env.example .env.local
# Edit .env.local — add your OPENAI_API_KEY
mkdir -p /tmp/ai-exp-cache
npm run dev
```

## How to Use During Event

1. Open **http://localhost:3000** on the PROJECTION laptop → set to fullscreen (**F11**)
2. Open **http://localhost:3000/control** on the OPERATOR device (tablet/laptop)
3. Select the USB wireless mic receiver in the **Mic Picker** dropdown
4. Click **[TEST API HEALTH]** → wait for all green
5. Click **[LIVE ON]** → the system starts automatically
6. Speak into the microphone → first image appears in ~15 seconds
7. To stop: click **[LIVE OFF]** or close the browser

## Pre-Event Checklist

- [ ] Laptop plugged into power (2+ hours of operation)
- [ ] `OPENAI_API_KEY` is set and valid in `.env.local`
- [ ] USB wireless mic receiver plugged in and selected in Mic Picker
- [ ] Test API Health — all 3 services show ● OK
- [ ] Projector connected, resolution set to 1920×1080 or wider
- [ ] Browser window on projector set to fullscreen (F11)
- [ ] Control panel open on operator tablet/laptop
- [ ] Run Test Mode for 5 minutes to seed fallback images
- [ ] Verify crossfade is smooth (no flashing)
- [ ] Internet connection stable (hotel/venue WiFi or hotspot)

## Seeding Fallback Images

```bash
# Start the dev server, enable Test Mode in the control panel,
# and let it run for 5 minutes. This generates ~15 images that
# auto-populate the fallback pool.

# For permanent fallbacks, copy generated images to:
#   public/fallback/hope/
#   public/fallback/fear/
#   public/fallback/grief/
#   public/fallback/anger/
#   public/fallback/renewal/
# (5 images per emotion recommended)
```

## Environment Variables Reference

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | **Required.** OpenAI API key |
| `STABILITY_API_KEY` | — | Optional Stability AI key |
| `IMAGE_PROVIDER` | `dalle3` | `dalle3` or `stability` |
| `CHUNK_DURATION_MS` | `30000` | Audio chunk duration in ms |
| `MIN_SPEECH_SECONDS` | `6` | Skip cycle if speech < this (seconds) |
| `IMAGE_RATE_LIMIT_MS` | `20000` | Minimum ms between image generations |
| `MAX_API_RETRIES` | `2` | Retries before triggering fallback |
| `RETRY_BACKOFF_MS` | `2000` | Delay between retries |
| `CACHE_DIR` | `/tmp/ai-exp-cache` | Where generated images are cached |
| `FALLBACK_IMAGE_DIR` | `public/fallback` | Pre-seeded fallback image directory |
| `ENABLE_EMOTION_OVERLAY` | `true` | Show emotion/keyword overlay |
| `OVERLAY_DURATION_MS` | `3000` | How long overlay is visible |
| `NEXT_PUBLIC_DISPLAY_HOLD_MS` | `18000` | Min time (ms) to show image only before next cycle’s keywords (15–20s) |
| `PROFANITY_FILTER` | `true` | Filter unsafe content |

## Architecture Overview

The system uses a **3-layer architecture**:

1. **Client Layer** (Browser): Audio capture + VAD, fullscreen projection with crossfade, operator control panel. Communicates via HTTP POST (audio upload, commands) and SSE (real-time state updates).

2. **API Layer** (Next.js Routes): Stateless HTTP endpoints that validate input and delegate to the service layer. SSE endpoint keeps connections open for real-time event broadcast.

3. **Service Layer** (Singletons): `ChunkOrchestrator` drives the pipeline. `TranscriptionService`, `EmotionAnalyzer`, `ImageGenerator`, and `FallbackManager` each wrap a specific concern. `SSEBroker` manages all client connections. All singletons use the `globalThis` pattern to survive Next.js hot reloads.

```
Audio In → VAD → Whisper → GPT-4o → DALL-E 3 → Crossfade → Projector
                    ↓           ↓           ↓
                 SSE Broadcast to Control Panel
```

## Test Mode

Toggle Test Mode in the control panel to cycle through 5 predefined transcripts (one per emotion) without a microphone. Useful for:
- Seeding the fallback image pool pre-event
- Verifying the full pipeline end-to-end
- Testing with different OpenAI API configurations

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS 3.x |
| State | Zustand 4.x |
| Validation | Zod 3.x |
| AI | OpenAI SDK 4.x (Whisper, GPT-4o, DALL-E 3) |
| IDs | uuid 9.x |
