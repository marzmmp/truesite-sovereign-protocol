// Clap detection — 2 amplitude spikes within 800ms triggers wake
import { useEffect, useRef, useCallback } from 'react';

export function useClapDetection({ onClap, enabled = true, threshold = 0.35 }) {
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const lastClapRef = useRef(0);
  const rafRef = useRef(null);
  const aboveThresholdRef = useRef(false);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    analyserRef.current = null;
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (!enabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);

      const detect = () => {
        analyser.getByteTimeDomainData(data);
        let max = 0;
        for (let i = 0; i < data.length; i++) {
          const v = Math.abs(data[i] - 128) / 128;
          if (v > max) max = v;
        }

        if (max > threshold && !aboveThresholdRef.current) {
          aboveThresholdRef.current = true;
          const now = Date.now();
          const gap = now - lastClapRef.current;

          if (gap > 100 && gap < 800) {
            // Two claps detected
            onClap && onClap();
            lastClapRef.current = 0;
          } else {
            lastClapRef.current = now;
          }
        } else if (max < threshold * 0.5) {
          aboveThresholdRef.current = false;
        }

        rafRef.current = requestAnimationFrame(detect);
      };

      detect();
    } catch (e) {
      console.warn('[ClapDetection] Could not start:', e.message);
    }
  }, [enabled, threshold, onClap]);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  return { stop, restart: () => { stop(); start(); } };
}
