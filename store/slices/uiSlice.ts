import { StateCreator } from 'zustand';
import type { AppState, PipelinePhase, EmotionClass } from '@/types';

export interface UiSlice {
  pipelinePhase: PipelinePhase;
  currentImagePath: string | null;
  currentEmotion: EmotionClass | null;
  currentScore: number | null;
  currentKeywords: string[];
  floatingKeywords: string[];
  currentTranscript: string;
  showOverlay: boolean;
  liveTranscript: string;
  liveImagePrompt: string;
  poeticLine: string | null;
  liveEmotionJSON: string | null;
  displayStartedAt: number | null;
  pendingPromptData: { transcript: string; keywords: string[]; emotion: EmotionClass; score: number } | null;

  setPipelinePhase: (phase: PipelinePhase) => void;
  setDisplayStartedAt: (ts: number | null) => void;
  clearDisplayStartedAt: () => void;
  setPendingPromptData: (data: { transcript: string; keywords: string[]; emotion: EmotionClass; score: number } | null) => void;
  transitionToShowingPrompt: () => void;
  clearPendingPrompt: () => void;
  setCurrentImage: (path: string, emotion: EmotionClass, isFallback: boolean) => void;
  setCurrentEmotion: (emotion: EmotionClass, score: number, keywords: string[]) => void;
  setTranscript: (text: string, words: string[]) => void;
  setShowOverlay: (show: boolean) => void;
  setLiveTranscript: (t: string) => void;
  setLiveImagePrompt: (p: string) => void;
  setPoeticLine: (line: string | null) => void;
  setLiveEmotionJSON: (json: string | null) => void;
}

const OVERLAY_DURATION_MS = parseInt(process.env.NEXT_PUBLIC_OVERLAY_DURATION_MS || '4000', 10);

// Minimum clean display time before next cycle UI is allowed to appear
const MIN_IMAGE_DISPLAY_MS = parseInt(process.env.NEXT_PUBLIC_MIN_IMAGE_DISPLAY_MS || '18000', 10);
/** Alias for useSSE — min time to show image before next cycle's prompt/keywords */
export const DISPLAY_HOLD_MS = MIN_IMAGE_DISPLAY_MS;

// Module-level vars — NOT reactive Zustand state (just timer handles)
let displayLockTimer: ReturnType<typeof setTimeout> | null = null;
let imageDisplayedAt: number | null = null;

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set, get) => ({
  pipelinePhase: 'idle',
  currentImagePath: null,
  currentEmotion: null,
  currentScore: null,
  currentKeywords: [],
  floatingKeywords: [],
  currentTranscript: '',
  showOverlay: false,
  liveTranscript: '',
  liveImagePrompt: '',
  poeticLine: null,
  liveEmotionJSON: null,
  displayStartedAt: null,
  pendingPromptData: null,

  setDisplayStartedAt: (ts) => set({ displayStartedAt: ts }),
  clearDisplayStartedAt: () => set({ displayStartedAt: null }),
  setPendingPromptData: (data) => set({ pendingPromptData: data }),

  transitionToShowingPrompt: () => {
    const { pendingPromptData } = get();
    if (pendingPromptData) {
      set({
        pipelinePhase: 'showing_prompt',
        floatingKeywords: pendingPromptData.keywords,
        currentTranscript: pendingPromptData.transcript,
        currentEmotion: pendingPromptData.emotion,
        currentScore: pendingPromptData.score,
        currentKeywords: pendingPromptData.keywords,
        pendingPromptData: null,
        showOverlay: true,
      });
    } else {
      set({ pipelinePhase: 'showing_prompt', showOverlay: true });
    }
  },

  clearPendingPrompt: () => set({ pendingPromptData: null }),

  setPipelinePhase: (phase) => {
    const currentPhase = get().pipelinePhase;

    // DISPLAY LOCK: when an image is on screen, block listening/processing for 17s
    if (
      currentPhase === 'displaying' &&
      imageDisplayedAt &&
      (phase === 'listening' || phase === 'processing')
    ) {
      const elapsed = Date.now() - imageDisplayedAt;
      const remaining = MIN_IMAGE_DISPLAY_MS - elapsed;

      if (remaining > 0) {
        // Cancel any earlier pending transition; later phases win
        if (displayLockTimer) clearTimeout(displayLockTimer);

        displayLockTimer = setTimeout(() => {
          displayLockTimer = null;
          // Only fire if still in 'displaying' — a new image may have arrived
          if (get().pipelinePhase === 'displaying') {
            set({ pipelinePhase: phase });
          }
        }, remaining);

        return; // Block immediate update
      }
    }

    // Cancel the lock when a new image arrives or session stops
    if (phase === 'revealing' || phase === 'idle') {
      if (displayLockTimer) {
        clearTimeout(displayLockTimer);
        displayLockTimer = null;
      }
    }

    set({ pipelinePhase: phase });
  },

  setCurrentImage: (path, _emotion, _isFallback) => {
    // New image arriving — cancel any pending display-lock timer
    if (displayLockTimer) {
      clearTimeout(displayLockTimer);
      displayLockTimer = null;
    }

    set({
      currentImagePath: path,
      pipelinePhase: 'revealing',
      showOverlay: true,
      floatingKeywords: [],
      pendingPromptData: null,
    });

    // Crossfade takes ~2.2s — mark 'displaying' once it settles
    setTimeout(() => {
      const now = Date.now();
      imageDisplayedAt = now;
      set({ pipelinePhase: 'displaying', displayStartedAt: now });
    }, 2200);

    // Emotion badge overlay visible for OVERLAY_DURATION_MS then hides
    setTimeout(() => {
      set({ showOverlay: false });
    }, OVERLAY_DURATION_MS);
  },

  setCurrentEmotion: (emotion, score, keywords) => {
    // Store data immediately (control panel reads it right away)
    set({
      currentEmotion: emotion,
      currentScore: score,
      currentKeywords: keywords,
      floatingKeywords: keywords,
      // showOverlay intentionally NOT set — overlay fires in setCurrentImage
    });
    // Phase change goes through the display-lock gate
    get().setPipelinePhase('processing');
  },

  setTranscript: (text, words) => {
    set({
      currentTranscript: text,
      floatingKeywords: words,
    });
    // Phase change goes through the display-lock gate
    get().setPipelinePhase('processing');
  },

  setShowOverlay: (show) => set({ showOverlay: show }),
  setLiveTranscript: (t) => set({ liveTranscript: t }),
  setLiveImagePrompt: (p) => set({ liveImagePrompt: p }),
  setPoeticLine: (line) => set({ poeticLine: line }),
  setLiveEmotionJSON: (json) => set({ liveEmotionJSON: json }),
});
