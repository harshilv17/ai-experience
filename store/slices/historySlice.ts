import { StateCreator } from 'zustand';
import type { AppState, CycleResult, EmotionHistoryEntry, EmotionClass } from '@/types';

export interface HistorySlice {
  cycleHistory: CycleResult[];
  emotionHistory: EmotionHistoryEntry[];
  sessionKeywords: string[];
  consecutiveSameEmotion: number;

  addCycleToHistory: (result: CycleResult) => void;
  addEmotionHistory: (emotion: EmotionClass, score: number) => void;
  addSessionKeywords: (words: string[]) => void;
}

export const createHistorySlice: StateCreator<AppState, [], [], HistorySlice> = (set) => ({
  cycleHistory: [],
  emotionHistory: [],
  sessionKeywords: [],
  consecutiveSameEmotion: 0,

  addCycleToHistory: (result) => {
    set((state) => ({
      cycleHistory: [result, ...state.cycleHistory].slice(0, 50),
    }));
    setTimeout(() => {
      set((state) => {
        if (state.pipelinePhase === 'revealing') {
          return { pipelinePhase: 'displaying', floatingKeywords: [], currentTranscript: '' };
        }
        return state;
      });
    }, 2500);
  },

  addEmotionHistory: (emotion, score) => {
    set((state) => {
      const entry: EmotionHistoryEntry = { emotion, score, timestamp: Date.now() };
      const newHistory = [...state.emotionHistory, entry].slice(-8);

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

  addSessionKeywords: (words) => {
    set((state) => {
      const existing = new Set(state.sessionKeywords);
      for (const w of words) {
        existing.add(w.toLowerCase());
      }
      return { sessionKeywords: Array.from(existing) };
    });
  },
});
