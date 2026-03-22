// components/AudioCapture.tsx — Wrapper for audio capture hook (renders nothing visible)
'use client';

import { useAudioCapture } from '@/hooks/useAudioCapture';

export default function AudioCapture() {
  useAudioCapture();
  return null; // This component renders nothing — it just activates the hook
}
