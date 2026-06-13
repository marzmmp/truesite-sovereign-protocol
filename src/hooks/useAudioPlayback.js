// Audio playback — streams ElevenLabs TTS and plays it
import { useRef, useCallback, useState } from 'react';
import { API_BASE } from '../agents.js';

export function useAudioPlayback({ onSpeakStart, onSpeakEnd }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const queueRef = useRef([]);
  const playingRef = useRef(false);

  const playNext = useCallback(async () => {
    if (queueRef.current.length === 0 || playingRef.current) return;
    playingRef.current = true;

    const { agentId, text, onDone } = queueRef.current.shift();

    try {
      const res = await fetch(`${API_BASE}/api/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, agentId })
      });

      if (!res.ok) throw new Error(`TTS error: ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const audio = new Audio(url);
      audioRef.current = audio;
      setIsSpeaking(true);
      onSpeakStart && onSpeakStart(agentId);

      audio.onended = () => {
        URL.revokeObjectURL(url);
        setIsSpeaking(false);
        playingRef.current = false;
        onSpeakEnd && onSpeakEnd(agentId);
        onDone && onDone();
        // Play next in queue
        if (queueRef.current.length > 0) playNext();
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        playingRef.current = false;
        onSpeakEnd && onSpeakEnd(agentId);
        onDone && onDone();
        if (queueRef.current.length > 0) playNext();
      };

      await audio.play();
    } catch (e) {
      console.error('[AudioPlayback] Error:', e);
      setIsSpeaking(false);
      playingRef.current = false;
      onSpeakEnd && onSpeakEnd(agentId);
      onDone && onDone();
      if (queueRef.current.length > 0) playNext();
    }
  }, [onSpeakStart, onSpeakEnd]);

  const speak = useCallback((text, agentId) => {
    return new Promise((resolve) => {
      queueRef.current.push({ text, agentId, onDone: resolve });
      if (!playingRef.current) playNext();
    });
  }, [playNext]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    queueRef.current = [];
    playingRef.current = false;
    setIsSpeaking(false);
  }, []);

  return { speak, stopSpeaking, isSpeaking };
}
