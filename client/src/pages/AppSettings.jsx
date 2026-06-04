import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SETTINGS_STYLE = `
  .aps-root {
    font-family: 'Share Tech Mono', monospace;
    color: #00ff41;
  }

  .aps-title-bar {
    border-bottom: 1px solid #00ff4155;
    padding: 10px 0;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    letter-spacing: 0.18em;
  }

  .aps-panel {
    background: #050a05;
    border: 1px solid #00ff41;
    box-shadow: 0 0 8px #00ff4144;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 20px;
  }

  .aps-panel-header {
    padding: 8px 14px;
    border-bottom: 1px solid #00ff4155;
    font-size: 11px;
    letter-spacing: 0.12em;
    color: #00ff41;
    background: #030803;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .aps-panel-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .aps-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(0, 255, 65, 0.1);
    padding-bottom: 14px;
  }
  .aps-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .aps-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 60%;
  }

  .aps-label {
    font-size: 13px;
    font-weight: bold;
    letter-spacing: 0.05em;
  }

  .aps-desc {
    font-size: 10px;
    color: #4a9e4a;
    line-height: 1.4;
  }

  .aps-control {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .aps-btn {
    background: #000;
    border: 1px solid #00ff41;
    color: #00ff41;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    padding: 6px 14px;
    cursor: pointer;
    border-radius: 2px;
    letter-spacing: 0.08em;
    transition: all 0.15s;
  }
  .aps-btn:hover {
    background: #00ff4118;
    box-shadow: 0 0 6px #00ff4133;
  }
  .aps-btn-active {
    background: #00ff41;
    color: #000;
  }
  .aps-btn-active:hover {
    background: #00e039;
    color: #000;
  }

  .aps-select {
    background: #000;
    border: 1px solid #00ff41;
    color: #00ff41;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    padding: 6px 10px;
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    min-width: 200px;
  }

  .aps-input {
    background: #000;
    border: 1px solid #00ff41;
    color: #00ff41;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    padding: 6px 10px;
    border-radius: 2px;
    outline: none;
    width: 200px;
    box-sizing: border-box;
  }
  .aps-input:focus {
    box-shadow: 0 0 6px #00ff4166;
  }

  .aps-footer {
    margin-top: 16px;
    border-top: 1px solid #00ff4122;
    padding-top: 10px;
    font-size: 10px;
    color: #4a9e4a;
    letter-spacing: 0.12em;
    display: flex;
    justify-content: space-between;
  }
`;

