// types/index.ts — ALL shared TypeScript interfaces and types

export type EmotionClass = 'Hope' | 'Fear' | 'Grief' | 'Anger' | 'Renewal';

export type CaptureMode = 'auto' | 'conference';

export type GenerationOutputType = 'image' | 'video';

export type OrchestratorState = 'idle' | 'live' | 'paused' | 'processing';

export type PipelinePhase = 'idle' | 'listening' | 'processing' | 'showing_prompt' | 'revealing' | 'displaying';

export type CycleStatus = 'complete' | 'skipped' | 'fallback' | 'error';

export type SystemEventType =
  | 'state_change'
  | 'chunk_started'
  | 'transcript_ready'
  | 'emotion_ready'
  | 'image_ready'
  | 'video_ready'
  | 'video_progress'
  | 'prompt_ready'
  | 'poetic_moment'
  | 'cycle_complete'
  | 'cycle_skipped'
  | 'api_error'
  | 'control'
  | 'pipeline_phase'
  | 'conference_transcript_chunk'
  | 'conference_generating'
  | 'conference_result';

export type ControlCommand =
  | 'live_on'
  | 'live_off'
  | 'pause'
  | 'resume'
  | 'skip'
  | 'force_generate'
  | 'force_generate_with_prompt'
  | 'conference_start'
  | 'conference_stop';

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

export interface VideoResult {
  localPath: string;              // /tmp/ai-exp-cache/vid_<uuid>.mp4
  servedPath: string;             // /api/video/<filename>
  prompt: string;
  emotion: EmotionClass;
  chunkId: string;
  latencyMs: number;
  durationSeconds: number;
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

export interface VideoReadyEvent {
  servedPath: string;
  emotion: EmotionClass;
  chunkId: string;
  durationSeconds: number;
}

export interface VideoProgressEvent {
  videoId: string;
  status: string;
  progress: number;
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

export interface ConferenceTranscriptChunkEvent {
  partialText: string;
  words: string[];
  chunkIndex: number;
}

export interface ConferenceResultEvent {
  servedPath: string;
  outputType: GenerationOutputType;
  emotion: EmotionClass;
  score: number;
  fullTranscript: string;
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
  sora: ApiStatus;
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
  currentVideoPath: string | null;
  videoProgress: number | null;
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

  // ─── CONFERENCE MODE ───────────────────────────────────────
  captureMode: CaptureMode;
  generationOutputType: GenerationOutputType;
  isConferenceListening: boolean;
  conferenceTranscriptBuffer: string;   // accumulated full transcript
  conferenceIsGenerating: boolean;

  // ─── DYNAMIC WORD POOL ────────────────────────────────────
  allTranscriptWords: string[];         // rolling pool of all unique extracted words

  // Actions
  setOrchestratorState: (state: OrchestratorState) => void;
  setLiveMode: (live: boolean) => void;
  setPipelinePhase: (phase: PipelinePhase) => void;
  setCurrentImage: (path: string, emotion: EmotionClass, isFallback: boolean) => void;
  setCurrentVideo: (path: string, emotion: EmotionClass, durationSeconds: number) => void;
  setVideoProgress: (progress: number | null) => void;
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

  // Conference mode actions
  setCaptureMode: (mode: CaptureMode) => void;
  setGenerationOutputType: (type: GenerationOutputType) => void;
  setConferenceListening: (listening: boolean) => void;
  appendConferenceTranscript: (text: string) => void;
  clearConferenceTranscript: () => void;
  setConferenceIsGenerating: (generating: boolean) => void;

  // Dynamic word pool
  addToWordPool: (words: string[]) => void;
  clearWordPool: () => void;
}
