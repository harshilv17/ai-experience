// app/page.tsx — Projection view (fullscreen, dark)
'use client';

import { useSSE } from '@/hooks/useSSE';
import ProjectionDisplay from '@/components/ProjectionDisplay';
import AudioCapture from '@/components/AudioCapture';

export default function ProjectionPage() {
  useSSE();           // Connect to event stream and update store

  return (
    <main className="fixed inset-0 bg-black overflow-hidden">
      <AudioCapture />
      <ProjectionDisplay />
      {/* No other UI elements — fullscreen image only + overlay */}
    </main>
  );
}
