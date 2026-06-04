import React, { useEffect, useRef, useState } from 'react';
import { VoiceInput } from './VoiceInput';
import { ResponseViewer } from './ResponseViewer';
import { useLocalStorage } from '../hooks/useLocalStorage';

/* ─────────────────────────────────────────
   Terminal chat styles
───────────────────────────────────────── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

/* ── outer panel ── */
.ch-panel {
  font-family: 'Share Tech Mono', monospace;
  background: #050a05;
  border: 1px solid #00ff41;
  box-shadow: 0 0 12px #00ff4144;
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 140px);
  min-height: 420px;
  overflow: hidden;
}

/* ── header bar ── */
.ch-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  height: 38px;
  border-bottom: 1px solid #00ff4155;
  background: #030803;
  flex-shrink: 0;
  position: relative;
}
/* scanline on header */
.ch-header::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(0,255,65,0.018) 2px, rgba(0,255,65,0.018) 4px
  );
  pointer-events: none;
}
.ch-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 0.13em;
  color: #00ff41;
}
.ch-header-line {
  width: 60px;
  border-top: 1px solid #00ff4144;
}

@keyframes ch-blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
.ch-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #00ff41;
  box-shadow: 0 0 5px #00ff41;
  animation: ch-blink 1.1s step-end infinite;
}

