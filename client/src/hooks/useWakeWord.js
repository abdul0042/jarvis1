import { useEffect, useRef } from 'react';

export function useWakeWord({ enabled, phrase, onWake, modalActive }) {
  const recognitionRef = useRef(null);
  const activeRef = useRef(false);

  useEffect(() => {
    // If wake word is disabled or modal is active, turn off wake word microphone to avoid conflict
    if (!enabled || modalActive) {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
        activeRef.current = false;
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("[Wake Word] SpeechRecognition not supported in this browser.");
      return;
    }

    const startRecognition = () => {
      if (!enabled || modalActive) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const text = event.results[i][0].transcript.toLowerCase();
          const targetPhrase = (phrase || 'Hey JARVIS').toLowerCase();
          
          if (
            text.includes(targetPhrase) ||
            (targetPhrase === 'hey jarvis' && (
              text.includes('wake up jarvis') ||
              text.includes('hi jarvis') ||
              text.includes('hello jarvis') ||
              text.includes('hey charlie') || 
              text.includes('hey garvis') ||
              text.includes('garvis') ||
              text.includes('jarvis')
            ))
          ) {
            console.log("[Wake Word] Triggered phrase detected: ", text);
            // Disable end handler before stopping to prevent looping restart
            recognition.onend = null;
            recognition.stop();
            activeRef.current = false;
            onWake(text);
            break;
          }
        }
      };

      recognition.onend = () => {
        activeRef.current = false;
        // Keep listening by restarting on silence end
        if (enabled && !modalActive) {
          setTimeout(() => {
            if (enabled && !modalActive && !activeRef.current) {
              startRecognition();
            }
          }, 300);
        }
      };

      recognition.onerror = (e) => {
        console.warn("[Wake Word] Audio error: ", e.error);
        if (e.error === 'not-allowed') {
          recognition.onend = null;
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        activeRef.current = true;
      } catch (err) {
        console.error("[Wake Word] Start failure: ", err);
      }
    };

    startRecognition();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
        activeRef.current = false;
      }
    };
  }, [enabled, phrase, modalActive, onWake]);
}
