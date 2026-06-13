// Voice capture — MediaRecorder + silence detection
import { useRef, useCallback, useState } from 'react';
import { API_BASE } from '../agents.js';

const SILENCE_MS = 700;    // stop recording after 700ms of silence
const MIN_RECORD_MS = 500; // min recording before checking silence
const NOISE_FLOOR = 0.015; // below this = silence

export function useVoiceCapture({ onTranscript, onListening, onProcessing }) {
  const [micLevel, setMicLevel] = useState(0);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const chunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const startTimeRef = useRef(0);
  const rafRef = useRef(null);
  const isListeningRef = useRef(false);

  const stopAll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  const transcribe = useCallback(async (blob) => {
    onProcessing && onProcessing(true);
    try {
      const res = await fetch(`${API_BASE}/api/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'audio/webm' },
        body: blob
      });
      const data = await res.json();
      const text = data.text?.trim();
      if (text && text.length > 1) {
        onTranscript && onTranscript(text);
      }
    } catch (e) {
      console.error('[VoiceCapture] Transcribe error:', e);
    } finally {
      onProcessing && onProcessing(false);
    }
  }, [onTranscript, onProcessing]);

  const startListening = useCallback(async () => {
    if (isListeningRef.current) return;
    isListeningRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up analyser for silence detection + mic level
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);

      // MediaRecorder
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      recorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        isListeningRef.current = false;
        onListening && onListening(false);
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          transcribe(blob);
        }
        // Cleanup
        stream.getTracks().forEach(t => t.stop());
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };

      recorder.start(100); // collect in 100ms chunks
      onListening && onListening(true);

      // Monitor level + silence
      const monitor = () => {
        analyser.getByteTimeDomainData(data);
        let rms = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          rms += v * v;
        }
        rms = Math.sqrt(rms / data.length);
        setMicLevel(Math.min(1, rms * 8));

        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed > MIN_RECORD_MS) {
          if (rms < NOISE_FLOOR) {
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                if (recorder.state === 'recording') recorder.stop();
                silenceTimerRef.current = null;
              }, SILENCE_MS);
            }
          } else {
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          }
        }

        rafRef.current = requestAnimationFrame(monitor);
      };
      monitor();

    } catch (e) {
      console.error('[VoiceCapture] Start error:', e);
      isListeningRef.current = false;
    }
  }, [onListening, transcribe]);

  const stopListening = useCallback(() => {
    stopAll();
    isListeningRef.current = false;
  }, [stopAll]);

  return { startListening, stopListening, micLevel, isListening: isListeningRef };
}
