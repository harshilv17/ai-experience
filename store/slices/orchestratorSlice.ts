import { StateCreator } from 'zustand';
import type { AppState, OrchestratorState } from '@/types';

export interface OrchestratorSlice {
  orchestratorState: OrchestratorState;
  liveMode: boolean;
  testMode: boolean;
  selectedMicDeviceId: string | null;
  setOrchestratorState: (state: OrchestratorState) => void;
  setLiveMode: (live: boolean) => void;
  setTestMode: (test: boolean) => void;
  setSelectedMic: (deviceId: string) => void;
}

export const createOrchestratorSlice: StateCreator<AppState, [], [], OrchestratorSlice> = (set) => ({
  orchestratorState: 'idle',
  liveMode: false,
  testMode: false,
  selectedMicDeviceId: null,
  setOrchestratorState: (state) => set({ orchestratorState: state }),
  setLiveMode: (live) => set({ liveMode: live }),
  setTestMode: (test) => set({ testMode: test }),
  setSelectedMic: (deviceId) => set({ selectedMicDeviceId: deviceId }),
});
