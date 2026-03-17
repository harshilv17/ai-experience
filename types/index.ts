// types/index.ts — ALL shared TypeScript interfaces and types

export type EmotionClass = 'Hope' | 'Fear' | 'Grief' | 'Anger' | 'Renewal';

export type OrchestratorState = 'idle' | 'live' | 'paused' | 'processing';

export type PipelinePhase = 'idle' | 'listening' | 'processing' | 'showing_prompt' | 'revealing' | 'displaying';

export type CycleStatus = 'complete' | 'skipped' | 'fallback' | 'error';

export type SystemEventType =
  | 'state_change'
  | 'chunk_started'
  | 'transcript_ready'
  | 'emotion_ready'
  | 'image_ready'
  | 'prompt_ready'
  | 'poetic_moment'
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
  | 'force_generate'
  | 'force_generate_with_prompt';

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

export interface TranscriptReadyEvent {
  text: string;
  words: string[];    // important words extracted for Mentimeter display
  chunkId: string;
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

export interface PromptReadyEvent {
  prompt: string;
  chunkId: string;
}

export interface PoeticMomentEvent {
  text: string;
  emotion: EmotionClass;
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

export interface EmotionHistoryEntry {
  emotion: EmotionClass;
  score: number;
  timestamp: number;
}

export interface AppState {
  // Orchestrator
  orchestratorState: OrchestratorState;
  liveMode: boolean;

  // Pipeline phase (visual state machine for projection display)
  pipelinePhase: PipelinePhase;

  // Current display
  currentImagePath: string | null;
  currentEmotion: EmotionClass | null;
  currentScore: number | null;
  currentKeywords: string[];

  // Floating keywords (Mentimeter-style)
  floatingKeywords: string[];
  currentTranscript: string;

  // Stats
  stats: CycleStats;

  // UI
  showOverlay: boolean;
  testMode: boolean;
  selectedMicDeviceId: string | null;

  // History
  cycleHistory: CycleResult[];

  // ─── V2 ADDITIONS ─────────────────────────────────────────
  liveTranscript: string;
  liveImagePrompt: string;
  emotionHistory: EmotionHistoryEntry[];
  sessionKeywords: string[];
  consecutiveSameEmotion: number;
  poeticLine: string | null;
  liveEmotionJSON: string | null;
  // Pipeline timing (image display duration, deferred prompt)
  displayStartedAt: number | null;
  pendingPromptData: { transcript: string; keywords: string[]; emotion: EmotionClass; score: number } | null;

  // ─── OPERATOR OVERRIDES (editable on control panel) ────────
  pendingImagePrompt: string;       // prompt broadcast BEFORE image generation
  systemContextOverride: string;    // operator-editable copy of IMAGE_SYSTEM_CONTEXT
  transcriptOverride: string;       // operator-editable copy of liveTranscript

  // Actions
  setOrchestratorState: (state: OrchestratorState) => void;
  setLiveMode: (live: boolean) => void;
  setPipelinePhase: (phase: PipelinePhase) => void;
  setCurrentImage: (path: string, emotion: EmotionClass, isFallback: boolean) => void;
  setCurrentEmotion: (emotion: EmotionClass, score: number, keywords: string[]) => void;
  setTranscript: (text: string, words: string[]) => void;
  updateStats: (result: CycleResult) => void;
  setApiStatus: (api: keyof ApiStatusMap, status: ApiStatus) => void;
  setShowOverlay: (show: boolean) => void;
  setTestMode: (test: boolean) => void;
  setSelectedMic: (deviceId: string) => void;
  addCycleToHistory: (result: CycleResult) => void;

  // V2 Actions
  setLiveTranscript: (t: string) => void;
  setLiveImagePrompt: (p: string) => void;
  addEmotionHistory: (emotion: EmotionClass, score: number) => void;
  addSessionKeywords: (words: string[]) => void;
  setPoeticLine: (line: string | null) => void;
  setLiveEmotionJSON: (json: string | null) => void;
  setDisplayStartedAt: (ts: number | null) => void;
  clearDisplayStartedAt: () => void;
  setPendingPromptData: (data: { transcript: string; keywords: string[]; emotion: EmotionClass; score: number } | null) => void;
  transitionToShowingPrompt: () => void;
  clearPendingPrompt: () => void;

  // Operator override setters
  setPendingImagePrompt: (p: string) => void;
  setSystemContextOverride: (ctx: string) => void;
  setTranscriptOverride: (t: string) => void;
}
