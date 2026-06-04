import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ChatPage } from './pages/ChatPage';
import { Settings } from './pages/Settings';
import { AppSettings } from './pages/AppSettings';
import { VoiceModal } from './components/VoiceModal';
import { useClapDetector } from './hooks/useClapDetector';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useWakeWord } from './hooks/useWakeWord';
import { useGemini } from './hooks/useGemini';
import { LoginPage } from './pages/LoginPage';

/* ─── App-shell terminal styles ─── */
const APP_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root {
    height: 100%;
    background: #000000;
    color: #00ff41;
    font-family: 'Share Tech Mono', monospace;
  }

  /* ── layout shell ── */
  .app-shell {
    display: flex;
    min-height: 100vh;
    background: #000000;
  }

  /* ── sidebar ── */
  .app-sidebar {
    width: 220px;
    flex-shrink: 0;
    background: rgba(4, 8, 4, 0.9);
    backdrop-filter: blur(10px);
    border-right: 1px solid rgba(0, 255, 65, 0.25);
    box-shadow: 2px 0 15px rgba(0, 255, 65, 0.05);
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
    z-index: 20;
  }

  /* logo area */
  .app-logo {
    padding: 18px 16px 14px;
    border-bottom: 1px solid rgba(0, 255, 65, 0.2);
  }
  .app-logo-bracket {
    color: rgba(0, 255, 65, 0.6);
    font-size: 11px;
    font-family: 'Share Tech Mono', monospace;
    letter-spacing: 0.12em;
    display: block;
    margin-bottom: 4px;
  }
  .app-logo-name {
    color: #00ff41;
    font-size: 18px;
    letter-spacing: 0.22em;
    text-shadow: 0 0 8px rgba(0, 255, 65, 0.6);
    display: block;
  }
  .app-logo-sub {
    color: rgba(0, 255, 65, 0.5);
    font-size: 9px;
    font-family: 'Share Tech Mono', monospace;
    letter-spacing: 0.18em;
    display: block;
    margin-top: 2px;
  }

  /* blink cursor after name */
  @keyframes app-caret {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  .app-caret {
    display: inline-block;
    width: 9px;
    height: 15px;
    background: #00ff41;
    vertical-align: middle;
    margin-left: 3px;
    animation: app-caret 1s step-end infinite;
    box-shadow: 0 0 6px #00ff41;
  }

  /* nav */
  .app-nav {
    flex: 1;
    padding: 20px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .app-nav-section {
    color: rgba(0, 255, 65, 0.35);
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    padding: 0 4px;
    margin-bottom: 4px;
    margin-top: 8px;
  }
  .app-nav-section:first-child { margin-top: 0; }

  .app-nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.08em;
    color: #4a9e4a;
    text-decoration: none;
    border: 1px solid transparent;
    border-radius: 2px;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .app-nav-link:hover {
    color: #00ff41;
    border-color: rgba(0, 255, 65, 0.25);
    background: rgba(0, 255, 65, 0.05);
  }
  .app-nav-link.active {
    color: #00ff41;
    border-color: #00ff41;
    background: rgba(0, 255, 65, 0.12);
    box-shadow: 0 0 10px rgba(0, 255, 65, 0.15);
  }
  .app-nav-link.active .app-nav-prefix {
    color: #00ff41;
    text-shadow: 0 0 4px rgba(0, 255, 65, 0.5);
  }
  .app-nav-prefix {
    color: #4a9e4a;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    transition: color 0.15s;
  }

  /* sidebar footer */
  .app-sidebar-footer {
    padding: 12px;
    border-top: 1px solid rgba(0, 255, 65, 0.25);
  }
  .app-sidebar-footer-box {
    border: 1px solid rgba(0, 255, 65, 0.15);
    background: rgba(0, 0, 0, 0.4);
    padding: 8px 10px;
    font-size: 10px;
    font-family: 'Share Tech Mono', monospace;
    color: #4a9e4a;
    letter-spacing: 0.06em;
    line-height: 1.6;
    border-radius: 2px;
  }
  .app-sidebar-footer-box span {
    color: #00ff41;
  }

  /* ── topbar ── */
  .app-topbar {
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border-bottom: 1px solid rgba(0, 255, 65, 0.25);
    background: rgba(2, 5, 2, 0.95);
    backdrop-filter: blur(8px);
    position: sticky;
    top: 0;
    z-index: 10;
    flex-shrink: 0;
  }

  .app-topbar-route {
    color: #4a9e4a;
    font-size: 11px;
    letter-spacing: 0.14em;
    font-family: 'Share Tech Mono', monospace;
  }
  .app-topbar-route span {
    color: #00ff41;
    font-weight: bold;
    text-shadow: 0 0 4px rgba(0, 255, 65, 0.4);
  }

  .app-topbar-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 10px;
    font-family: 'Share Tech Mono', monospace;
    color: #00ff66;
    letter-spacing: 0.06em;
    border: 1px solid rgba(0, 255, 102, 0.35);
    background: rgba(0, 255, 102, 0.03);
    padding: 4px 10px;
    border-radius: 2px;
  }

  @keyframes app-pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 6px #00ff66; }
    50%       { opacity: 0.3; box-shadow: none; }
  }
  .app-status-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #00ff66;
    animation: app-pulse 1.8s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* ── JARVIS active topbar pill ── */
  @keyframes jarvis-pill-pulse {
    0%, 100% { box-shadow: 0 0 8px rgba(255, 49, 49, 0.6); }
    50%       { box-shadow: 0 0 18px rgba(255, 49, 49, 0.15); }
  }
  @keyframes jarvis-mic-ring {
    0%   { transform: scale(1);   opacity: 1; }
    100% { transform: scale(1.9); opacity: 0; }
  }
  .ja-topbar-pill {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 10px;
    font-family: 'Share Tech Mono', monospace;
    letter-spacing: 0.07em;
    color: #ff5555;
    border: 1px solid rgba(255, 49, 49, 0.5);
    background: rgba(255, 49, 49, 0.05);
    padding: 4px 10px 4px 8px;
    border-radius: 2px;
    cursor: pointer;
    transition: background 0.15s;
    animation: jarvis-pill-pulse 2s ease-in-out infinite;
    user-select: none;
  }
  .ja-topbar-pill:hover {
    background: rgba(255, 49, 49, 0.12);
  }
  .ja-topbar-pill-icon {
    position: relative;
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ja-topbar-pill-icon::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid rgba(255, 49, 49, 0.7);
    animation: jarvis-mic-ring 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  .ja-topbar-pill-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ff3131;
    box-shadow: 0 0 6px #ff3131;
    animation: app-pulse 1s ease-in-out infinite;
  }

  /* ── content area ── */
  .app-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: #000000;
  }

  .app-main {
    flex: 1;
    padding: 24px;
    overflow-x: hidden;
  }

  /* ── mobile sidebar slide-out ── */
  .app-mobile-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(2px);
    z-index: 15;
  }
  .app-hamburger {
    display: none;
    background: transparent;
    border: none;
    color: #00ff41;
    font-size: 22px;
    cursor: pointer;
    margin-right: 12px;
  }

  @media (max-width: 767px) {
    .app-sidebar { 
      position: fixed;
      left: -260px;
      transition: left 0.3s ease;
      z-index: 20;
    }
    .app-sidebar.mobile-open {
      left: 0;
    }
    .app-mobile-overlay.mobile-open {
      display: block;
    }
    .app-hamburger {
      display: block;
    }
    .app-topbar-route { font-size: 10px; }
  }

  /* ── scanline on topbar ── */
  .app-topbar::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent, transparent 2px,
      rgba(0, 255, 65, 0.01) 2px, rgba(0, 255, 65, 0.01) 4px
    );
    pointer-events: none;
  }
