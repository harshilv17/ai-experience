// store/appStore.ts — Zustand global state store
import { create } from 'zustand';
import type {
  AppState,
  OrchestratorState,
  PipelinePhase,
  EmotionClass,
  ApiStatusMap,
  ApiStatus,
  CycleResult,
  EmotionHistoryEntry,
} from '@/types';

const OVERLAY_DURATION_MS = parseInt(process.env.NEXT_PUBLIC_OVERLAY_DURATION_MS || '3000', 10);

export const useAppStore = create<AppState>((set, get) => ({
  // ─── Orchestrator ────────────────────────────────────────
  orchestratorState: 'idle',
  liveMode: false,

  // ─── Pipeline phase ──────────────────────────────────────
  pipelinePhase: 'idle',

  // ─── Current display ────────────────────────────────────
  currentImagePath: null,
  currentEmotion: null,
  currentScore: null,
  currentKeywords: [],

  // ─── Floating keywords (Mentimeter) ─────────────────────
  floatingKeywords: [],
  currentTranscript: '',

  // ─── Stats ──────────────────────────────────────────────
  stats: {
    totalCycles: 0,
    completedCycles: 0,
    skippedCycles: 0,
    fallbackCount: 0,
    avgLatencyMs: 0,
    lastCycleLatencyMs: 0,
    lastEmotion: null,
    lastScore: null,
    apiStatus: { whisper: 'unknown', gpt4o: 'unknown', dalle3: 'unknown' },
  },

  // ─── UI ─────────────────────────────────────────────────
  showOverlay: false,
  testMode: false,
  selectedMicDeviceId: null,

  // ─── History ────────────────────────────────────────────
  cycleHistory: [],

  // ─── V2 State ──────────────────────────────────────────
  liveTranscript: '',
  liveImagePrompt: '',
  emotionHistory: [],
  sessionKeywords: [],
  consecutiveSameEmotion: 0,
  poeticLine: null,
  liveEmotionJSON: null,

  // ─── Actions ────────────────────────────────────────────
  setOrchestratorState: (state: OrchestratorState) => set({ orchestratorState: state }),

  setLiveMode: (live: boolean) => set({ liveMode: live }),

  setPipelinePhase: (phase: PipelinePhase) => set({ pipelinePhase: phase }),

  setCurrentImage: (path: string, emotion: EmotionClass, _isFallback: boolean) => {
    set({
      currentImagePath: path,
      pipelinePhase: 'revealing',
      showOverlay: true,
    });
    // Transition to displaying after reveal animation
    setTimeout(() => {
      set({ pipelinePhase: 'displaying' });
    }, 2000);
    // Auto-hide overlay after duration
    setTimeout(() => {
      set({ showOverlay: false });
    }, OVERLAY_DURATION_MS);
  },

  setCurrentEmotion: (emotion: EmotionClass, score: number, keywords: string[]) => {
    set({
      currentEmotion: emotion,
      currentScore: score,
      currentKeywords: keywords,
      floatingKeywords: keywords,
      pipelinePhase: 'processing',
      showOverlay: true,
    });
  },

  setTranscript: (text: string, words: string[]) => {
    set({
      currentTranscript: text,
      floatingKeywords: words,
      pipelinePhase: 'processing',
    });
  },

  updateStats: (result: CycleResult) => {
    const prev = get().stats;
    const totalCycles = prev.totalCycles + 1;
    const completedCycles = result.status === 'complete' ? prev.completedCycles + 1 : prev.completedCycles;
    const skippedCycles = result.status === 'skipped' ? prev.skippedCycles + 1 : prev.skippedCycles;
    const fallbackCount = result.image?.isFallback ? prev.fallbackCount + 1 : prev.fallbackCount;
    const lastCycleLatencyMs = result.totalLatencyMs;

    // Compute running average
    const prevTotal = prev.avgLatencyMs * prev.totalCycles;
    const avgLatencyMs = totalCycles > 0 ? (prevTotal + result.totalLatencyMs) / totalCycles : 0;

    set({
      stats: {
        ...prev,
        totalCycles,
        completedCycles,
        skippedCycles,
        fallbackCount,
        avgLatencyMs: Math.round(avgLatencyMs),
        lastCycleLatencyMs,
        lastEmotion: result.emotion?.emotion ?? prev.lastEmotion,
        lastScore: result.emotion?.score ?? prev.lastScore,
      },
    });
  },

  setApiStatus: (api: keyof ApiStatusMap, status: ApiStatus) => {
    set((state) => ({
      stats: {
        ...state.stats,
        apiStatus: { ...state.stats.apiStatus, [api]: status },
      },
    }));
  },

  setShowOverlay: (show: boolean) => set({ showOverlay: show }),

  setTestMode: (test: boolean) => set({ testMode: test }),

  setSelectedMic: (deviceId: string) => set({ selectedMicDeviceId: deviceId }),

  addCycleToHistory: (result: CycleResult) => {
    set((state) => ({
      cycleHistory: [result, ...state.cycleHistory].slice(0, 50), // keep last 50
    }));
    // Return to idle phase after showing the image for a while
    setTimeout(() => {
      set({ pipelinePhase: 'idle', floatingKeywords: [], currentTranscript: '' });
    }, 8000);
  },

  // ─── V2 Actions ─────────────────────────────────────────
  setLiveTranscript: (t: string) => set({ liveTranscript: t }),

  setLiveImagePrompt: (p: string) => set({ liveImagePrompt: p }),

  addEmotionHistory: (emotion: EmotionClass, score: number) => {
    set((state) => {
      const entry: EmotionHistoryEntry = { emotion, score, timestamp: Date.now() };
      const newHistory = [...state.emotionHistory, entry].slice(-8); // keep last 8

      // Track consecutive same emotion
      let consecutive = 0;
      if (newHistory.length >= 2) {
        const lastEmotion = newHistory[newHistory.length - 1].emotion;
        for (let i = newHistory.length - 2; i >= 0; i--) {
          if (newHistory[i].emotion === lastEmotion) {
            consecutive++;
          } else {
            break;
          }
        }
      }

      return {
        emotionHistory: newHistory,
        consecutiveSameEmotion: consecutive,
      };
    });
  },

  addSessionKeywords: (words: string[]) => {
    set((state) => {
      const existing = new Set(state.sessionKeywords);
      for (const w of words) {
        existing.add(w.toLowerCase());
      }
      return { sessionKeywords: Array.from(existing) };
    });
  },

  setPoeticLine: (line: string | null) => set({ poeticLine: line }),

  setLiveEmotionJSON: (json: string | null) => set({ liveEmotionJSON: json }),
}));
