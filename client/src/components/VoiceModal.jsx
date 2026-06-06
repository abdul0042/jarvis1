import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useVoice } from '../hooks/useVoice';
import { executeAction } from '../utils/appExecutor';

const STYLE = `
  /* ── Jarvis Assistant Floating Panel ── */
  .ja-modal-overlay {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    font-family: 'Share Tech Mono', monospace;
    pointer-events: none;
  }

  .ja-card {
    width: 360px;
    max-height: 540px;
    background: #050a05;
    border: 1px solid #00ff41;
    box-shadow: 0 0 28px rgba(0, 255, 65, 0.4);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    pointer-events: auto;
  }

  .ja-header {
    background: #020702;
    border-bottom: 1px solid #00ff4133;
    padding: 9px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .ja-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ja-icon-box {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: #091809;
    border: 1px solid #00ff4144;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #00ff41;
    font-size: 13px;
  }

  .ja-title {
    color: #00ff41;
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 0.08em;
  }

  .ja-subtitle {
    color: #4a9e4a;
    font-size: 9px;
    letter-spacing: 0.05em;
    display: block;
    margin-top: 1px;
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
  .ja-close-btn:hover { color: #ff3131; }

  /* conversation thread */
  .ja-thread {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 120px;
    max-height: 280px;
    background-image: radial-gradient(circle, #00ff4108 1px, transparent 1px);
    background-size: 18px 18px;
  }
  .ja-thread::-webkit-scrollbar { width: 4px; }
  .ja-thread::-webkit-scrollbar-track { background: transparent; }
  .ja-thread::-webkit-scrollbar-thumb { background: #00ff4130; border-radius: 2px; }

  .ja-msg-user {
    align-self: flex-end;
    background: rgba(0, 255, 65, 0.1);
    border: 1px solid #00ff4144;
    border-radius: 6px 6px 0 6px;
    padding: 7px 11px;
    color: #00ff41;
    font-size: 11px;
    letter-spacing: 0.03em;
    max-width: 90%;
    line-height: 1.45;
  }

  .ja-msg-jarvis {
    align-self: flex-start;
    background: rgba(0, 20, 0, 0.6);
    border: 1px solid #00ff4122;
    border-radius: 6px 6px 6px 0;
    padding: 7px 11px;
    color: #a0ffa0;
    font-size: 11px;
    letter-spacing: 0.03em;
    max-width: 90%;
    line-height: 1.5;
  }

  .ja-msg-label {
    font-size: 9px;
    letter-spacing: 0.08em;
    margin-bottom: 3px;
    opacity: 0.55;
  }

  .ja-thinking {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 4px 0;
  }
  .ja-thinking span {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #00ff41;
    animation: ja-think 1.2s ease-in-out infinite;
  }
  .ja-thinking span:nth-child(2) { animation-delay: 0.2s; }
  .ja-thinking span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes ja-think {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
    40% { transform: scale(1); opacity: 1; }
  }

  .ja-empty {
    text-align: center;
    color: #2d6b2d;
    font-size: 10px;
    letter-spacing: 0.07em;
    padding: 20px 0;
    line-height: 1.7;
  }

  /* input tray */
  .ja-tray {
    border-top: 1px solid #00ff4122;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #020702;
    flex-shrink: 0;
  }

  .ja-input-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ja-input {
    flex: 1;
    background: #010401;
    border: 1px solid #00ff4144;
    color: #00ff41;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    padding: 7px 10px;
    border-radius: 3px;
    outline: none;
    transition: border-color 0.15s;
  }
  .ja-input:focus { border-color: #00ff41; box-shadow: 0 0 6px rgba(0,255,65,0.15); }
  .ja-input::placeholder { color: #2d6b2d; }

  .ja-mic-btn {
    background: transparent;
    border: 1px solid #00ff4144;
    color: #4a9e4a;
    font-size: 14px;
    padding: 6px 9px;
    cursor: pointer;
    border-radius: 3px;
    transition: all 0.15s;
    display: flex;
    align-items: center;
  }
  .ja-mic-btn:hover { border-color: #00ff41; color: #00ff41; }
  .ja-mic-btn.listening {
    border-color: #ff3131;
    color: #ff3131;
    background: rgba(255,49,49,0.07);
    animation: ja-mic-glow 1s ease-in-out infinite;
  }
  @keyframes ja-mic-glow {
    0%, 100% { box-shadow: 0 0 4px rgba(255,49,49,0.4); }
    50%       { box-shadow: 0 0 12px rgba(255,49,49,0.7); }
  }

  .ja-send-btn {
    background: #00ff41;
    color: #000;
    border: none;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    font-weight: bold;
    padding: 7px 12px;
    cursor: pointer;
    border-radius: 3px;
    letter-spacing: 0.06em;
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .ja-send-btn:hover { background: #00e039; }
  .ja-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .ja-tray-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ja-lang-btn {
    background: transparent;
    border: 1px solid #00ff4133;
    color: #4a9e4a;
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    padding: 3px 7px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.15s;
  }
  .ja-lang-btn:hover { border-color: #00ff41; color: #00ff41; }

  .ja-clap-btn {
    background: transparent;
    border: 1px solid #00ff4133;
    color: #4a9e4a;
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    padding: 3px 7px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.15s;
  }
  .ja-clap-btn.on { border-color: #00ff41; color: #00ff41; }

  .ja-footer-label {
    font-size: 9px;
    color: #2d6b2d;
    letter-spacing: 0.07em;
    text-align: center;
  }

  /* Mobile Responsiveness */
  @media (max-width: 500px) {
    .ja-modal-overlay {
      bottom: 10px;
      right: 10px;
      left: 10px;
      display: flex;
      justify-content: center;
    }
    .ja-card {
      width: 100%;
      max-width: 100%;
      max-height: 80vh;
    }
    .ja-thread {
      max-height: 40vh;
    }
  }
`;

