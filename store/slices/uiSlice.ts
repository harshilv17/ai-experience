import { StateCreator } from 'zustand';
import type { AppState, PipelinePhase, EmotionClass, CaptureMode, GenerationOutputType } from '@/types';
import { IMAGE_SYSTEM_CONTEXT } from '@/lib/prompt-templates';

export interface UiSlice {
  pipelinePhase: PipelinePhase;
  currentImagePath: string | null;
  currentVideoPath: string | null;
  videoProgress: number | null;
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

  // Operator override fields (editable on the control panel)
  pendingImagePrompt: string;       // prompt broadcast BEFORE image generation
  systemContextOverride: string;    // operator-editable copy of IMAGE_SYSTEM_CONTEXT
  transcriptOverride: string;       // operator-editable copy of liveTranscript

  // Conference mode
  captureMode: CaptureMode;
  generationOutputType: GenerationOutputType;
  isConferenceListening: boolean;
  conferenceTranscriptBuffer: string;
  conferenceIsGenerating: boolean;
  conferenceCompleted: boolean;

  // Dynamic word pool (rolling, all unique words seen)
  allTranscriptWords: string[];

  setPipelinePhase: (phase: PipelinePhase) => void;
  setCurrentImage: (path: string, emotion: EmotionClass, isFallback: boolean) => void;
  setCurrentVideo: (path: string, emotion: EmotionClass, durationSeconds: number) => void;
  setVideoProgress: (progress: number | null) => void;
  setCurrentEmotion: (emotion: EmotionClass, score: number, keywords: string[]) => void;
  setTranscript: (text: string, words: string[]) => void;
  setShowOverlay: (show: boolean) => void;
  setLiveTranscript: (t: string) => void;
  setLiveImagePrompt: (p: string) => void;
  setPoeticLine: (line: string | null) => void;
  setLiveEmotionJSON: (json: string | null) => void;

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
  setConferenceCompleted: (completed: boolean) => void;

  // Dynamic word pool
  addToWordPool: (words: string[]) => void;
  clearWordPool: () => void;

  displayStartedAt: number | null;
  pendingPromptData: { transcript: string; keywords: string[]; emotion: EmotionClass; score: number } | null;

  setDisplayStartedAt: (ts: number | null) => void;
  clearDisplayStartedAt: () => void;
  setPendingPromptData: (data: { transcript: string; keywords: string[]; emotion: EmotionClass; score: number } | null) => void;
  transitionToShowingPrompt: () => void;
  clearPendingPrompt: () => void;
}

const OVERLAY_DURATION_MS = parseInt(process.env.NEXT_PUBLIC_OVERLAY_DURATION_MS || '5000', 10);
const IMAGE_DISPLAY_DURATION_MS = 20000;
export const DISPLAY_HOLD_MS = 10000;

let displayTimer: ReturnType<typeof setTimeout> | null = null;
let revealTimer: ReturnType<typeof setTimeout> | null = null;
let overlayTimer: ReturnType<typeof setTimeout> | null = null;

// ── Client-side transcript word extraction ──────────────────────────────
const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'must', 'and', 'but',
  'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each',
  'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because',
  'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about',
  'against', 'between', 'through', 'during', 'before', 'after', 'above',
  'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours',
  'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
  'it', 'its', 'they', 'them', 'their', 'theirs', 'also', 'like', 'think',
  'know', 'really', 'much', 'well', 'even', 'back', 'still', 'way',
  'get', 'got', 'going', 'make', 'made', 'come', 'came', 'take', 'took',
  'say', 'said', 'tell', 'told', 'see', 'seen', 'look', 'thing', 'things',
  'yeah', 'okay', 'right', 'yes', 'uh', 'um', 'oh', 'ah', 'hmm',
  'new', 'open', 'fresh', 'change', 'hope', 'feel', 'feeling',
]);

/** Extract meaningful words from transcript text (nouns, vivid verbs, adjectives) */
function extractTranscriptWords(text: string, maxCount: number): string[] {
  if (!text || text.length < 10) return [];
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, '')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));

  // Deduplicate and pick the longest/most interesting words
  const unique = Array.from(new Set(words));
  unique.sort((a, b) => b.length - a.length); // prefer longer words (more specific)
  return unique.slice(0, maxCount);
}

