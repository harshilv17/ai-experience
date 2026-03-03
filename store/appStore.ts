// store/appStore.ts — Zustand global state store
import { create } from 'zustand';
import type {
  AppState,
  OrchestratorState,
  EmotionClass,
  ApiStatusMap,
  ApiStatus,
  CycleResult,
} from '@/types';

const OVERLAY_DURATION_MS = parseInt(process.env.NEXT_PUBLIC_OVERLAY_DURATION_MS || '3000', 10);

export const useAppStore = create<AppState>((set, get) => ({
  // ─── Orchestrator ────────────────────────────────────────
  orchestratorState: 'idle',
  liveMode: false,

  // ─── Current display ────────────────────────────────────
  currentImagePath: null,
  currentEmotion: null,
  currentScore: null,
  currentKeywords: [],

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

  // ─── Actions ────────────────────────────────────────────
  setOrchestratorState: (state: OrchestratorState) => set({ orchestratorState: state }),

  setLiveMode: (live: boolean) => set({ liveMode: live }),

  setCurrentImage: (path: string, emotion: EmotionClass, _isFallback: boolean) => {
    set({ currentImagePath: path, showOverlay: true });
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
      showOverlay: true,
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
  },
}));