export function VoiceModal({
  show,
  onClose,
  voicesList,
  selectedVoiceName,
  setSelectedVoiceName,
  clapActive,
  setClapActive,
  language,
  setLanguage,
  autoListenTrigger,
  apps = [],
  setApps,
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [userSalutation] = useLocalStorage('jarvis_user_salutation', 'Sir');
  const threadRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { isListening, transcript, startListening, stopListening, resetTranscript } = useVoice();

  // Watch for auto-listen trigger from wake word
  useEffect(() => {
    if (autoListenTrigger > 0 && !isListening) {
      startListening(language === 'tanglish' ? 'ta-IN' : 'en-US');
    }
  }, [autoListenTrigger]);

  // Inject styles once
  useEffect(() => {
    const styleId = 'ja-global-modal-style';
    let tag = document.getElementById(styleId);
    if (!tag) {
      tag = document.createElement('style');
      tag.id = styleId;
      document.head.appendChild(tag);
    }
    tag.textContent = STYLE;
  }, []);

  // Scroll thread to bottom on new messages
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Focus input when panel opens
  useEffect(() => {
    if (show) setTimeout(() => inputRef.current?.focus(), 100);
  }, [show]);

  // (Moved auto-submit useEffect below sendCommand definition)

  const speakReply = useCallback((text, onEnd) => {
    if (!window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
    if (!clean) {
      if (onEnd) onEnd();
      return;
    }
    const utt = new SpeechSynthesisUtterance(clean);
    if (onEnd) {
      utt.onend = onEnd;
      utt.onerror = onEnd;
    }
    const chosen = voicesList?.find(v => v.name === selectedVoiceName);
    if (chosen) {
      utt.voice = chosen;
      utt.lang = chosen.lang;
    } else {
      // Tanglish uses English characters, so an Indian English voice reads it perfectly.
      // Native Tamil voices (ta-IN) often stay silent if fed English characters on mobile.
      const isTamilScript = /[\u0b80-\u0bff]/.test(clean);
      if (language === 'tanglish' && !isTamilScript) {
        utt.lang = 'en-IN';
        const fallback = voicesList?.find(v => v.lang === 'en-IN' || v.name.includes('India'));
        if (fallback) utt.voice = fallback;
      } else if (isTamilScript) {
        utt.lang = 'ta-IN';
        const fallback = voicesList?.find(v => v.lang.startsWith('ta'));
        if (fallback) utt.voice = fallback;
      } else {
        utt.lang = 'en-US';
        const fallback = voicesList?.find(v => v.lang.startsWith('en'));
        if (fallback) utt.voice = fallback;
      }
    }
    utt.rate = 1.05;
    utt.pitch = 0.95;
    window.speechSynthesis.speak(utt);
  }, [voicesList, selectedVoiceName, language]);

  const sendCommand = useCallback(async (text) => {
    if (!text.trim() || isThinking) return;

    const lowerText = text.trim().toLowerCase();
    const isStopCommand = lowerText === 'stop' || lowerText === 'cancel' || lowerText === 'shut up' ||
      ((lowerText.includes('stop') || lowerText.includes('cancel') || lowerText.includes('shut up')) && lowerText.length < 25);

    if (isStopCommand) {
      window.speechSynthesis.cancel();
      stopListening();
      setMessages(prev => [...prev, { role: 'user', text: text.trim(), ts: Date.now() }, { role: 'jarvis', text: '[System Sleep Activated]', ts: Date.now() }]);
      setInputText('');
      if (onClose) onClose();
      return;
    }

    const userMsg = { role: 'user', text: text.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);
    stopListening();

    try {
      const sanitizedApps = apps.map(a => ({ name: a.name, baseUrl: a.baseUrl, description: a.description }));
      const history = messages.map(m => ({
        role: m.role === 'jarvis' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      // Step 1: Ask the chat endpoint
      const response = await fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history, connectedApps: sanitizedApps, language, userSalutation })
      });
      const data = await response.json();

      let replyText;
      let uiActionToRun = null;

      if (data.type === 'ui_action' && data.ui_action) {
        uiActionToRun = data.ui_action;
        replyText = data.explanation || `UI action ${uiActionToRun} executed.`;
      } else if (data.type === 'action' && data.action) {
        // Step 2: Action response — find the app and execute it
        const action = data.action;
        const matchingApp = apps.find(app =>
          app.name.toLowerCase() === action.app.toLowerCase() ||
          app.name.toLowerCase().includes(action.app.toLowerCase()) ||
          action.app.toLowerCase().includes(app.name.toLowerCase())
        );

        if (!matchingApp) {
          replyText = `App "${action.app}" is not connected. Please connect it in Integrations.`;
        } else {
          const apiResult = await executeAction(matchingApp, action);
          const MAX_CHARS = 10000;
          const rawStr = JSON.stringify(apiResult.data, null, 2) || '{}';
          const resultStr = rawStr.length > MAX_CHARS ? rawStr.substring(0, MAX_CHARS) + '\n...[truncated]' : rawStr;

          if (!apiResult.status || apiResult.status >= 400 || apiResult.error) {
            const errMsg = apiResult.data?.error || apiResult.error || `API returned status ${apiResult.status}`;
            replyText = `The request to ${matchingApp.name} failed: ${errMsg}`;
          } else {
            // Step 3: Send result back to get plain-text summary
            const summaryPrompt = `Here is the result of the API call you just executed:

What was done: ${action.explanation || `${action.method} ${action.endpoint} on ${matchingApp.name}`}
HTTP Status: ${apiResult.status}

Data returned:
${resultStr}

User's original request: "${text.trim()}"

Instructions:
- Summarize the result clearly in plain text.
- Do NOT output JSON.
- Address the user as "${userSalutation}".`;

            const summaryResp = await fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: summaryPrompt, history: [], connectedApps: sanitizedApps, language, userSalutation })
            });
            const summaryData = await summaryResp.json();
            replyText = summaryData.text || summaryData.rawResponse || 'Done.';
          }
        }
      } else {
        replyText = data.text || data.rawResponse || 'Standing by.';
      }

      setMessages(prev => [...prev, { role: 'jarvis', text: replyText, ts: Date.now() }]);
      speakReply(replyText, () => {
        setTimeout(() => {
          if (uiActionToRun) {
            const UI_ACTION_MAP = {
              navigate_dashboard: '/',
              navigate_chat: '/chat',
              navigate_integrations: '/integrations',
              navigate_settings: '/settings',
            };

            if (UI_ACTION_MAP[uiActionToRun]) {
              navigate(UI_ACTION_MAP[uiActionToRun]);
            } else if (uiActionToRun === 'clear_chat') {
              setMessages([]);
            } else if (uiActionToRun === 'scroll_top') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (uiActionToRun === 'scroll_bottom') {
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            } else if (uiActionToRun === 'disconnect_app') {
              const targetApp = data.target_app || '';
              (async () => {
                try {
                  if (targetApp.toLowerCase() === 'gmail') {
                    await fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/tokens/gmail', { method: 'DELETE' });
                    localStorage.removeItem('jarvis_gmail_tokens');
                    if (setApps) setApps(prev => prev.filter(a => !a.isGmail && !a.name.toLowerCase().includes('gmail')));
                  } else if (targetApp.toLowerCase() === 'sheets' || targetApp.toLowerCase() === 'google sheets') {
                    await fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/tokens/sheets', { method: 'DELETE' });
                    localStorage.removeItem('jarvis_sheets_tokens');
                    if (setApps) setApps(prev => prev.filter(a => !a.isSheets && !a.name.toLowerCase().includes('sheet')));
                  } else {
                    const matchingApp = apps.find(app =>
                      app.name.toLowerCase() === targetApp.toLowerCase() ||
                      app.name.toLowerCase().includes(targetApp.toLowerCase()) ||
                      targetApp.toLowerCase().includes(app.name.toLowerCase())
                    );
                    if (matchingApp) {
                      await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + ''}/api/apps/${matchingApp.id}`, { method: 'DELETE' });
                      if (setApps) setApps(prev => prev.filter(app => app.id !== matchingApp.id));
                    }
                  }
                } catch (e) {
                  console.error('[VoiceModal] Disconnect error:', e);
                }
              })();
            }
          }
          if (show) startListening(language === 'tanglish' ? 'ta-IN' : 'en-US');
        }, 800);
      });
    } catch (err) {
      const errMsg = `Error: ${err.message || 'Could not reach VBOS.'}`;
      setMessages(prev => [...prev, { role: 'jarvis', text: errMsg, ts: Date.now() }]);
      speakReply(errMsg, () => {
        setTimeout(() => {
          if (show) startListening(language === 'tanglish' ? 'ta-IN' : 'en-US');
        }, 800);
      });
    } finally {
      setIsThinking(false);
    }
  }, [isThinking, messages, language, userSalutation, speakReply, stopListening, show, startListening, apps, navigate, onClose, setApps]);

  const unlockSpeech = () => {
    if (window.speechSynthesis) {
      const silentUtterance = new SpeechSynthesisUtterance('');
      silentUtterance.volume = 0;
      window.speechSynthesis.speak(silentUtterance);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    unlockSpeech();
    if (inputText.trim()) sendCommand(inputText.trim());
  };

  const handleMicToggle = () => {
    unlockSpeech();
    if (isListening) {
      stopListening();
    } else {
      startListening(language === 'tanglish' ? 'ta-IN' : 'en-US');
    }
  };

  // Auto-submit when mic transcript arrives (user finished speaking)
  useEffect(() => {
    if (transcript && transcript.trim()) {
      sendCommand(transcript.trim());
      resetTranscript();
    }
  }, [transcript, sendCommand, resetTranscript]);

  if (!show) return null;

  const fmt = ts => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="ja-modal-overlay">
      <div className="ja-card">

        {/* Header */}
        <div className="ja-header">
          <div className="ja-header-left">
            <div className="ja-icon-box">💬</div>
            <div>
              <div className="ja-title">VBOS Assistant</div>
              <span className="ja-subtitle">
                {isListening ? '🔴 Listening...' : isThinking ? '⚡ Thinking...' : 'Voice Commands Ready'}
              </span>
            </div>
          </div>
          <button type="button" className="ja-close-btn" onClick={onClose} title="Close">✕</button>
        </div>

        {/* Conversation thread */}
        <div className="ja-thread" ref={threadRef}>
          {messages.length === 0 && !isThinking && (
            <div className="ja-empty">
              Say or type a command.<br />
              VBOS will reply right here.
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={msg.role === 'user' ? 'ja-msg-user' : 'ja-msg-jarvis'}>
              <div className="ja-msg-label">
                {msg.role === 'user' ? `YOU · ${fmt(msg.ts)}` : `VBOS · ${fmt(msg.ts)}`}
              </div>
              {msg.text}
            </div>
          ))}

          {isThinking && (
            <div className="ja-msg-jarvis">
              <div className="ja-msg-label">VBOS · thinking</div>
              <div className="ja-thinking">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        {/* Input tray */}
        <div className="ja-tray">
          <form className="ja-input-row" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="ja-input"
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Type or speak...'}
              disabled={isThinking}
            />
            <button
              type="button"
              className={`ja-mic-btn${isListening ? ' listening' : ''}`}
              onClick={handleMicToggle}
              title={isListening ? 'Stop' : 'Start mic'}
            >
              {isListening ? '■' : '🎙'}
            </button>
            <button
              type="submit"
              className="ja-send-btn"
              disabled={!inputText.trim() || isThinking}
            >
              SEND ▶
            </button>
          </form>

          <div className="ja-tray-controls">
            <button
              type="button"
              className={`ja-clap-btn${clapActive ? ' on' : ''}`}
              onClick={() => setClapActive(!clapActive)}
            >
              👏 {clapActive ? 'CLAP ON' : 'CLAP OFF'}
            </button>
            <button
              type="button"
              className="ja-lang-btn"
              onClick={() => setLanguage(language === 'english' ? 'tanglish' : 'english')}
            >
              {language === 'english' ? 'ENG 🇬🇧' : 'TANG 🇮🇳'}
            </button>
            <button
              type="button"
              className="ja-lang-btn"
              onClick={() => setMessages([])}
              title="Clear conversation"
            >
              CLR ✕
            </button>
          </div>
          <div className="ja-footer-label">VBOS // INLINE ASSISTANT ACTIVE</div>
        </div>

      </div>
    </div>
  );
}