`;

function useAppStyle() {
  useEffect(() => {
    const id = 'app-shell-style';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = APP_STYLE;
      document.head.appendChild(tag);
    }
  }, []);
}

/* ── route label for topbar ── */
const ROUTE_LABELS = {
  '/': 'CONTROL MATRIX',
  '/chat': 'CHAT TERMINAL',
  '/integrations': 'INTEGRATIONS',
  '/settings': 'SYSTEM SETTINGS',
};

function Topbar({ jarvisActive, onDismiss, onToggleMenu }) {
  const location = useLocation();
  const label = ROUTE_LABELS[location.pathname] || 'SYSTEM';

  return (
    <div className="app-topbar">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button className="app-hamburger" onClick={onToggleMenu}>☰</button>
        <div className="app-topbar-route">
          &gt; JARVIS // <span>{label}</span>
        </div>
      </div>

      {/* Centre: JARVIS active pill — only when assistant is awake */}
      {jarvisActive && (
        <div
          className="ja-topbar-pill"
          onClick={onDismiss}
          title="JARVIS is listening — click to dismiss"
        >
          <span className="ja-topbar-pill-icon">
            <span className="ja-topbar-pill-dot" />
          </span>
          🎙 JARVIS ACTIVE &nbsp;·&nbsp; LISTENING
          <span style={{ opacity: 0.5, fontSize: 9, marginLeft: 4 }}>[×]</span>
        </div>
      )}

      <div className="app-topbar-status">
        <span className="app-status-dot" />
        PORT: 5000 ACTIVE
      </div>
    </div>
  );
}

/* ── nav items ── */
const NAV_ITEMS = [
  { to: '/',             prefix: '[01]', label: 'DASHBOARD'     },
  { to: '/chat',         prefix: '[02]', label: 'CHAT TERMINAL'  },
  { to: '/integrations', prefix: '[03]', label: 'INTEGRATIONS'   },
  { to: '/settings',     prefix: '[04]', label: 'SETTINGS'       },
];

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [apps, setAppsState] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [history, setHistoryState] = useState([]);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  // Global one-time speech synthesis unlocker for mobile browsers
  useEffect(() => {
    const unlockSpeechSynthesis = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      window.removeEventListener('touchstart', unlockSpeechSynthesis);
      window.removeEventListener('click', unlockSpeechSynthesis);
    };

    window.addEventListener('touchstart', unlockSpeechSynthesis, { once: true });
    window.addEventListener('click', unlockSpeechSynthesis, { once: true });

    return () => {
      window.removeEventListener('touchstart', unlockSpeechSynthesis);
      window.removeEventListener('click', unlockSpeechSynthesis);
    };
  }, []);

  // Load history from MongoDB on mount
  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/history')
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.history)) {
          setHistoryState(data.history);
        }
      })
      .catch(() => {
        try {
          const cached = JSON.parse(localStorage.getItem('jarvis_history') || '[]');
          setHistoryState(cached);
        } catch {}
      });
  }, []);

  const setHistory = (updaterOrValue) => {
    setHistoryState(prev => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      localStorage.setItem('jarvis_history', JSON.stringify(next));
      return next;
    });
  };

  // Load apps from MongoDB on mount
  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/apps')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // Normalize _id → id and flatten credentials for compatibility with executor
          const normalized = data.apps.map(a => ({
            ...a,
            id: a._id || a.id,
            authHeader: a.credentials?.authHeader || a.authHeader || '',
            authPrefix: a.credentials?.authPrefix || a.authPrefix || '',
            apiKey:     a.credentials?.authToken  || a.apiKey     || '',
            isGmail:    a.name.toLowerCase() === 'gmail',
            isSheets:   a.name.toLowerCase() === 'google sheets',
          }));
          setAppsState(normalized);
        }
      })
      .catch(() => {
        // Fallback to localStorage if server unreachable
        try {
          const cached = JSON.parse(localStorage.getItem('jarvis_apps') || '[]');
          setAppsState(cached);
        } catch {}
      })
      .finally(() => setAppsLoading(false));
  }, []);

  // setApps: persists to MongoDB + updates local state
  const setApps = async (updaterOrValue) => {
    // Support both functional updater and direct value (same API as useState)
    setAppsState(prev => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      return next;
    });
  };

  // ── Gemini chat state lifted here so it survives navigation ──
  const gemini = useGemini();

  // Voice Assistant preferences
  const [speechEnabled, setSpeechEnabled] = useLocalStorage('jarvis_speech_enabled', false);
  const [language, setLanguage] = useLocalStorage('jarvis_language', 'english');
  const [clapActive, setClapActive] = useLocalStorage('jarvis_clap_active', false);
  const [selectedVoiceName, setSelectedVoiceName] = useLocalStorage('jarvis_selected_voice_name', '');
  const [userSalutation, setUserSalutation] = useLocalStorage('jarvis_user_salutation', 'Sir');
  const [wakeWordActive, setWakeWordActive] = useLocalStorage('jarvis_wake_word_active', true);
  const [wakeWordPhrase, setWakeWordPhrase] = useLocalStorage('jarvis_wake_word_phrase', 'Hey JARVIS');
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage('jarvis_authenticated', false);

  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [jarvisAwake, setJarvisAwake] = useState(false); // topbar badge only
  const [voicesList, setVoicesList] = useState([]);

  // Background Audio
  const bgAudioRef = useRef(null);

  useEffect(() => {
    bgAudioRef.current = new Audio('/jarvis audio.mpeg');
    bgAudioRef.current.volume = 0.4;
  }, []);

  useEffect(() => {
    if (jarvisAwake) {
      bgAudioRef.current?.play().catch(e => console.log('Audio autoplay blocked', e));
    } else {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current.currentTime = 0;
      }
    }
  }, [jarvisAwake]);

  // Voice engine list loader
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

  // Listen for JARVIS ui_action: open_voice
  useEffect(() => {
    const handler = () => setShowVoiceModal(true);
    window.addEventListener('launch-jarvis-assistant', handler);
    return () => window.removeEventListener('launch-jarvis-assistant', handler);
  }, []);



  // Speak greeting helper
  const speakGreeting = (text, onEnd) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (onEnd) utterance.onend = onEnd;

    const chosenVoice = voicesList.find(v => v.name === selectedVoiceName);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
      utterance.lang = chosenVoice.lang;
    } else {
      const isTamil = /[\u0b80-\u0bff]/.test(text) || language === 'tanglish';
      if (isTamil) {
        utterance.lang = 'ta-IN';
        const tamilVoice = voicesList.find(v => v.lang.startsWith('ta'));
        if (tamilVoice) utterance.voice = tamilVoice;
      } else {
        utterance.lang = 'en-IN';
        const indVoice = voicesList.find(v => v.lang === 'en-IN' || v.name.includes('India'));
        if (indVoice) utterance.voice = indVoice;
      }
    }
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Setup clap detector
  useClapDetector({
    enabled: clapActive,
    onClap: () => {
      handleGlobalWakeUp();
    }
  });

  // Setup wake word detector
  useWakeWord({
    enabled: wakeWordActive,
    phrase: wakeWordPhrase,
    modalActive: jarvisAwake || showVoiceModal, // pause wake-word listener while already awake or modal is open
    onWake: (text) => {
      handleGlobalWakeUp(text);
    }
  });

  // Clap/wake word → topbar badge ONLY (no popup)
  const handleGlobalWakeUp = (triggerText = '') => {
    // If user said "Jarvis stop" directly, just stop talking and dismiss
    if (triggerText && (triggerText.includes('stop') || triggerText.includes('cancel') || triggerText.includes('shut up'))) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setJarvisAwake(false);
      return;
    }

    setJarvisAwake(true);
    setSpeechEnabled(true);
    const greetingText = language === 'tanglish'
      ? `Sollunga ${userSalutation}?`
      : `Yes ${userSalutation}?`;
    speakGreeting(greetingText, () => {
      // Once greeting is done, automatically open the modal and start listening
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('launch-jarvis-assistant', { detail: { autoListen: true } }));
      }, 100);
    });
  };

  const handleDismissWake = () => {
    setJarvisAwake(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const [autoListenTrigger, setAutoListenTrigger] = useState(0);

  // Listen for mic button clicks from any page dispatching 'launch-jarvis-assistant'
  useEffect(() => {
    const handler = (e) => {
      setShowVoiceModal(true);
      if (e.detail?.autoListen) {
        setAutoListenTrigger(prev => prev + 1);
      }
    };
    window.addEventListener('launch-jarvis-assistant', handler);
    return () => window.removeEventListener('launch-jarvis-assistant', handler);
  }, []);

  // Mic button (sidebar) → popup only
  const handleStartListening = () => {
    setShowVoiceModal(true);
  };

  const handleCloseModal = () => {
    setShowVoiceModal(false);
    setJarvisAwake(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app-shell">
      {/* Mobile overlay */}
      <div 
        className={`app-mobile-overlay ${mobileMenuOpen ? 'mobile-open' : ''}`} 
        onClick={() => setMobileMenuOpen(false)} 
      />

      {/* ── Sidebar ── */}
      <aside className={`app-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="app-logo">
          <span className="app-logo-bracket">┌─[ SYSTEM ONLINE ]─┐</span>
          <span className="app-logo-name">
            JARVIS<span className="app-caret" />
          </span>
          <span className="app-logo-sub">APP ORCHESTRATOR v1.0</span>
        </div>

        {/* Nav */}
        <nav className="app-nav">
          <div className="app-nav-section">// NAVIGATION</div>
          {NAV_ITEMS.map(({ to, prefix, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `app-nav-link${isActive ? ' active' : ''}`
              }
            >
              <span className="app-nav-prefix">{prefix}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="app-sidebar-footer">
          {/* Quick Mic Assistant Trigger inside sidebar */}
          <button
            type="button"
            onClick={handleStartListening}
            style={{
              width: '100%',
              marginBottom: 10,
              background: 'transparent',
              border: '1px solid #00ff4166',
              color: '#00ff41',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11,
              padding: '6px 0',
              cursor: 'pointer',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 0 4px rgba(0, 255, 65, 0.1)',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { 
              e.target.style.background = 'rgba(0, 255, 65, 0.08)'; 
              e.target.style.boxShadow = '0 0 8px rgba(0, 255, 65, 0.3)'; 
            }}
            onMouseLeave={(e) => { 
              e.target.style.background = 'transparent'; 
              e.target.style.boxShadow = '0 0 4px rgba(0, 255, 65, 0.1)'; 
            }}
          >
            🎙 LAUNCH ASSISTANT
          </button>

          <button
            type="button"
            onClick={() => setIsAuthenticated(false)}
            style={{
              width: '100%',
              marginBottom: 10,
              background: 'transparent',
              border: '1px solid rgba(255, 49, 49, 0.4)',
              color: '#ff3131',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 11,
              padding: '6px 0',
              cursor: 'pointer',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 0 4px rgba(255, 49, 49, 0.1)',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { 
              e.target.style.background = 'rgba(255, 49, 49, 0.08)'; 
              e.target.style.boxShadow = '0 0 8px rgba(255, 49, 49, 0.3)'; 
            }}
            onMouseLeave={(e) => { 
              e.target.style.background = 'transparent'; 
              e.target.style.boxShadow = '0 0 4px rgba(255, 49, 49, 0.1)'; 
            }}
          >
            🔒 SECURE LOGOUT
          </button>

          <div className="app-sidebar-footer-box">
            <div>&gt; STORAGE</div>
            <div style={{ marginTop: 4 }}>
              Database: <span>MongoDB Atlas</span>
            </div>
            <div style={{ marginTop: 2, color: '#00ff41' }}>
              ● CONNECTED
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="app-content">
        <Topbar 
          jarvisActive={jarvisAwake} 
          onDismiss={handleDismissWake} 
          onToggleMenu={() => setMobileMenuOpen(prev => !prev)}
        />
        <main className="app-main">
          <Routes>
            <Route
              path="/"
              element={<Dashboard apps={apps} setApps={setApps} history={history} />}
            />
            <Route
              path="/chat"
              element={
                <ChatPage
                  apps={apps}
                  setApps={setApps}
                  history={history}
                  setHistory={setHistory}
                  gemini={gemini}
                />
              }
            />
            <Route
              path="/integrations"
              element={<Settings apps={apps} setApps={setApps} />}
            />
            <Route
              path="/settings"
              element={
                <AppSettings
                  speechEnabled={speechEnabled}
                  setSpeechEnabled={setSpeechEnabled}
                  language={language}
                  setLanguage={setLanguage}
                  voicesList={voicesList}
                  selectedVoiceName={selectedVoiceName}
                  setSelectedVoiceName={setSelectedVoiceName}
                  clapActive={clapActive}
                  setClapActive={setClapActive}
                  userSalutation={userSalutation}
                  setUserSalutation={setUserSalutation}
                  wakeWordActive={wakeWordActive}
                  setWakeWordActive={setWakeWordActive}
                  wakeWordPhrase={wakeWordPhrase}
                  setWakeWordPhrase={setWakeWordPhrase}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* VoiceModal removed — JARVIS status is shown inline in the topbar */}

      {/* ── Floating Voice Assistant Panel (non-blocking, self-contained) ── */}
      <VoiceModal
        show={showVoiceModal}
        onClose={handleCloseModal}
        apps={apps}
        setApps={setApps}
        language={language}
        setLanguage={setLanguage}
        voicesList={voicesList}
        selectedVoiceName={selectedVoiceName}
        setSelectedVoiceName={setSelectedVoiceName}
        clapActive={clapActive}
        setClapActive={setClapActive}
        autoListenTrigger={autoListenTrigger}
      />
    </div>
  );
}

export default function App() {
  useAppStyle();
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
