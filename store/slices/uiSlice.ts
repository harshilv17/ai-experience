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

  setPipelinePhase: (phase: PipelinePhase) => void;
  setCurrentImage: (path: string, emotion: EmotionClass, isFallback: boolean) => void;
  setCurrentEmotion: (emotion: EmotionClass, score: number, keywords: string[]) => void;
  setTranscript: (text: string, words: string[]) => void;
  setShowOverlay: (show: boolean) => void;
  setLiveTranscript: (t: string) => void;
  setLiveImagePrompt: (p: string) => void;
  setPoeticLine: (line: string | null) => void;
  setLiveEmotionJSON: (json: string | null) => void;
}

const OVERLAY_DURATION_MS = parseInt(process.env.NEXT_PUBLIC_OVERLAY_DURATION_MS || '3000', 10);

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set) => ({
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

  setPipelinePhase: (phase) => set({ pipelinePhase: phase }),

  setCurrentImage: (path, emotion, _isFallback) => {
    set({
      currentImagePath: path,
      pipelinePhase: 'revealing',
      showOverlay: true,
    });
    setTimeout(() => {
      set({ pipelinePhase: 'displaying' });
    }, 2000);
    setTimeout(() => {
      set({ showOverlay: false });
    }, OVERLAY_DURATION_MS);
  },

  setCurrentEmotion: (emotion, score, keywords) => {
    set({
      currentEmotion: emotion,
      currentScore: score,
      currentKeywords: keywords,
      floatingKeywords: keywords,
      pipelinePhase: 'processing',
      showOverlay: true,
    });
  },

  setTranscript: (text, words) => {
    set({
      currentTranscript: text,
      floatingKeywords: words,
      pipelinePhase: 'processing',
    });
  },

  setShowOverlay: (show) => set({ showOverlay: show }),
  setLiveTranscript: (t) => set({ liveTranscript: t }),
  setLiveImagePrompt: (p) => set({ liveImagePrompt: p }),
  setPoeticLine: (line) => set({ poeticLine: line }),
  setLiveEmotionJSON: (json) => set({ liveEmotionJSON: json }),
});
