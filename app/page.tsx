// app/page.tsx — Projection view (fullscreen, dark)
'use client';

import { useSSE } from '@/hooks/useSSE';
import { useAudioCapture } from '@/hooks/useAudioCapture';
import ProjectionDisplay from '@/components/ProjectionDisplay';

export default function ProjectionPage() {
  useSSE();           // Connect to event stream and update store
  useAudioCapture();  // Manage mic capture based on liveMode

  return (
    <main className="fixed inset-0 bg-black overflow-hidden">
      <ProjectionDisplay />
      {/* No other UI elements — fullscreen image only + overlay */}
    </main>
  );
}
