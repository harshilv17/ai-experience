// types/index.ts — ALL shared TypeScript interfaces and types

export type EmotionClass = 'Hope' | 'Fear' | 'Grief' | 'Anger' | 'Renewal';

export type OrchestratorState = 'idle' | 'live' | 'paused' | 'processing';

export type CycleStatus = 'complete' | 'skipped' | 'fallback' | 'error';

export type SystemEventType =
  | 'state_change'
  | 'chunk_started'
  | 'emotion_ready'
  | 'image_ready'
  | 'cycle_complete'
  | 'cycle_skipped'
  | 'api_error'
  | 'control';

export type ControlCommand =
  | 'live_on'
  | 'live_off'
  | 'pause'
  | 'resume'
  | 'skip'
  | 'force_generate';

// ─── PIPELINE DTOs ─────────────────────────────────────────────────────────

export interface AudioChunk {
  blob: Buffer;
  mimeType: string;               // e.g. "audio/webm;codecs=opus"
  durationMs: number;             // total audio captured
  speechDurationMs: number;       // VAD-detected speech only
  timestamp: number;              // unix ms
  chunkId: string;                // uuid
}

export interface TranscriptResult {
  text: string;
  language: string;
  durationSeconds: number;
  chunkId: string;
  latencyMs: number;
}

export interface EmotionResult {
  emotion: EmotionClass;
  score: number;                  // 0–100 intensity
  keywords: string[];             // 3–5 keywords
  safe: boolean;                  // passed profanity filter
  chunkId: string;
  latencyMs: number;
}

export interface ImageResult {
  remoteUrl: string;              // DALL-E URL (expires ~1hr)
  localPath: string;              // /tmp/ai-exp-cache/img_<uuid>.png
  servedPath: string;             // path served to browser e.g. /api/image/<id>
  prompt: string;                 // full prompt used
  emotion: EmotionClass;
  isFallback: boolean;
  chunkId: string;
  latencyMs: number;
}

export interface CycleResult {
  chunkId: string;
  status: CycleStatus;
  skipReason?: string;
  transcript?: TranscriptResult;
  emotion?: EmotionResult;
  image?: ImageResult;
  totalLatencyMs: number;
  apiLatencies: Record<string, number>;
  timestamp: number;
}

// ─── SSE EVENTS ────────────────────────────────────────────────────────────

export interface SystemEvent<T = unknown> {
  type: SystemEventType;
  data: T;
  timestamp: number;
}

export interface StateChangeEvent {
  state: OrchestratorState;
  liveMode: boolean;
}

export interface EmotionReadyEvent {
  emotion: EmotionClass;
  score: number;
  keywords: string[];
  chunkId: string;
}

export interface ImageReadyEvent {
  servedPath: string;
  emotion: EmotionClass;
  isFallback: boolean;
  chunkId: string;
}

export interface CycleCompleteEvent {
  result: CycleResult;
  stats: CycleStats;
}

// ─── UI STATE ──────────────────────────────────────────────────────────────

export interface CycleStats {
  totalCycles: number;
  completedCycles: number;
  skippedCycles: number;
  fallbackCount: number;
  avgLatencyMs: number;
  lastCycleLatencyMs: number;
  lastEmotion: EmotionClass | null;
  lastScore: number | null;
  apiStatus: ApiStatusMap;
}

export type ApiStatusMap = {
  whisper: ApiStatus;
  gpt4o: ApiStatus;
  dalle3: ApiStatus;
};

export type ApiStatus = 'ok' | 'error' | 'rate_limited' | 'unknown';

export interface AppState {
  // Orchestrator
  orchestratorState: OrchestratorState;
  liveMode: boolean;

  // Current display
  currentImagePath: string | null;
  currentEmotion: EmotionClass | null;
  currentScore: number | null;
  currentKeywords: string[];

  // Stats
  stats: CycleStats;

  // UI
  showOverlay: boolean;
  testMode: boolean;
  selectedMicDeviceId: string | null;

  // History
  cycleHistory: CycleResult[];

  // Actions
  setOrchestratorState: (state: OrchestratorState) => void;
  setLiveMode: (live: boolean) => void;
  setCurrentImage: (path: string, emotion: EmotionClass, isFallback: boolean) => void;
  setCurrentEmotion: (emotion: EmotionClass, score: number, keywords: string[]) => void;
  updateStats: (result: CycleResult) => void;
  setApiStatus: (api: keyof ApiStatusMap, status: ApiStatus) => void;
  setShowOverlay: (show: boolean) => void;
  setTestMode: (test: boolean) => void;
  setSelectedMic: (deviceId: string) => void;
  addCycleToHistory: (result: CycleResult) => void;
}
