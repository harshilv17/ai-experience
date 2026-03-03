// components/MicPicker.tsx — Audio device selector
'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';

export default function MicPicker() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const selectedMicDeviceId = useAppStore((s) => s.selectedMicDeviceId);
  const setSelectedMic = useAppStore((s) => s.setSelectedMic);

  useEffect(() => {
    async function loadDevices() {
      try {
        // Request permission first (needed to get labels)
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices.filter((d) => d.kind === 'audioinput');
        setDevices(audioInputs);

        if (audioInputs.length === 0) {
          setError('No audio input devices found');
          return;
        }

        // Load from localStorage or select first
        const saved = localStorage.getItem('selected-mic-device-id');
        if (saved && audioInputs.some((d) => d.deviceId === saved)) {
          setSelectedMic(saved);
        } else if (audioInputs.length > 0) {
          setSelectedMic(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error('[MicPicker] Failed to enumerate devices:', err);
        setError('Failed to access audio devices. Please grant microphone permission.');
      }
    }

    loadDevices();

    // Listen for device changes
    const handleChange = () => loadDevices();
    navigator.mediaDevices.addEventListener('devicechange', handleChange);
    return () => navigator.mediaDevices.removeEventListener('devicechange', handleChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedMic(deviceId);
    localStorage.setItem('selected-mic-device-id', deviceId);
  };

  if (error) {
    return (
      <div className="text-amber-400 text-sm p-2 bg-amber-900/20 rounded border border-amber-800">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <select
      value={selectedMicDeviceId || ''}
      onChange={handleChange}
      className="w-full bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {devices.map((device) => (
        <option key={device.deviceId} value={device.deviceId}>
          {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
        </option>
      ))}
    </select>
  );
}
