// store/appStore.ts — Zustand global state store
import { create } from 'zustand';
import type { AppState } from '@/types';
import { createOrchestratorSlice } from './slices/orchestratorSlice';
import { createUiSlice } from './slices/uiSlice';
import { createStatsSlice } from './slices/statsSlice';
import { createHistorySlice } from './slices/historySlice';

export const useAppStore = create<AppState>()((...a) => ({
  ...createOrchestratorSlice(...a),
  ...createUiSlice(...a),
  ...createStatsSlice(...a),
  ...createHistorySlice(...a),
}));