/** Merge GPT keywords with transcript-extracted words, deduplicating */
function mergeKeywords(gptKeywords: string[], transcriptWords: string[], maxTotal: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  // GPT keywords first (they're already curated)
  for (const kw of gptKeywords) {
    const lower = kw.toLowerCase();
    if (!seen.has(lower) && !STOPWORDS.has(lower)) {
      seen.add(lower);
      result.push(kw);
    }
  }

  // Then fill with transcript words
  for (const tw of transcriptWords) {
    if (result.length >= maxTotal) break;
    const lower = tw.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      // Capitalize first letter for display consistency
      result.push(tw.charAt(0).toUpperCase() + tw.slice(1));
    }
  }

  return result.slice(0, maxTotal);
}

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set, get) => ({
  pipelinePhase: 'idle',
  currentImagePath: null,
  currentVideoPath: null,
  videoProgress: null,
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
  displayStartedAt: null,
  pendingPromptData: null,

  pendingImagePrompt: '',
  systemContextOverride: IMAGE_SYSTEM_CONTEXT,
  transcriptOverride: '',

  // Conference mode defaults
  captureMode: 'auto',
  generationOutputType: 'image',
  isConferenceListening: false,
  conferenceTranscriptBuffer: '',
  conferenceIsGenerating: false,
  conferenceCompleted: false,

  // Dynamic word pool
  allTranscriptWords: [],

  setPipelinePhase: (phase) => set({ pipelinePhase: phase }),

  setCurrentImage: (path, emotion, _isFallback) => {
    if (displayTimer) clearTimeout(displayTimer);
    if (revealTimer) clearTimeout(revealTimer);
    if (overlayTimer) clearTimeout(overlayTimer);

    const isConference = get().captureMode === 'conference';

    set({
      currentImagePath: path,
      pipelinePhase: 'revealing',
      showOverlay: true,
      floatingKeywords: [],
      liveEmotionJSON: null,
      displayStartedAt: Date.now(),
    });

    revealTimer = setTimeout(() => {
      set({ pipelinePhase: 'displaying' });
    }, 2000);

    overlayTimer = setTimeout(() => {
      set({ showOverlay: false });
    }, OVERLAY_DURATION_MS);

    // In conference mode, keep the image displayed indefinitely (no auto-return to idle/robot)
    if (!isConference) {
      displayTimer = setTimeout(() => {
        set({
          pipelinePhase: 'idle',
          currentImagePath: null,
          currentVideoPath: null,
          floatingKeywords: [],
          showOverlay: false,
          displayStartedAt: null,
        });
      }, IMAGE_DISPLAY_DURATION_MS);
    }
  },

  setCurrentVideo: (path, emotion, durationSeconds) => {
    if (displayTimer) clearTimeout(displayTimer);
    if (revealTimer) clearTimeout(revealTimer);
    if (overlayTimer) clearTimeout(overlayTimer);

    const isConference = get().captureMode === 'conference';

    set({
      currentVideoPath: path,
      currentImagePath: null,  // clear any image when video plays
      pipelinePhase: 'revealing',
      showOverlay: true,
      floatingKeywords: [],
      liveEmotionJSON: null,
      displayStartedAt: Date.now(),
      videoProgress: null,  // clear progress indicator
    });

    revealTimer = setTimeout(() => {
      set({ pipelinePhase: 'displaying' });
    }, 2000);

    overlayTimer = setTimeout(() => {
      set({ showOverlay: false });
    }, OVERLAY_DURATION_MS);

    // In conference mode, keep the video displayed indefinitely
    if (!isConference) {
      // Hold video display for video duration + buffer
      const holdMs = Math.max((durationSeconds + 5) * 1000, IMAGE_DISPLAY_DURATION_MS);
      displayTimer = setTimeout(() => {
        set({
          pipelinePhase: 'idle',
          currentVideoPath: null,
          currentImagePath: null,
          floatingKeywords: [],
          showOverlay: false,
          displayStartedAt: null,
        });
      }, holdMs);
    }
  },

  setVideoProgress: (progress) => set({ videoProgress: progress }),

  setCurrentEmotion: (emotion, score, keywords) => {
    // Merge GPT keywords with words extracted from the live transcript
    const state = get();
    const transcript = state.liveTranscript || state.currentTranscript || '';
    const transcriptWords = extractTranscriptWords(transcript, 4);
    const merged = mergeKeywords(keywords, transcriptWords, 8);

    // Feed all unique words into the rotating word pool
    const allNew = [...keywords, ...transcriptWords];
    const existing = get().allTranscriptWords;
    const poolMerged = Array.from(new Set([...existing, ...allNew.map(w => w.toLowerCase())])).slice(0, 80);

    set({
      currentEmotion: emotion,
      currentScore: score,
      currentKeywords: merged,
      floatingKeywords: merged,
      pipelinePhase: 'processing',
      showOverlay: true,
      allTranscriptWords: poolMerged,
    });
  },

  setTranscript: (text, words) => {
    // Supplement server-provided words with client-side extraction
    const transcriptWords = extractTranscriptWords(text, 4);
    const merged = mergeKeywords(words, transcriptWords, 8);

    // Feed into word pool
    const allNew = [...words, ...transcriptWords];
    const existing = get().allTranscriptWords;
    const poolMerged = Array.from(new Set([...existing, ...allNew.map(w => w.toLowerCase())])).slice(0, 80);

    set({
      currentTranscript: text,
      floatingKeywords: merged,
      pipelinePhase: 'processing',
      allTranscriptWords: poolMerged,
    });
  },

  setShowOverlay: (show) => set({ showOverlay: show }),
  setLiveTranscript: (t) => set({ liveTranscript: t }),
  setLiveImagePrompt: (p) => set({ liveImagePrompt: p }),
  setPoeticLine: (line) => set({ poeticLine: line }),
  setLiveEmotionJSON: (json) => set({ liveEmotionJSON: json }),

  setPendingImagePrompt: (p) => set({ pendingImagePrompt: p }),
  setSystemContextOverride: (ctx) => set({ systemContextOverride: ctx }),
  setTranscriptOverride: (t) => set({ transcriptOverride: t }),

  setDisplayStartedAt: (ts) => set({ displayStartedAt: ts }),
  clearDisplayStartedAt: () => set({ displayStartedAt: null }),
  setPendingPromptData: (data) => set({ pendingPromptData: data }),
  transitionToShowingPrompt: () => set({ pipelinePhase: 'showing_prompt' }),
  clearPendingPrompt: () => set({ pendingPromptData: null }),

  // ── Conference mode actions ───────────────────────────────────────────────
  setCaptureMode: (mode) => set({ captureMode: mode }),
  setGenerationOutputType: (type) => set({ generationOutputType: type }),
  setConferenceListening: (listening) => set({ isConferenceListening: listening }),
  setConferenceIsGenerating: (generating) => {
    // When generation finishes (true→false), mark conference as completed
    if (!generating && get().conferenceIsGenerating) {
      set({ conferenceIsGenerating: false, conferenceCompleted: true });
    } else {
      set({ conferenceIsGenerating: generating });
    }
  },
  setConferenceCompleted: (completed) => set({ conferenceCompleted: completed }),

  appendConferenceTranscript: (text) => {
    const current = get().conferenceTranscriptBuffer;
    const updated = current ? `${current} ${text}` : text;
    // Also extract words and add to the pool
    const newWords = extractTranscriptWords(text, 10);
    const existing = get().allTranscriptWords;
    const merged = Array.from(new Set([...existing, ...newWords])).slice(0, 80);
    set({ conferenceTranscriptBuffer: updated, allTranscriptWords: merged });
  },

  clearConferenceTranscript: () => set({ conferenceTranscriptBuffer: '', isConferenceListening: false, conferenceIsGenerating: false, conferenceCompleted: false }),

  // ── Dynamic word pool actions ─────────────────────────────────────────────
  addToWordPool: (words) => {
    const existing = get().allTranscriptWords;
    const merged = Array.from(new Set([...existing, ...words.map(w => w.toLowerCase())])).slice(0, 80);
    set({ allTranscriptWords: merged });
  },

  clearWordPool: () => set({ allTranscriptWords: [] }),
});
