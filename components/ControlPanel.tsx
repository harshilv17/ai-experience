// components/ControlPanel.tsx — Operator command center
'use client';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import MicPicker from './MicPicker';
import type { ControlCommand, EmotionClass } from '@/types';

const EMOTION_BADGE_COLORS: Record<EmotionClass, string> = {
  Hope: 'bg-amber-500',
  Fear: 'bg-slate-600',
  Grief: 'bg-stone-600',
  Anger: 'bg-red-600',
  Renewal: 'bg-emerald-600',
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

export default function ControlPanel() {
  const state = useAppStore((s) => s.orchestratorState);
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
  const liveImagePrompt = useAppStore((s) => s.liveImagePrompt);
  const emotionHistory = useAppStore((s) => s.emotionHistory);

  const [isLoading, setIsLoading] = useState(false);
  const [healthResults, setHealthResults] = useState<Record<string, string> | null>(null);
  const [sseConnected] = useState(true);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const copyPrompt = useCallback(() => {
    if (liveImagePrompt) {
      navigator.clipboard.writeText(liveImagePrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  }, [liveImagePrompt]);

  const sendCommand = useCallback(async (cmd: ControlCommand) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd }),
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
            {(['whisper', 'gpt4o', 'dalle3'] as const).map((api) => {
              const status = healthResults
                ? healthResults[api] || 'unknown'
                : stats.apiStatus[api];
              return (
                <div key={api} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{api === 'gpt4o' ? 'GPT-4o' : api === 'dalle3' ? 'DALL-E 3' : 'Whisper'}</span>
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

        {/* Live toggle — large and prominent */}
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

      {/* ─── V2: LIVE TRANSCRIPT, PROMPT, & EMOTION TIMELINE ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD A — Live Transcript */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 transition-colors duration-300">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Latest Transcript
            </h2>
            <div className={`w-2 h-2 rounded-full bg-emerald-400 animate-pulse ${liveTranscript ? 'opacity-100' : 'opacity-0'}`} />
          </div>
          <div className="bg-black/50 rounded-lg p-3 h-32 overflow-y-auto border border-sky-900/30">
            {liveTranscript ? (
              <p className="text-gray-400 italic font-mono text-xs leading-relaxed">
                &quot;{liveTranscript}&quot;
              </p>
            ) : (
              <p className="text-gray-600 italic text-xs">Waiting for speech...</p>
            )}
          </div>
        </div>

        {/* CARD B — DALL-E 3 Prompt */}
        <div className="bg-gray-900 rounded-xl p-4 border border-indigo-900/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
              Last Image Prompt
            </h2>
            <button
              onClick={copyPrompt}
              disabled={!liveImagePrompt}
              className="text-xs bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 px-2 py-1 rounded transition-colors disabled:opacity-30"
            >
              {copiedPrompt ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div className="bg-black/50 rounded-lg p-3 h-32 overflow-y-auto border border-indigo-900/30">
            {liveImagePrompt ? (
              <p className="text-indigo-200/70 font-mono text-xs leading-relaxed">
                {liveImagePrompt}
              </p>
            ) : (
              <p className="text-indigo-900/50 italic text-xs">Waiting for prompt generation...</p>
            )}
          </div>
        </div>
      </div>

      {/* CARD C — Emotion Timeline */}
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
