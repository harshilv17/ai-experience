// components/ControlPanel.tsx — Operator command center
'use client';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import MicPicker from './MicPicker';
import type { ControlCommand, CaptureMode, GenerationOutputType } from '@/types';

const EMOTION_BADGE_COLORS: Record<string, string> = {
  Hope: 'bg-[#FDE047] shadow-[#FDE047]/60 text-black',
  Fear: 'bg-[#818CF8] shadow-[#818CF8]/60 text-white',
  Grief: 'bg-[#38BDF8] shadow-[#38BDF8]/60 text-black',
  Anger: 'bg-[#FB7185] shadow-[#FB7185]/60 text-white',
  Renewal: 'bg-[#34D399] shadow-[#34D399]/60 text-black',
};

const STATUS_COLORS: Record<string, string> = {
  ok: 'text-emerald-400',
  error: 'text-red-400',
  rate_limited: 'text-amber-400',
  unknown: 'text-gray-500',
  no_api_key: 'text-red-400',
};

const STATUS_DOTS: Record<string, string> = {
  ok: '●',
  error: '✖',
  rate_limited: '◐',
  unknown: '○',
  no_api_key: '✖',
};

// ─── Reusable editable card component (always-editable) ──────────────────────
function EditableCard({
  title,
  titleColor = 'text-gray-400',
  borderColor = 'border-gray-800',
  textColor = 'text-gray-300',
  value,
  placeholder,
  badge,
  onSave,
  extraActions,
  height = 'h-32',
}: {
  title: string;
  titleColor?: string;
  borderColor?: string;
  textColor?: string;
  value: string;
  placeholder: string;
  badge?: React.ReactNode;
  onSave?: (newValue: string) => void;
  extraActions?: (value: string) => React.ReactNode;
  height?: string;
}) {
  return (
    <div className={`bg-gray-900 rounded-xl p-4 border ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className={`text-sm font-semibold uppercase tracking-wider ${titleColor}`}>
            {title}
          </h2>
          {badge}
        </div>
      </div>

      <textarea
        className={`w-full bg-black/50 ${textColor} font-mono text-xs leading-relaxed rounded-lg p-3 ${height} border border-gray-800/50 hover:border-gray-600 focus:border-indigo-500 focus:outline-none resize-none transition-colors`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onSave?.(e.target.value)}
      />

      {/* Extra action buttons */}
      {extraActions && (
        <div className="mt-2">
          {extraActions(value)}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ControlPanel() {
  const state = useAppStore((s) => s.orchestratorState);
  const phase = useAppStore((s) => s.pipelinePhase);
  const liveMode = useAppStore((s) => s.liveMode);
  const testMode = useAppStore((s) => s.testMode);
  const setTestMode = useAppStore((s) => s.setTestMode);
  const currentEmotion = useAppStore((s) => s.currentEmotion);
  const currentScore = useAppStore((s) => s.currentScore);
  const currentKeywords = useAppStore((s) => s.currentKeywords);
  const currentImagePath = useAppStore((s) => s.currentImagePath);
  const stats = useAppStore((s) => s.stats);
  const cycleHistory = useAppStore((s) => s.cycleHistory);

  // V2 store additions
  const liveTranscript = useAppStore((s) => s.liveTranscript);
  const poeticLine = useAppStore((s) => s.poeticLine);
  const liveImagePrompt = useAppStore((s) => s.liveImagePrompt);
  const pendingImagePrompt = useAppStore((s) => s.pendingImagePrompt);
  const emotionHistory = useAppStore((s) => s.emotionHistory);

  // Operator override setters
  const setTranscriptOverride = useAppStore((s) => s.setTranscriptOverride);
  const setSystemContextOverride = useAppStore((s) => s.setSystemContextOverride);
  const setPendingImagePrompt = useAppStore((s) => s.setPendingImagePrompt);
  const setLiveImagePrompt = useAppStore((s) => s.setLiveImagePrompt);
  const systemContextOverride = useAppStore((s) => s.systemContextOverride);

  // Conference mode state + actions
  const captureMode = useAppStore((s) => s.captureMode);
  const generationOutputType = useAppStore((s) => s.generationOutputType);
  const isConferenceListening = useAppStore((s) => s.isConferenceListening);
  const conferenceIsGenerating = useAppStore((s) => s.conferenceIsGenerating);
  const conferenceTranscriptBuffer = useAppStore((s) => s.conferenceTranscriptBuffer);
  const videoProgress = useAppStore((s) => s.videoProgress);
  const setCaptureMode = useAppStore((s) => s.setCaptureMode);
  const setGenerationOutputType = useAppStore((s) => s.setGenerationOutputType);
  const setConferenceListening = useAppStore((s) => s.setConferenceListening);
  const clearConferenceTranscript = useAppStore((s) => s.clearConferenceTranscript);
  const clearWordPool = useAppStore((s) => s.clearWordPool);

  const [isLoading, setIsLoading] = useState(false);
  const [healthResults, setHealthResults] = useState<Record<string, string> | null>(null);
  const [sseConnected] = useState(true);

  const sendCommand = useCallback(async (cmd: ControlCommand, extra?: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd, ...extra }),
      });
      const data = await res.json();
      console.log(`[Control] ${cmd}:`, data);
    } catch (err) {
      console.error(`[Control] Failed to send ${cmd}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthResults(data);
    } catch (err) {
      console.error('[Control] Health check failed:', err);
      setHealthResults({ error: 'Health check failed' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGenerateWithPrompt = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    try {
      await sendCommand('force_generate_with_prompt', { prompt });
    } finally {
      setIsLoading(false);
    }
  }, [sendCommand]);

  const handleConferenceStart = useCallback(async () => {
    setConferenceListening(true);
    await sendCommand('conference_start');
  }, [sendCommand, setConferenceListening]);

  const handleConferenceStop = useCallback(async () => {
    setConferenceListening(false);
    await sendCommand('conference_stop', { outputType: generationOutputType });
  }, [sendCommand, generationOutputType, setConferenceListening]);

  const handleCaptureModeSwitch = useCallback((mode: CaptureMode) => {
    // Stop conference if switching away
    if (isConferenceListening) setConferenceListening(false);
    clearConferenceTranscript();
    clearWordPool();
    setCaptureMode(mode);
  }, [isConferenceListening, setConferenceListening, clearConferenceTranscript, clearWordPool, setCaptureMode]);

  const stateColors: Record<string, string> = {
    idle: 'text-gray-400',
    live: 'text-emerald-400',
    paused: 'text-amber-400',
    processing: 'text-blue-400',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* ─── HEADER ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-gray-900 rounded-xl px-6 py-4 border border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎙</span>
          <h1 className="text-xl font-bold tracking-tight">AI EXPERIENCE CONTROL</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-sm text-gray-400">
            {sseConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* ─── MIC + API STATUS ROW ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mic Picker */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Microphone
          </h2>
          <MicPicker />
          <button
            onClick={checkHealth}
            disabled={isLoading}
            className="mt-3 w-full bg-gray-800 hover:bg-gray-700 text-white text-sm py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? '⏳ Checking...' : '🔍 Test API Health'}
          </button>
        </div>

        {/* API Status */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            API Status
          </h2>
          <div className="space-y-2">
            {(['whisper', 'gpt4o', 'dalle3', 'sora'] as const).map((api) => {
              const status = healthResults
                ? healthResults[api] || 'unknown'
                : stats.apiStatus[api];
              return (
                <div key={api} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{api === 'gpt4o' ? 'GPT-4o' : api === 'dalle3' ? 'DALL-E 3' : api === 'sora' ? 'Sora Video' : 'Whisper'}</span>
                  <span className={`text-sm font-mono ${STATUS_COLORS[status] || 'text-gray-500'}`}>
                    {STATUS_DOTS[status] || '○'} {status.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── PRIMARY CONTROLS ──────────────────────────────────────── */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Controls
        </h2>

        {/* Live toggle — shown only in Auto mode */}
        {captureMode === 'auto' && (
          <div className="mb-4">
            <button
              onClick={() => sendCommand(liveMode ? 'live_off' : 'live_on')}
              disabled={isLoading}
              className={`
                w-full py-4 rounded-xl text-lg font-bold tracking-wider transition-all
                ${liveMode
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'}
                disabled:opacity-50
              `}
            >
              {liveMode ? '⏹ LIVE OFF' : '▶ LIVE ON'}
            </button>
          </div>
        )}

        {/* ─── CAPTURE MODE SWITCH ─────────────────────────────────── */}
        <div className="mb-4 p-4 bg-gray-800/60 rounded-xl border border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-3">Capture Mode</p>
          <div className="flex gap-2">
            {(['auto', 'conference'] as CaptureMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleCaptureModeSwitch(mode)}
                className={`
                  flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all
                  ${captureMode === mode
                    ? mode === 'conference'
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                      : 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                `}
              >
                {mode === 'auto' ? '⏱ Auto (30s)' : '🎤 Conference'}
              </button>
            ))}
          </div>
        </div>

        {/* ─── CONFERENCE MODE CONTROLS ─────────────────────────────── */}
        {captureMode === 'conference' && (
          <div className="mb-4 p-4 bg-violet-900/20 rounded-xl border border-violet-700/40 space-y-3">
            {/* Output type selector */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Generate Output</p>
              <div className="flex gap-2">
                {(['image', 'video'] as GenerationOutputType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setGenerationOutputType(type)}
                    className={`
                      flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all
                      ${generationOutputType === type
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                    `}
                  >
                    {type === 'image' ? '🖼 Image' : '🎬 Video'}
                  </button>
                ))}
              </div>
            </div>

            {/* Conference Status Indicator */}
            {conferenceIsGenerating && (
              <div className="flex items-center gap-2 text-violet-300 text-sm bg-violet-900/30 px-3 py-2 rounded-lg">
                <span className="animate-spin">⚙</span>
                Generating {generationOutputType} from full session transcript…
                {generationOutputType === 'video' && videoProgress != null && (
                  <span className="ml-auto font-mono text-violet-200">{videoProgress}%</span>
                )}
              </div>
            )}

            {isConferenceListening && !conferenceIsGenerating && (
              <div className="flex items-center gap-2 text-emerald-300 text-sm bg-emerald-900/20 px-3 py-2 rounded-lg">
                <span className="animate-pulse">●</span>
                Listening — {conferenceTranscriptBuffer.split(/\s+/).filter(Boolean).length} words captured
              </div>
            )}

            {/* Start / Stop buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleConferenceStart}
                disabled={isLoading || isConferenceListening || conferenceIsGenerating}
                className="py-3 rounded-xl text-sm font-bold tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-40"
              >
                ▶ Start Listening
              </button>
              <button
                onClick={handleConferenceStop}
                disabled={isLoading || !isConferenceListening || conferenceIsGenerating}
                className="py-3 rounded-xl text-sm font-bold tracking-wider bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all disabled:opacity-40"
              >
                ⏹ Stop &amp; Generate
              </button>
            </div>
          </div>
        )}

        {/* Secondary controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => sendCommand(state === 'paused' ? 'resume' : 'pause')}
            disabled={isLoading || !liveMode}
            className="bg-gray-800 hover:bg-gray-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
          >
            {state === 'paused' ? '▶ Resume' : '⏸ Pause'}
          </button>

          <button
            onClick={() => sendCommand('skip')}
            disabled={isLoading || !liveMode}
            className="bg-gray-800 hover:bg-gray-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
          >
            ⏭ Skip
          </button>

          <button
            onClick={() => sendCommand('force_generate')}
            disabled={isLoading}
            className="bg-indigo-700 hover:bg-indigo-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
          >
            🎨 Force Generate
          </button>

          <button
            onClick={() => setTestMode(!testMode)}
            className={`
              py-2.5 px-4 rounded-lg text-sm font-medium transition-colors
              ${testMode
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-white'}
            `}
          >
            {testMode ? '🧪 Test ON' : '🧪 Test OFF'}
          </button>
        </div>

        {testMode && (
          <div className="mt-3 text-amber-400 text-sm bg-amber-900/20 px-4 py-2 rounded-lg border border-amber-800">
            🧪 TEST MODE ACTIVE — auto-cycling emotions with predefined transcripts
          </div>
        )}
      </div>

      {/* ─── LIVE AUDIENCE SPEECH ──────────────────────────────────── */}
      <div className="bg-gray-900 rounded-xl p-5 border border-amber-900/40 relative overflow-hidden shadow-lg shadow-amber-900/10">
        {/* Animated background glow when listening/processing */}
        {(phase === 'listening' || state === 'processing') && (
          <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
        )}
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {(phase === 'listening' || state === 'processing') && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                )}
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              Live Audience Speech
            </h2>
          </div>

          <div className="min-h-[80px] bg-black/40 rounded-lg p-4 border border-gray-800">
            {liveTranscript ? (
              <p className="text-lg text-amber-100/90 leading-relaxed font-light italic">
                &quot;{liveTranscript}&quot;
                {(phase === 'listening' || state === 'processing') && (
                  <span className="inline-block w-2 h-5 bg-amber-400 ml-2 align-middle animate-pulse" />
                )}
              </p>
            ) : (
              <p className="text-gray-500 text-sm italic flex items-center gap-2">
                Waiting for audience input...
                <span className="flex gap-1">
                  {[0, 0.15, 0.3].map((d, i) => (
                    <span key={i} className="w-1 h-1 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: `${d}s` }} />
                  ))}
                </span>
              </p>
            )}
          </div>
          
          {poeticLine && (
            <div className="mt-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3">
              <span className="text-xs uppercase tracking-widest text-indigo-400 mb-1 block">Poetic Moment Detected</span>
              <p className="text-sm text-indigo-200 indent-4 font-serif italic text-balance">{poeticLine}</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── CURRENT STATE ─────────────────────────────────────────── */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Current State
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">State:</span>
            <span className={`text-sm font-bold uppercase ${stateColors[state] || 'text-gray-400'}`}>
              {state}
            </span>
          </div>

          {currentEmotion && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Emotion:</span>
              <span className={`${EMOTION_BADGE_COLORS[currentEmotion]} text-white text-xs px-2 py-0.5 rounded-full font-bold`}>
                {currentEmotion}
              </span>
              <span className="text-sm text-gray-300">({currentScore})</span>
            </div>
          )}

          {currentKeywords.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Keywords:</span>
              <span className="text-sm text-gray-300">{currentKeywords.join(', ')}</span>
            </div>
          )}
        </div>

        {currentImagePath && (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImagePath}
              alt="Current projection"
              className="w-48 h-auto rounded-lg border border-gray-700"
            />
          </div>
        )}
      </div>

      {/* ─── EDITABLE PIPELINE FIELDS ──────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1">
          Pipeline Inspector &amp; Overrides
        </h2>

        {/* CARD 1 — Latest Transcript (editable) */}
        <EditableCard
          title="Latest Transcript"
          titleColor="text-sky-400"
          borderColor="border-sky-900/40"
          textColor="text-gray-300 italic"
          value={liveTranscript}
          placeholder="Waiting for speech..."
          badge={
            liveTranscript ? (
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : null
          }
          onSave={(val) => setTranscriptOverride(val)}
          height="h-28"
        />

        {/* CARD 2 — System Context (editable) */}
        <EditableCard
          title="System Context"
          titleColor="text-violet-400"
          borderColor="border-violet-900/40"
          textColor="text-violet-200/80"
          value={systemContextOverride}
          placeholder="System context not set."
          onSave={(val) => setSystemContextOverride(val)}
          height="h-36"
        />

        {/* CARD 3 — Pending Image Prompt (shown BEFORE image generation) */}
        <EditableCard
          title="Pending Image Prompt"
          titleColor="text-amber-400"
          borderColor={pendingImagePrompt ? 'border-amber-600/60' : 'border-amber-900/30'}
          textColor="text-amber-200/80"
          value={pendingImagePrompt}
          placeholder="Waiting for next cycle to start..."
          badge={
            pendingImagePrompt ? (
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full animate-pulse">
                ⏳ Awaiting generation
              </span>
            ) : null
          }
          onSave={(val) => setPendingImagePrompt(val)}
          height="h-40"
          extraActions={(currentVal) =>
            currentVal.trim() ? (
              <button
                onClick={() => handleGenerateWithPrompt(currentVal)}
                disabled={isLoading}
                className="w-full mt-1 bg-amber-700 hover:bg-amber-600 text-white text-sm py-2 px-4 rounded-lg transition-colors disabled:opacity-40 font-medium"
              >
                {isLoading ? '⏳ Generating...' : '🎨 Generate with this Prompt'}
              </button>
            ) : null
          }
        />

        {/* CARD 4 — Last Image Prompt (post-generation, also editable) */}
        <EditableCard
          title="Last Image Prompt"
          titleColor="text-indigo-400"
          borderColor="border-indigo-900/50"
          textColor="text-indigo-200/70"
          value={liveImagePrompt}
          placeholder="Waiting for prompt generation..."
          onSave={(val) => setLiveImagePrompt(val)}
          height="h-40"
          extraActions={(currentVal) =>
            currentVal.trim() ? (
              <button
                onClick={() => handleGenerateWithPrompt(currentVal)}
                disabled={isLoading}
                className="w-full mt-1 bg-indigo-700 hover:bg-indigo-600 text-white text-sm py-2 px-4 rounded-lg transition-colors disabled:opacity-40 font-medium"
              >
                {isLoading ? '⏳ Generating...' : '🎨 Regenerate with this Prompt'}
              </button>
            ) : null
          }
        />
      </div>

      {/* ─── V2: EMOTION TIMELINE ──────────────────────────────────── */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 overflow-hidden">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Emotion Arc
        </h2>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 h-12">
          {emotionHistory.length === 0 ? (
            <p className="text-gray-600 italic text-xs">No emotion data yet...</p>
          ) : (
            emotionHistory.map((entry, idx) => (
              <div
                key={entry.timestamp}
                className="flex items-center animate-slide-in"
                title={`${entry.emotion} (${entry.score}/100)`}
              >
                <div
                  className={`w-7 h-7 rounded-full shadow-lg ${EMOTION_BADGE_COLORS[entry.emotion]}`}
                  style={{ opacity: 0.3 + (idx / emotionHistory.length) * 0.7 }}
                />
                {idx < emotionHistory.length - 1 && (
                  <div className="w-4 h-0.5 bg-gray-800 mx-1" />
                )}
              </div>
            ))
          )}
        </div>
        <style jsx>{`
          .animate-slide-in {
            animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          @keyframes slideInRight {
            0% { transform: translateX(20px); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </div>

      {/* ─── CYCLE STATS ───────────────────────────────────────────── */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Cycle Stats
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.totalCycles} />
          <StatCard label="Complete" value={stats.completedCycles} color="text-emerald-400" />
          <StatCard label="Skipped" value={stats.skippedCycles} color="text-amber-400" />
          <StatCard label="Fallback" value={stats.fallbackCount} color="text-orange-400" />
          <StatCard
            label="Avg Latency"
            value={stats.avgLatencyMs > 0 ? `${(stats.avgLatencyMs / 1000).toFixed(1)}s` : '—'}
          />
          <StatCard
            label="Last Cycle"
            value={stats.lastCycleLatencyMs > 0 ? `${(stats.lastCycleLatencyMs / 1000).toFixed(1)}s` : '—'}
          />
        </div>
      </div>

      {/* ─── CYCLE HISTORY ─────────────────────────────────────────── */}
      {cycleHistory.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Cycle History (last {Math.min(cycleHistory.length, 10)})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2 pr-4">Chunk ID</th>
                  <th className="text-left py-2 pr-4">Emotion</th>
                  <th className="text-left py-2 pr-4">Score</th>
                  <th className="text-left py-2 pr-4">Latency</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {cycleHistory.slice(0, 10).map((cycle) => (
                  <tr key={cycle.chunkId} className="border-b border-gray-800/50 hover:bg-gray-800/50">
                    <td className="py-2 pr-4 font-mono text-gray-400 text-xs">
                      {cycle.chunkId.slice(0, 8)}
                    </td>
                    <td className="py-2 pr-4">
                      {cycle.emotion ? (
                        <span className={`${EMOTION_BADGE_COLORS[cycle.emotion.emotion]} text-white text-xs px-2 py-0.5 rounded-full`}>
                          {cycle.emotion.emotion}
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-gray-300">
                      {cycle.emotion?.score ?? '—'}
                    </td>
                    <td className="py-2 pr-4 font-mono text-gray-300">
                      {(cycle.totalLatencyMs / 1000).toFixed(1)}s
                    </td>
                    <td className="py-2">
                      <StatusBadge status={cycle.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color = 'text-white',
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const badges: Record<string, { bg: string; text: string }> = {
    complete: { bg: 'bg-emerald-900/50', text: 'text-emerald-400' },
    skipped: { bg: 'bg-amber-900/50', text: 'text-amber-400' },
    fallback: { bg: 'bg-orange-900/50', text: 'text-orange-400' },
    error: { bg: 'bg-red-900/50', text: 'text-red-400' },
  };

  const badge = badges[status] || { bg: 'bg-gray-800', text: 'text-gray-400' };

  return (
    <span className={`${badge.bg} ${badge.text} text-xs px-2 py-0.5 rounded-full font-medium`}>
      {status}
    </span>
  );
}
