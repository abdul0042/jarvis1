import { useState, useEffect, useRef } from 'react';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [browserSupported, setBrowserSupported] = useState(true);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check for SpeechRecognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false; // We just need one single command at a time
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    rec.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please check your browser permissions.');
      } else if (event.error === 'no-speech') {
        setError('No speech was detected. Please try again.');
      } else {
        setError(`Voice input error: ${event.error}`);
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
  }, []);

  const startListening = (lang = 'en-US') => {
    if (!browserSupported) {
      setError('Web Speech API is not supported in this browser.');
      return;
    }
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      recognitionRef.current.lang = lang;
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setError('Failed to start voice recognition.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const resetTranscript = () => {
    setTranscript('');
  };

  return {
    isListening,
    transcript,
    error,
    browserSupported,
    startListening,
    stopListening,
    resetTranscript
  };
}