.ch-clear-btn {
  background: transparent;
  border: 1px solid #00ff4144;
  color: #4a9e4a;
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  padding: 3px 9px;
  cursor: pointer;
  letter-spacing: 0.07em;
  transition: all 0.15s;
}
.ch-clear-btn:hover { color: #00ff41; border-color: #00ff41; background: #00ff4110; }

/* ── history panel ── */
@keyframes ch-slidein { from { transform: translateX(100%); opacity: 0; } to { transform: none; opacity: 1; } }
.ch-hist-panel {
  position: absolute;
  top: 38px;
  right: 0;
  bottom: 0;
  width: 340px;
  background: #020902;
  border-left: 1px solid #00ff4155;
  display: flex;
  flex-direction: column;
  z-index: 10;
  animation: ch-slidein 0.2s ease both;
  font-family: 'Share Tech Mono', monospace;
}
.ch-hist-header {
  padding: 10px 14px;
  border-bottom: 1px solid #00ff4133;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  letter-spacing: 0.14em;
  color: #4a9e4a;
  background: #010601;
  flex-shrink: 0;
}
.ch-hist-close {
  background: transparent;
  border: none;
  color: #4a9e4a;
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
  transition: color 0.15s;
}
.ch-hist-close:hover { color: #ff3131; }
.ch-hist-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  scrollbar-width: thin;
  scrollbar-color: #00ff4133 transparent;
}
.ch-hist-item {
  padding: 10px 14px;
  border-bottom: 1px solid #00ff4111;
  cursor: pointer;
  transition: background 0.1s;
}
.ch-hist-item:hover { background: #00ff4108; }
.ch-hist-item:last-child { border-bottom: none; }
.ch-hist-ts { font-size: 9px; color: #1d4d1d; letter-spacing: 0.06em; margin-bottom: 3px; }
.ch-hist-q  { font-size: 11px; color: #00ff41; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ch-hist-a  { font-size: 10px; color: #2d6b2d; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ch-hist-empty { padding: 40px 20px; text-align: center; color: #1d4d1d; font-size: 11px; letter-spacing: 0.08em; }

/* ── message list ── */
.ch-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
  scrollbar-color: #00ff4133 transparent;
}
.ch-messages::-webkit-scrollbar { width: 3px; }
.ch-messages::-webkit-scrollbar-thumb { background: #00ff4133; }

/* ── empty state ── */
.ch-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #2d6b2d;
  font-size: 12px;
  letter-spacing: 0.07em;
  text-align: center;
  padding: 40px 20px;
}
.ch-empty-title {
  color: #4a9e4a;
  font-size: 14px;
  letter-spacing: 0.15em;
  margin-bottom: 4px;
}

/* ── system message ── */
@keyframes ch-fadein { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
.ch-sys-row {
  display: flex;
  justify-content: center;
  animation: ch-fadein 0.25s ease both;
}
.ch-sys-pill {
  border: 1px solid #00ff4125;
  background: #020702;
  color: #4a9e4a;
  font-size: 10px;
  letter-spacing: 0.08em;
  padding: 3px 14px;
}
.ch-sys-pill-done {
  border: 1px solid #00ff41;
  background: #011601;
  color: #00ff41;
  font-size: 10px;
  letter-spacing: 0.12em;
  padding: 4px 18px;
  box-shadow: 0 0 10px #00ff4133;
  animation: ch-fadein 0.3s ease both;
}

/* ── JARVIS message (left) ── */
.ch-row-jarvis {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 78%;
  align-self: flex-start;
  animation: ch-fadein 0.25s ease both;
  gap: 3px;
}

/* ── USER message (right) ── */
.ch-row-user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  max-width: 78%;
  align-self: flex-end;
  animation: ch-fadein 0.25s ease both;
  gap: 3px;
}

/* ── prefix label ── */
.ch-prefix {
  font-size: 9px;
  letter-spacing: 0.12em;
  padding: 0 2px;
}
.ch-row-jarvis .ch-prefix { color: #4a9e4a; }
.ch-row-user   .ch-prefix { color: #00ff41; }

/* ── bubble ── */
.ch-bubble {
  padding: 9px 13px;
  font-size: 12px;
  line-height: 1.75;
  color: #00ff41;
  word-break: break-word;
  white-space: pre-wrap;
  max-width: 100%;
  box-sizing: border-box;
}
.ch-row-jarvis .ch-bubble {
  border: 1px solid #00ff4144;
  background: #020702;
}
.ch-row-user .ch-bubble {
  border: 1px solid #00ff41;
  background: #031003;
  box-shadow: 0 0 8px #00ff4122;
}
.ch-bubble-err {
  border-color: #ff313155 !important;
  color: #ff3131 !important;
  background: #0a0202 !important;
}
.ch-bubble-greeting {
  font-style: italic;
  opacity: 0.8;
  color: #4a9e4a;
  border: 1px dashed #00ff4144 !important;
}

/* ── timestamp ── */
.ch-ts {
  font-size: 9px;
  color: #1d4d1d;
  letter-spacing: 0.05em;
  padding: 0 2px;
}

/* ── raw response viewer ── */
.ch-raw-toggle {
  background: transparent;
  border: 1px solid #00ff4133;
  color: #2d6b2d;
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  padding: 2px 8px;
  cursor: pointer;
  letter-spacing: 0.08em;
  transition: all 0.15s;
  margin-top: 4px;
  align-self: flex-start;
}
.ch-raw-toggle:hover {
  color: #00ff41;
  border-color: #00ff4166;
  background: #00ff4108;
}
.ch-raw-panel {
  margin-top: 6px;
  background: #010401;
  border: 1px solid #00ff4133;
  border-left: 3px solid #00ff4166;
  padding: 10px 12px;
  font-size: 10px;
  max-height: 280px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #00ff4133 transparent;
  animation: ch-fadein 0.2s ease both;
  max-width: 100%;
  box-sizing: border-box;
}
.ch-raw-section {
  margin-bottom: 10px;
}
.ch-raw-section:last-child { margin-bottom: 0; }
.ch-raw-section-title {
  color: #4a9e4a;
  font-size: 9px;
  letter-spacing: 0.14em;
  margin-bottom: 4px;
  border-bottom: 1px solid #00ff4122;
  padding-bottom: 3px;
}
.ch-raw-code {
  color: #00ff41;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 10px;
  line-height: 1.5;
}

/* ── action block inside bubble ── */
.ch-action-inner {
  margin-top: 10px;
  border: 1px solid #00ff4133;
  background: #010401;
  padding: 8px 10px;
  font-size: 11px;
}
.ch-action-tag {
  font-size: 9px;
  letter-spacing: 0.12em;
  color: #00ff41;
  margin-bottom: 6px;
}
.ch-action-key { color: #4a9e4a; }
.ch-action-val { color: #00ff41; }

/* ── loading row — wave signal bars ── */
@keyframes ch-wave {
  0%,100% { transform: scaleY(0.2); opacity: 0.25; }
  50%     { transform: scaleY(1);   opacity: 1;    }
}
.ch-signal {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}
.ch-signal-bars {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 18px;
}
.ch-signal-bars span {
  display: block;
  width: 3px;
  height: 18px;
  background: #00ff41;
  box-shadow: 0 0 5px #00ff41;
  transform-origin: center bottom;
  animation: ch-wave 0.9s ease-in-out infinite;
  border-radius: 1px;
}
.ch-signal-bars span:nth-child(1) { animation-delay: 0.00s; height: 10px; }
.ch-signal-bars span:nth-child(2) { animation-delay: 0.15s; height: 16px; }
.ch-signal-bars span:nth-child(3) { animation-delay: 0.30s; height: 20px; }
.ch-signal-bars span:nth-child(4) { animation-delay: 0.45s; height: 16px; }
.ch-signal-bars span:nth-child(5) { animation-delay: 0.60s; height: 10px; }
.ch-signal-label {
  font-size: 10px;
  color: #4a9e4a;
  letter-spacing: 0.1em;
}

/* ── input tray ── */
.ch-tray {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid #00ff4155;
  background: #020702;
  flex-shrink: 0;
}
.ch-input-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid #00ff4155;
  background: #010401;
  transition: border-color .15s, box-shadow .15s;
}
.ch-input-box:focus-within {
  border-color: #00ff41;
  box-shadow: 0 0 10px #00ff4133;
}
.ch-prompt {
  color: #4a9e4a;
  font-size: 13px;
  padding: 0 0 0 10px;
  user-select: none;
  flex-shrink: 0;
  line-height: 1;
}
.ch-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  color: #00ff41;
  caret-color: #00ff41;
  padding: 10px 10px;
  letter-spacing: 0.04em;
}
.ch-input::placeholder { color: #2a5a2a; }
.ch-input:disabled { opacity: .45; }

.ch-send {
  background: #000;
  border: none;
  border-left: 1px solid #00ff4155;
  color: #00ff41;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  padding: 10px 14px;
  cursor: pointer;
  letter-spacing: 0.08em;
  transition: background .15s, color .15s;
  flex-shrink: 0;
  height: 100%;
}
.ch-send:hover:not(:disabled) { background: #00ff4115; }
.ch-send:disabled { opacity: .3; cursor: default; }

/* ── Jarvis Assistant Card Modal ── */
.ja-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(3px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ch-fadein 0.2s ease both;
}

.ja-card {
  width: 320px;
  background: #050a05;
  border: 1px solid #00ff41;
  box-shadow: 0 0 20px rgba(0, 255, 65, 0.25);
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Share Tech Mono', monospace;
  display: flex;
  flex-direction: column;
}

.ja-header {
  background: #020702;
  border-bottom: 1px solid #00ff4133;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ja-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ja-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #091809;
  border: 1px solid #00ff4144;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00ff41;
  font-size: 16px;
}

.ja-header-text {
  display: flex;
  flex-direction: column;
}

.ja-title {
  color: #00ff41;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 0.08em;
  line-height: 1.2;
}

.ja-subtitle {
  color: #4a9e4a;
  font-size: 9px;
  letter-spacing: 0.05em;
}

.ja-close-btn {
  background: transparent;
  border: none;
  color: #4a9e4a;
  font-size: 15px;
  cursor: pointer;
  transition: color 0.15s;
  padding: 0 4px;
}
.ja-close-btn:hover {
  color: #ff3131;
}

.ja-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background-image: radial-gradient(circle, #00ff4108 1px, transparent 1px);
  background-size: 16px 16px;
}

.ja-mic-circle {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #091809;
  border: 2px solid #00ff41;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00ff41;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(0, 255, 65, 0.15);
  transition: all 0.2s;
  position: relative;
}
.ja-mic-circle:hover {
  background: #00ff4115;
  box-shadow: 0 0 16px rgba(0, 255, 65, 0.35);
}

.ja-mic-pulse {
  position: absolute;
  inset: -1px;
  border-radius: 50%;
  border: 2px solid #ff3131;
  animation: ja-pulse-ring 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

@keyframes ja-pulse-ring {
  75%, 100% {
    transform: scale(1.45);
    opacity: 0;
  }
}

.ja-inner-box {
  background: #020702;
  border: 1px solid #00ff4122;
  border-radius: 6px;
  padding: 16px 14px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  box-sizing: border-box;
}

.ja-speaker-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #091809;
  border: 1px solid #00ff4133;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00ff41;
  font-size: 14px;
}

.ja-box-title {
  color: #00ff41;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 0.05em;
}

.ja-box-desc {
  color: #4a9e4a;
  font-size: 10px;
  line-height: 1.4;
  letter-spacing: 0.01em;
}

.ja-btn {
  background: #00ff41;
  color: #000;
  border: none;
  border-radius: 3px;
  padding: 8px 0;
  width: 100%;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 0 8px rgba(0, 255, 65, 0.25);
}
.ja-btn:hover {
  background: #00e039;
  box-shadow: 0 0 12px rgba(0, 255, 65, 0.45);
}

.ja-btn-listening {
  background: #0a0202;
  border: 1px solid #ff3131;
  color: #ff3131;
  box-shadow: 0 0 8px rgba(255, 49, 49, 0.2);
}
.ja-btn-listening:hover {
  background: #ff313115;
  box-shadow: 0 0 12px rgba(255, 49, 49, 0.35);
}

.ja-footer {
  border-top: 1px solid #00ff4112;
  padding: 8px;
  text-align: center;
  color: #2d6b2d;
  font-size: 9px;
  letter-spacing: 0.05em;
}
`;

function useChatStyle() {
  useEffect(() => {
    const id = 'ch-v2-style';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = STYLE;
      document.head.appendChild(el);
    }
    return () => document.getElementById(id)?.remove();
  }, []);
}

export function Chat({
  messages,
  isLoading,
  onSendMessage,
  connectedApps,
  clearChat,
  history = [],
  showHistoryInitially = false,
  initialInputText = ''
}) {
  useChatStyle();

  const [inputText, setInputText] = useState(initialInputText);
  const [showHistory, setShowHistory] = useState(showHistoryInitially);
  const [expandedRaw, setExpandedRaw] = useState(new Set());

  const toggleRaw = (id) => {
    setExpandedRaw(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (showHistoryInitially) {
      setShowHistory(true);
    }
  }, [showHistoryInitially]);

  useEffect(() => {
    if (initialInputText) {
      setInputText(initialInputText);
    }
  }, [initialInputText]);

  const handleHistoryItemClick = (item) => {
    if (item.userMessage) {
      setInputText(item.userMessage);
    }
  };
  const [speechEnabled, setSpeechEnabled] = useLocalStorage('jarvis_speech_enabled', false);
  const [language, setLanguage] = useLocalStorage('jarvis_language', 'english');
  const [clapActive, setClapActive] = useLocalStorage('jarvis_clap_active', false);
  const [selectedVoiceName, setSelectedVoiceName] = useLocalStorage('jarvis_selected_voice_name', '');
  const [voicesList, setVoicesList] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const prevIsLoadingRef = useRef(isLoading);

  // Load and subscribe to speechSynthesis voices changes
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const updateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      setVoicesList(allVoices);
      if (allVoices.length > 0 && !selectedVoiceName) {
        const defaultVoice = allVoices.find(v => v.default) || allVoices[0];
        setSelectedVoiceName(defaultVoice.name);
      }
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedVoiceName, setSelectedVoiceName]);

  const handleStartListening = () => {
    window.dispatchEvent(new CustomEvent('launch-jarvis-assistant'));
  };

  // Clean and speak text helper
  const speakText = (text, onEndCallback) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    
    // Clean text: strip out markdown backticks, asterisks, URLs, etc. so it sounds cleaner.
    let cleanText = text
      .replace(/```[\s\S]*?```/g, '') // remove code blocks
      .replace(/`([^`]+)`/g, '$1')     // remove inline backticks
      .replace(/\*([^*]+)\*/g, '$1')   // remove single asterisks
      .replace(/\*\*([^*]+)\*\*/g, '$1') // remove double asterisks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove markdown links
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (onEndCallback) {
      utterance.onend = onEndCallback;
    }
    
    // Try to find selected voice by name
    const chosenVoice = voicesList.find(v => v.name === selectedVoiceName);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else {
      // Fallback selection: If Tanglish output or Tamil script exists, choose Tamil voice.
      const isTamilText = /[\u0b80-\u0bff]/.test(cleanText);
      if (language === 'tanglish' || isTamilText) {
        utterance.lang = 'ta-IN';
        const tamilVoice = voicesList.find(voice => voice.lang.startsWith('ta'));
        const indianEngVoice = voicesList.find(voice => voice.lang === 'en-IN' || voice.name.includes('India'));
        
        if (tamilVoice) {
          utterance.voice = tamilVoice;
        } else if (indianEngVoice) {
          utterance.voice = indianEngVoice;
          utterance.lang = 'en-IN';
        } else {
          const fallbackEng = voicesList.find(voice => voice.lang.startsWith('en'));
          if (fallbackEng) {
            utterance.voice = fallbackEng;
            utterance.lang = fallbackEng.lang;
          }
        }
      } else {
        utterance.lang = 'en-US';
        // Prioritize Indian English voices first if available, then fallback
        const preferredVoice = voicesList.find(voice => 
          voice.lang === 'en-IN' || 
          voice.name.includes('India') ||
          voice.name.includes('Google US English') || 
          voice.name.includes('Microsoft Zira') || 
          voice.lang === 'en-US'
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
          utterance.lang = preferredVoice.lang;
        }
      }
    }
    
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  // Auto-focus input when AI finishes responding (isLoading: true → false)
  useEffect(() => {
    if (prevIsLoadingRef.current === true && isLoading === false) {
      inputRef.current?.focus();
    }
    prevIsLoadingRef.current = isLoading;
  }, [isLoading]);


  // Speak new incoming messages if enabled
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.sender === 'jarvis' && speechEnabled) {
        speakText(lastMessage.text);
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, speechEnabled]);

  // Cancel speech on disable
  useEffect(() => {
    if (!speechEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [speechEnabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim(), language);
    setInputText('');
  };

  const fmt = (ts) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  };

  return (
    <div className="ch-panel">



      {/* ── Header ── */}
      <div className="ch-header">
        <div className="ch-header-left">
          <span>┌─[</span>
          <span>INTERACTIVE TERMINAL</span>
          <span>]─</span>
          <span className="ch-header-line" />
          <span className="ch-dot" />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="ch-clear-btn"
            onClick={() => setLanguage(language === 'english' ? 'tanglish' : 'english')}
            style={{ color: '#00ff41' }}
          >
            [ LANG: {language === 'english' ? 'ENGLISH 🇬🇧' : 'TANGLISH 🇮🇳'} ]
          </button>
          <button
            type="button"
            className="ch-clear-btn"
            onClick={() => setClapActive(!clapActive)}
            style={{
              color: clapActive ? '#00ff41' : '#4a9e4a',
              borderColor: clapActive ? '#00ff41' : '#00ff4144',
              boxShadow: clapActive ? '0 0 6px #00ff4133' : 'none'
            }}
          >
            {clapActive ? '[ 👏 CLAP: ACTIVE ]' : '[ 👏 CLAP: MUTED ]'}
          </button>
          <button 
            className="ch-clear-btn" 
            type="button" 
            onClick={() => setSpeechEnabled(!speechEnabled)}
            style={{ 
              color: speechEnabled ? '#00ff41' : '#4a9e4a',
              borderColor: speechEnabled ? '#00ff41' : '#00ff4144',
              boxShadow: speechEnabled ? '0 0 6px #00ff4133' : 'none'
            }}
          >
            {speechEnabled ? '[ 🔊 SOUND: ON ]' : '[ 🔇 SOUND: OFF ]'}
          </button>
          <button className="ch-clear-btn" type="button" onClick={clearChat}>[ CLEAR ]</button>
          <button
            className="ch-clear-btn"
            type="button"
            onClick={() => setShowHistory(h => !h)}
            style={{
              color: showHistory ? '#00ff41' : '#4a9e4a',
              borderColor: showHistory ? '#00ff41' : '#00ff4144',
              boxShadow: showHistory ? '0 0 6px #00ff4133' : 'none'
            }}
          >
            [ 📜 HISTORY{history.length > 0 ? ` (${history.length})` : ''} ]
          </button>
        </div>
      </div>

      {/* ── History side panel ── */}
      {showHistory && (
        <div className="ch-hist-panel">
          <div className="ch-hist-header">
            <span>// COMMAND HISTORY</span>
            <button className="ch-hist-close" onClick={() => setShowHistory(false)}>✕</button>
          </div>
          <div className="ch-hist-list">
            {history.length === 0 ? (
              <div className="ch-hist-empty">&gt; No history yet.<br />Complete a command to see it here.</div>
            ) : (
              [...history].map((item, i) => (
                <div
                  key={item.id || i}
                  className="ch-hist-item"
                  onClick={() => handleHistoryItemClick(item)}
                >
                  <div className="ch-hist-ts">
                    [{item.timestamp ? new Date(item.timestamp).toLocaleString() : 'unknown'}]
                  </div>
                  <div className="ch-hist-q">&gt; {item.userMessage || 'Unknown command'}</div>
                  {item.aiSummary && (
                    <div className="ch-hist-a">{item.aiSummary}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="ch-messages">

        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="ch-empty">
            <div className="ch-empty-title">JARVIS TERMINAL READY</div>
            <div>&gt; Awaiting command input...</div>
            <div style={{ fontSize: 10, marginTop: 4, color: '#1d4d1d' }}>
              Type below or use voice input to issue a command
            </div>
          </div>
        )}

        {messages.map((msg) => {
          /* system / orchestrator message */
          if (msg.sender === 'system') {
            const isDone = msg.text?.startsWith('✓');
            return (
              <div key={msg.id} className="ch-sys-row">
                <div className={isDone ? 'ch-sys-pill-done' : 'ch-sys-pill'}>&gt; {msg.text}</div>
              </div>
            );
          }

          const isUser = msg.sender === 'user';
          const rowClass = isUser ? 'ch-row-user' : 'ch-row-jarvis';

          return (
            <div key={msg.id} className={rowClass}>
              {/* prefix */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="ch-prefix">{isUser ? '[USER]' : '[JARVIS]'}</div>
                {!isUser && (
                  <button 
                    onClick={() => speakText(msg.text)} 
                    title="Speak text"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#4a9e4a',
                      cursor: 'pointer',
                      fontSize: 10,
                      padding: '0 4px',
                      display: 'flex',
                      alignItems: 'center',
                      fontFamily: "'Share Tech Mono', monospace"
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#00ff41'}
                    onMouseLeave={(e) => e.target.style.color = '#4a9e4a'}
                  >
                    🔊 [LISTEN]
                  </button>
                )}
              </div>

              {/* bubble */}
              <div className={`ch-bubble ${msg.isError ? 'ch-bubble-err' : ''} ${msg.isGreeting ? 'ch-bubble-greeting' : ''}`}>
                {msg.text}
              </div>

              {/* Render PDF/Sheets preview card if message contains a Google Sheets link */}
              {(() => {
                if (msg.sender !== 'jarvis') return null;
                const sheetMatch = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(msg.text);
                if (!sheetMatch) return null;
                const spreadsheetId = sheetMatch[1];
                const titleMatch = /Title:\s*["']([^"']+)["']/i.exec(msg.text);
                const sheetTitle = titleMatch ? titleMatch[1] : "WooCommerce Weekly Report";
                const pdfUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=pdf`;
                const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

                return (
                  <div className="ch-doc-preview-card" style={{
                    marginTop: 10,
                    marginBottom: 10,
                    background: '#040d05',
                    border: '1px solid #00ff4155',
                    borderLeft: '4px solid #0f9d58', // Sheets green
                    boxShadow: '0 0 10px #00ff4122',
                    padding: '12px 16px',
                    borderRadius: '2px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    maxWidth: '460px',
                    animation: 'ch-slidein 0.3s ease both'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        fontSize: '24px',
                        color: '#0f9d58',
                        filter: 'drop-shadow(0 0 4px #0f9d5844)'
                      }}>
                        📊
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: '#00ff41',
                          fontSize: '11px',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          opacity: 0.8,
                          marginBottom: 2
                        }}>
                          Google Sheets Document
                        </div>
                        <div style={{
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }} title={sheetTitle}>
                          {sheetTitle}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginTop: 4
                    }}>
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ch-clear-btn"
                        style={{
                          background: '#0f9d5815',
                          borderColor: '#0f9d5888',
                          color: '#0f9d58',
                          textDecoration: 'none',
                          padding: '5px 12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#0f9d5833';
                          e.target.style.borderColor = '#0f9d58';
                          e.target.style.boxShadow = '0 0 8px #0f9d5855';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#0f9d5815';
                          e.target.style.borderColor = '#0f9d5888';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        [ 📥 VIEW/DOWNLOAD PDF ]
                      </a>
                      
                      <a
                        href={sheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#4a9e4a',
                          fontSize: '11px',
                          textDecoration: 'none',
                          borderBottom: '1px dashed #4a9e4a',
                          cursor: 'pointer',
                          transition: 'color 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.color = '#00ff41';
                          e.target.style.borderBottomColor = '#00ff41';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = '#4a9e4a';
                          e.target.style.borderBottomColor = '#4a9e4a';
                        }}
                      >
                        Open Spreadsheet ➔
                      </a>
                    </div>
                  </div>
                );
              })()}

              {/* Raw response viewer */}
              {!isUser && msg.apiResponse && (
                <>
                  <button
                    className="ch-raw-toggle"
                    onClick={() => toggleRaw(msg.id)}
                  >
                    {expandedRaw.has(msg.id) ? '[ ▲ HIDE RAW ]' : '[ ▼ VIEW RAW RESPONSE ]'}
                  </button>
                  {expandedRaw.has(msg.id) && (
                    <div className="ch-raw-panel">
                      {/* Status */}
                      <div className="ch-raw-section">
                        <div className="ch-raw-section-title">// HTTP STATUS</div>
                        <div className="ch-raw-code">
                          {msg.apiResponse.status} {msg.apiResponse.statusText || ''}
                        </div>
                      </div>
                      {/* Headers */}
                      {msg.apiResponse.headers && (
                        <div className="ch-raw-section">
                          <div className="ch-raw-section-title">// RESPONSE HEADERS</div>
                          <div className="ch-raw-code">
                            {Object.entries(msg.apiResponse.headers)
                              .filter(([k]) => !['set-cookie','connection','transfer-encoding'].includes(k))
                              .map(([k, v]) => `${k}: ${v}`)
                              .join('\n')}
                          </div>
                        </div>
                      )}
                      {/* Data */}
                      <div className="ch-raw-section">
                        <div className="ch-raw-section-title">// RESPONSE DATA</div>
                        <div className="ch-raw-code">
                          {JSON.stringify(msg.apiResponse.data, null, 2)}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* timestamp */}
              <div className="ch-ts">[{fmt(msg.timestamp)}]</div>
            </div>
          );
        })}

        {/* Loading row */}
        {isLoading && (
          <div className="ch-row-jarvis">
            <div className="ch-prefix">[JARVIS]</div>
            <div className="ch-bubble">
              <div className="ch-signal">
                <div className="ch-signal-bars">
                  <span /><span /><span /><span /><span />
                </div>
                <span className="ch-signal-label">PROCESSING SIGNAL...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Tray ── */}
      <form className="ch-tray" onSubmit={handleSubmit}>
        <div className="ch-input-box">
          <span className="ch-prompt">&gt;_</span>
          <input
            ref={inputRef}
            className="ch-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={
              connectedApps.length === 0
                ? 'Connect an app in Integrations first...'
                : 'Issue a command to JARVIS...'
            }
          />
          <VoiceInput
            isListening={false}
            onStart={handleStartListening}
            onStop={() => {}}
            error={null}
            browserSupported={true}
          />
          <button
            type="submit"
            className="ch-send"
            disabled={!inputText.trim() || isLoading}
          >
            SEND ▶
          </button>
        </div>
      </form>

    </div>
  );
}
