import { StateCreator } from 'zustand';
import type { AppState, CycleStats, CycleResult, ApiStatusMap, ApiStatus } from '@/types';

export interface StatsSlice {
  stats: CycleStats;
  updateStats: (result: CycleResult) => void;
  setApiStatus: (api: keyof ApiStatusMap, status: ApiStatus) => void;
}

export const createStatsSlice: StateCreator<AppState, [], [], StatsSlice> = (set, get) => ({
  stats: {
    totalCycles: 0,
    completedCycles: 0,
    skippedCycles: 0,
    fallbackCount: 0,
    avgLatencyMs: 0,
    lastCycleLatencyMs: 0,
    lastEmotion: null,
    lastScore: null,
    apiStatus: { whisper: 'unknown', gpt4o: 'unknown', dalle3: 'unknown', sora: 'unknown' },
  },

  updateStats: (result) => {
    const prev = get().stats;
    const totalCycles = prev.totalCycles + 1;
    const completedCycles = result.status === 'complete' ? prev.completedCycles + 1 : prev.completedCycles;
    const skippedCycles = result.status === 'skipped' ? prev.skippedCycles + 1 : prev.skippedCycles;
    const fallbackCount = result.image?.isFallback ? prev.fallbackCount + 1 : prev.fallbackCount;
    const lastCycleLatencyMs = result.totalLatencyMs;

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

  setApiStatus: (api, status) => {
    set((state) => ({
      stats: {
        ...state.stats,
        apiStatus: { ...state.stats.apiStatus, [api]: status },
      },
    }));
  },
});
