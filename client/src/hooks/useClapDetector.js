import { useEffect, useRef } from 'react';

/**
 * Hook to detect physical claps using the browser's Web Audio API.
 * Uses a bandpass/highpass filter to isolate clap frequencies and RMS peak analysis.
 */
export function useClapDetector({ onClap, enabled = false }) {
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const lastClapTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    let isStopped = false;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (isStopped) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);

        // High-pass filter to reject low-frequency background noises like hums/voices
        const filter = audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1200, audioContext.currentTime);

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;

        source.connect(filter);
        filter.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkBuffer = () => {
          if (isStopped || !audioContextRef.current) return;
          analyser.getByteTimeDomainData(dataArray);

          let maxVal = 0;
          for (let i = 0; i < bufferLength; i++) {
            const val = Math.abs(dataArray[i] - 128); // 128 is center (silence)
            if (val > maxVal) maxVal = val;
          }

          const amplitude = maxVal / 128.0;

          // A quick loud clap typically spikes above 0.70 amplitude
          if (amplitude > 0.70) {
            const now = Date.now();
            // Debounce claps (at least 1.8 seconds space)
            if (now - lastClapTimeRef.current > 1800) {
              lastClapTimeRef.current = now;
              onClap();
            }
          }

          requestAnimationFrame(checkBuffer);
        };

        checkBuffer();
      } catch (err) {
        console.warn('[ClapDetector] Microphone access denied or Web Audio error:', err);
      }
    }

    initAudio();

    return () => {
      isStopped = true;
      cleanup();
    };
  }, [enabled, onClap]);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };
}
