// app/control/page.tsx — Operator control panel
'use client';

import { useSSE } from '@/hooks/useSSE';
import ControlPanel from '@/components/ControlPanel';
import AudioCapture from '@/components/AudioCapture';

export default function ControlPage() {
  useSSE(); // Control panel also needs live state updates

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4">
      <AudioCapture />
      <ControlPanel />
    </main>
  );
}