export function AppSettings({
  speechEnabled,
  setSpeechEnabled,
  language,
  setLanguage,
  voicesList,
  selectedVoiceName,
  setSelectedVoiceName,
  clapActive,
  setClapActive,
  userSalutation,
  setUserSalutation,
  wakeWordActive,
  setWakeWordActive,
  wakeWordPhrase,
  setWakeWordPhrase
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const id = 'aps-style';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = SETTINGS_STYLE;
      document.head.appendChild(tag);
    }
  }, []);

  return (
    <div className="aps-root">
      <div className="aps-title-bar">
        <span style={{ color: '#4a9e4a' }}>┌──[</span>
        <span style={{ color: '#00ff41' }}>JARVIS // SYSTEM SETTINGS</span>
        <span style={{ color: '#4a9e4a' }}>]</span>
        <span style={{ flex: 1, borderTop: '1px solid #00ff4130' }} />
      </div>

      <div className="aps-panel">
        <div className="aps-panel-header">
          <span>// ASSISTANT & AUDIO OPTIONS</span>
        </div>

        <div className="aps-panel-body">
          {/* Row: User Salutation Preference */}
          <div className="aps-row">
            <div className="aps-info">
              <span className="aps-label">USER SALUTATION Preference</span>
              <span className="aps-desc">Define the name or title JARVIS uses to address you (e.g. Boss, Captain, Master Navas).</span>
            </div>
            <div className="aps-control">
              <input
                type="text"
                value={userSalutation}
                onChange={(e) => setUserSalutation(e.target.value)}
                className="aps-input"
                placeholder="e.g. Sir, Boss"
              />
            </div>
          </div>

          {/* Row 1: Language preference */}
          <div className="aps-row">
            <div className="aps-info">
              <span className="aps-label">SYSTEM DIALECT</span>
              <span className="aps-desc">Choose between standard English or transliterated Tanglish responses.</span>
            </div>
            <div className="aps-control">
              <button
                type="button"
                className={`aps-btn ${language === 'english' ? 'aps-btn-active' : ''}`}
                onClick={() => setLanguage('english')}
              >
                ENGLISH 🇬🇧
              </button>
              <button
                type="button"
                className={`aps-btn ${language === 'tanglish' ? 'aps-btn-active' : ''}`}
                onClick={() => setLanguage('tanglish')}
              >
                TANGLISH 🇮🇳
              </button>
            </div>
          </div>

          {/* Row 2: Speech synthesis */}
          <div className="aps-row">
            <div className="aps-info">
              <span className="aps-label">TEXT TO SPEECH (TTS)</span>
              <span className="aps-desc">Toggle whether JARVIS reads chatbot replies out loud using audio speakers.</span>
            </div>
            <div className="aps-control">
              <button
                type="button"
                className={`aps-btn ${speechEnabled ? 'aps-btn-active' : ''}`}
                onClick={() => setSpeechEnabled(!speechEnabled)}
              >
                {speechEnabled ? '[ 🔊 ENABLED ]' : '[ 🔇 MUTED ]'}
              </button>
            </div>
          </div>

          {/* Row 3: Clap to Wake */}
          <div className="aps-row">
            <div className="aps-info">
              <span className="aps-label">CLAP TO WAKE DETECTOR</span>
              <span className="aps-desc">When active, clapping your hands anywhere on the app wakes up the voice overlay.</span>
            </div>
            <div className="aps-control">
              <button
                type="button"
                className={`aps-btn ${clapActive ? 'aps-btn-active' : ''}`}
                onClick={() => setClapActive(!clapActive)}
              >
                {clapActive ? '[ 👏 CLAP DETECTOR ACTIVE ]' : '[ 👏 CLAP DETECTOR MUTED ]'}
              </button>
            </div>
          </div>

          {/* Row: Voice Wake Word Detector */}
          <div className="aps-row">
            <div className="aps-info">
              <span className="aps-label">WAKE WORD DETECTOR ("Hey JARVIS")</span>
              <span className="aps-desc">Background listener that opens the assistant overlay when you say "Hey JARVIS". Runs globally on any page.</span>
            </div>
            <div className="aps-control">
              <button
                type="button"
                className={`aps-btn ${wakeWordActive ? 'aps-btn-active' : ''}`}
                onClick={() => setWakeWordActive(!wakeWordActive)}
              >
                {wakeWordActive ? '[ 🎙 WAKE WORD ACTIVE ]' : '[ 🎙 WAKE WORD MUTED ]'}
              </button>
            </div>
          </div>

          {/* Row: Wake Word Phrase customizer */}
          <div className="aps-row">
            <div className="aps-info">
              <span className="aps-label">CUSTOM WAKE PHRASE</span>
              <span className="aps-desc">Configure the trigger phrase you say out loud to activate the assistant (e.g. "Hey JARVIS", "Wake Up").</span>
            </div>
            <div className="aps-control">
              <input
                type="text"
                value={wakeWordPhrase}
                onChange={(e) => setWakeWordPhrase(e.target.value)}
                className="aps-input"
                placeholder="e.g. Hey JARVIS"
              />
            </div>
          </div>

          {/* Row 4: Voice synthesis engine picker */}
          {voicesList.length > 0 && (
            <div className="aps-row">
              <div className="aps-info">
                <span className="aps-label">PRIMARY VOICE ENGINE</span>
                <span className="aps-desc">Select the vocal profile used to speak messages. (Prioritizes Indian accents where available).</span>
              </div>
              <div className="aps-control">
                <select
                  value={selectedVoiceName}
                  onChange={(e) => setSelectedVoiceName(e.target.value)}
                  className="aps-select"
                >
                  {voicesList
                    .filter(v => v.lang.startsWith('en') || v.lang.startsWith('ta'))
                    .map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connection link shortcut */}
      <div className="aps-panel">
        <div className="aps-panel-header">
          <span>// CONNECTIONS & CONNECTIVITY</span>
        </div>
        <div className="aps-panel-body">
          <div className="aps-row">
            <div className="aps-info">
              <span className="aps-label">INTEGRATIONS CONNECTOR</span>
              <span className="aps-desc">Manage third-party connected apps, URLs, endpoints, and secure API auth keys.</span>
            </div>
            <div className="aps-control">
              <button
                type="button"
                className="aps-btn aps-btn-active"
                onClick={() => navigate('/integrations')}
              >
                MANAGE CONNECTIONS →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="aps-footer">
        <span>JARVIS // SECURE LOCAL PROXY ACTIVE</span>
        <span>PORT: 5000 // GEMINI API CONNECTED</span>
      </div>
    </div>
  );
}
