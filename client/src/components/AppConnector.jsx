import React, { useState, useEffect, useRef } from 'react';
import { testConnection } from '../utils/appExecutor';

/* ─── AppConnector terminal styles ─── */
const AC_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

  .ac-panel {
    font-family: 'Share Tech Mono', monospace;
    background: #050a05;
    border: 1px solid #00ff41;
    box-shadow: 0 0 8px #00ff41;
    border-radius: 2px;
    overflow: hidden;
  }

  .ac-header {
    padding: 8px 14px;
    border-bottom: 1px solid #00ff4155;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    letter-spacing: 0.12em;
    color: #00ff41;
    background: #030803;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ac-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ac-body { padding: 18px; }

  /* autofill presets */
  .ac-presets {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .ac-preset-label {
    color: #2d6b2d;
    font-size: 10px;
    letter-spacing: 0.1em;
  }
  .ac-preset-btn {
    background: #000;
    border: 1px solid #00ff4144;
    color: #4a9e4a;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    padding: 3px 10px;
    cursor: pointer;
    border-radius: 1px;
    letter-spacing: 0.06em;
    transition: all 0.15s;
  }
  .ac-preset-btn:hover {
    color: #00ff41;
    border-color: #00ff41;
    background: #00ff4112;
  }

  /* form grid */
  .ac-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 14px;
  }
  .ac-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 14px;
    margin-bottom: 14px;
  }
  @media (max-width: 640px) {
    .ac-grid-2, .ac-grid-3 { grid-template-columns: 1fr; }
  }

  /* field */
  .ac-field { display: flex; flex-direction: column; gap: 6px; }
  .ac-label {
    font-size: 10px;
    letter-spacing: 0.14em;
    color: #4a9e4a;
  }
  .ac-input, .ac-textarea {
    background: #020702;
    border: 1px solid #00ff4155;
    color: #00ff41;
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    padding: 8px 12px;
    border-radius: 1px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
    box-sizing: border-box;
  }
  .ac-input::placeholder, .ac-textarea::placeholder { color: #2d6b2d; }
  .ac-input:focus, .ac-textarea:focus {
    border-color: #00ff41;
    box-shadow: 0 0 8px #00ff4133;
  }
  .ac-textarea { resize: none; }

  /* result banners */
  .ac-result {
    border: 1px solid;
    padding: 10px 14px;
    font-size: 12px;
    margin-bottom: 14px;
    letter-spacing: 0.06em;
  }
  .ac-result-ok  { border-color: #00ff4155; background: #020a02; color: #00ff41; }
  .ac-result-err { border-color: #ff313155; background: #0a0202; color: #ff3131; }

  /* form footer */
  .ac-footer {
    border-top: 1px solid #00ff4133;
    padding-top: 14px;
    margin-top: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .ac-btn {
    background: #000;
    border: 1px solid #00ff41;
    color: #00ff41;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    padding: 6px 14px;
    cursor: pointer;
    border-radius: 1px;
    letter-spacing: 0.08em;
    transition: background 0.15s, box-shadow 0.15s;
  }
  .ac-btn:hover:not(:disabled) {
    background: #00ff4118;
    box-shadow: 0 0 8px #00ff41;
  }
  .ac-btn:disabled { opacity: 0.4; cursor: default; }

  .ac-btn-dim {
    background: transparent;
    border: 1px solid #00ff4133;
    color: #4a9e4a;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    padding: 6px 14px;
    cursor: pointer;
    border-radius: 1px;
    letter-spacing: 0.08em;
    transition: all 0.15s;
  }
  .ac-btn-dim:hover { color: #00ff41; border-color: #00ff4177; }

  .ac-btn-save {
    background: #000;
    border: 1px solid #00ff41;
    color: #00ff41;
    box-shadow: 0 0 6px #00ff4133;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    padding: 6px 16px;
    cursor: pointer;
    border-radius: 1px;
    letter-spacing: 0.08em;
    transition: background 0.15s, box-shadow 0.15s;
  }
  .ac-btn-save:hover {
    background: #00ff4118;
    box-shadow: 0 0 12px #00ff41;
  }
  /* Gmail OAuth card */
  .ac-gmail-card {
    border: 1px solid #00ff4155;
    background: #020a02;
    border-radius: 2px;
    padding: 18px;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
  }
  .ac-gmail-info { display: flex; align-items: center; gap: 12px; }
  .ac-gmail-icon {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }
  .ac-gmail-title { color: #00ff41; font-size: 13px; font-weight: bold; letter-spacing: 0.06em; }
  .ac-gmail-sub   { color: #4a9e4a; font-size: 10px; margin-top: 2px; letter-spacing: 0.04em; }
  .ac-gmail-connected { color: #00ff41; font-size: 10px; letter-spacing: 0.1em; display: flex; align-items: center; gap: 6px; }
  .ac-gmail-dot { width: 7px; height: 7px; border-radius: 50%; background: #00ff41; box-shadow: 0 0 6px #00ff41; animation: app-pulse 1.8s ease-in-out infinite; }
  .ac-btn-gmail {
    background: #fff;
    color: #222;
    border: none;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    font-weight: bold;
    padding: 8px 16px;
    cursor: pointer;
    border-radius: 3px;
    letter-spacing: 0.06em;
    display: flex;
    align-items: center;
    gap: 7px;
    transition: opacity 0.15s;
    flex-shrink: 0;
  }
  .ac-btn-gmail:hover { opacity: 0.88; }
  .ac-btn-gmail-disconnect {
    background: transparent;
    border: 1px solid #ff313177;
    color: #ff5555;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    padding: 6px 14px;
    cursor: pointer;
    border-radius: 2px;
    letter-spacing: 0.06em;
    transition: all 0.15s;
  }
  .ac-btn-gmail-disconnect:hover { border-color: #ff3131; background: rgba(255,49,49,0.07); }
  @keyframes app-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

function useAcStyle() {
  useEffect(() => {
    const id = 'ac-style';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = AC_STYLE;
      document.head.appendChild(tag);
    }
    return () => { const t = document.getElementById(id); if (t) t.remove(); };
  }, []);
}

export function AppConnector({ onSave, onCancel, editApp = null }) {
  useAcStyle();

  const [name, setName] = useState(editApp?.name ?? '');
  const [baseUrl, setBaseUrl] = useState(editApp?.baseUrl ?? '');
  const [apiKey, setApiKey] = useState(editApp?.apiKey ?? '');
  const [authHeader, setAuthHeader] = useState(editApp?.authHeader ?? 'Authorization');
  const [authPrefix, setAuthPrefix] = useState(editApp?.authPrefix ?? 'Bearer');
  const [description, setDescription] = useState(editApp?.description ?? '');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Gmail OAuth state — tokens stored in MongoDB (mirrored to localStorage for fast reads)
  const GMAIL_TOKEN_KEY = 'jarvis_gmail_tokens';
  const SHEETS_TOKEN_KEY = 'jarvis_sheets_tokens';

  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailChecking, setGmailChecking] = useState(false);
  const [sheetsConnected, setSheetsConnected] = useState(false);
  const [sheetsChecking, setSheetsChecking] = useState(false);
  const gmailJustConnected = useRef(false);
  const sheetsJustConnected = useRef(false);

  // Load token status from MongoDB on mount
  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/tokens/gmail')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.token?.access_token) {
          localStorage.setItem(GMAIL_TOKEN_KEY, JSON.stringify(data.token));
          setGmailConnected(true);
        }
      })
      .catch(() => {
        // Fallback to localStorage
        try {
          const t = JSON.parse(localStorage.getItem(GMAIL_TOKEN_KEY) || '{}');
          if (t.access_token) setGmailConnected(true);
        } catch { }
      });

    fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/tokens/sheets')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.token?.access_token) {
          localStorage.setItem(SHEETS_TOKEN_KEY, JSON.stringify(data.token));
          setSheetsConnected(true);
        }
      })
      .catch(() => {
        try {
          const t = JSON.parse(localStorage.getItem(SHEETS_TOKEN_KEY) || '{}');
          if (t.access_token) setSheetsConnected(true);
        } catch { }
      });
  }, []);

  // Listen for postMessage from OAuth popups
  useEffect(() => {
    const onMessage = async (event) => {
      if (event.origin !== (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '') return;
      const data = event.data;

      // Gmail tokens
      if (data?.type === 'gmail-tokens' && data.tokens?.access_token) {
        let tokenData = data.tokens;
        try {
          const profileRes = await fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/gmail/profile', {
            headers: { Authorization: `Bearer ${data.tokens.access_token}` }
          });
          const profile = await profileRes.json();
          tokenData = { ...data.tokens, email: profile.email };
        } catch (err) {
          console.error('Failed to fetch Gmail profile:', err);
        }
        // Save to MongoDB
        fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/tokens/gmail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tokenData),
        }).catch(console.error);
        // Mirror to localStorage for fast reads
        localStorage.setItem(GMAIL_TOKEN_KEY, JSON.stringify(tokenData));
        gmailJustConnected.current = true;
        setGmailConnected(true);
        setGmailChecking(false);
      }

      // Sheets tokens
      if (data?.type === 'sheets-tokens' && data.tokens?.access_token) {
        // Save to MongoDB
        fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/tokens/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.tokens),
        }).catch(console.error);
        // Mirror to localStorage for fast reads
        localStorage.setItem(SHEETS_TOKEN_KEY, JSON.stringify(data.tokens));
        sheetsJustConnected.current = true;
        setSheetsConnected(true);
        setSheetsChecking(false);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const handleGmailConnect = () => {
    setGmailChecking(true);
    window.open(
      (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/gmail/auth',
      'Gmail OAuth',
      'width=520,height=620,left=200,top=100'
    );
  };

  const handleGmailDisconnect = () => {
    fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/tokens/gmail', { method: 'DELETE' }).catch(console.error);
    localStorage.removeItem(GMAIL_TOKEN_KEY);
    setGmailConnected(false);
  };

  const handleSheetsConnect = () => {
    setSheetsChecking(true);
    window.open(
      (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/sheets/auth',
      'Sheets OAuth',
      'width=520,height=620,left=200,top=100'
    );
  };

  const handleSheetsDisconnect = () => {
    fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/tokens/sheets', { method: 'DELETE' }).catch(console.error);
    localStorage.removeItem(SHEETS_TOKEN_KEY);
    setSheetsConnected(false);
  };

  // Auto-save Gmail ONLY when a fresh OAuth token just arrived (not on initial mount)
  useEffect(() => {
    if (gmailConnected && gmailJustConnected.current) {
      gmailJustConnected.current = false;
      onSave({
        id: 'gmail-oauth',
        name: 'Gmail',
        baseUrl: (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/gmail',
        apiKey: '',
        authHeader: '',
        authPrefix: '',
        description: 'Gmail integration via OAuth2. Can read inbox, send emails, search messages, and mark emails as read. Endpoints: GET /inbox?max=10&q=search (list/search emails), POST /send (send email with fields: to, subject, body), POST /mark-read (mark email as read with body: { id }), GET /inbox?q=is:unread — get unread emails. Response includes "count" field with total unread. Always send access_token as Authorization Bearer header from localStorage key jarvis_gmail_tokens.',
        status: 'connected',
        isGmail: true,
      });
    }
  }, [gmailConnected]);

  // Auto-save Sheets ONLY when a fresh OAuth token just arrived
  useEffect(() => {
    if (sheetsConnected && sheetsJustConnected.current) {
      sheetsJustConnected.current = false;
      onSave({
        id: 'sheets-oauth',
        name: 'Google Sheets',
        baseUrl: (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/sheets',
        apiKey: '',
        authHeader: '',
        authPrefix: '',
        description: 'Google Sheets integration. Can create new spreadsheets automatically without asking the user for a spreadsheetId. When creating a WooCommerce report, fetch the orders from WooCommerce first, then send them to POST /woo-report with a body: { orders: [...], title: "Report title" } to handle creating the spreadsheet and appending the orders in a single backend call. Endpoints: POST /woo-report — generate a WooCommerce orders report (body: { orders, title }), POST /create — create a new spreadsheet (body: title), POST /append — append rows to a sheet (body: spreadsheetId, range, values), GET /read — read sheet data (body: spreadsheetId, range), GET /spreadsheets/:spreadsheetId (retrieve sheet metadata), PUT /values/update (body: { spreadsheetId, range, values: [[val1, val2, ...]] } to update cells).',
        status: 'connected',
        isSheets: true,
      });
    }
  }, [sheetsConnected]);

  const handleTest = async () => {
    if (!name || !baseUrl) { setErrorMsg('App name and Base URL are required to test.'); return; }
    setTesting(true); setTestResult(null); setErrorMsg('');
    try {
      const ok = await testConnection({ name, baseUrl, apiKey, authHeader, authPrefix, description });
      setTestResult(ok ? 'success' : 'error');
      if (!ok) setErrorMsg('API returned a non-2xx status or server failed to route.');
    } catch (e) {
      setTestResult('error');
      setErrorMsg(e.message || 'Connection failed.');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !baseUrl) { setErrorMsg('App Name and Base URL are required.'); return; }
    onSave({
      id: editApp ? editApp.id : crypto.randomUUID(),
      name: name.trim(), baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(), authHeader: authHeader.trim(),
      authPrefix: authPrefix.trim(), description: description.trim(),
      // Save regardless of test result — test is optional
      status: testResult === 'success' ? 'connected'
        : testResult === 'error' ? 'error'
          : (editApp ? editApp.status : 'untested'),
    });
  };

  const fillMock = (type) => {
    const presets = {
      todo: { name: 'VBOS Todo List', baseUrl: (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/mock/todos', apiKey: 'demo-todo-key-123', description: 'Manages todo list tasks. Use tasks endpoint to GET, POST, and DELETE items.' },
      finance: { name: 'VBOS Finance Tracker', baseUrl: (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/mock/finance', apiKey: 'demo-finance-key-456', description: 'Records financial transactions: income and expenses. Supports adding items.' },
      weather: { name: 'VBOS Weather', baseUrl: (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/mock/weather', apiKey: 'demo-weather-key-789', description: 'Provides real-time weather information and forecasting for cities.' },
    };
    const p = presets[type];
    setName(p.name); setBaseUrl(p.baseUrl); setApiKey(p.apiKey);
    setAuthHeader('Authorization'); setAuthPrefix('Bearer'); setDescription(p.description);
    setTestResult(null); setErrorMsg('');
  };

  return (
    <div className="ac-panel">
      {/* Header */}
      <div className="ac-header">
        <div className="ac-header-left">
          <span>┌─[</span>
          <span style={{ letterSpacing: '0.15em' }}>
            {editApp ? 'EDIT APP CONFIG' : 'CONNECT NEW APP'}
          </span>
          <span>]─</span>
        </div>

        {!editApp && (
          <div className="ac-presets">
            <span className="ac-preset-label">AUTOFILL:</span>
            <button type="button" className="ac-preset-btn" onClick={() => fillMock('todo')}>[ TODO ]</button>
            <button type="button" className="ac-preset-btn" onClick={() => fillMock('finance')}>[ FINANCE ]</button>
            <button type="button" className="ac-preset-btn" onClick={() => fillMock('weather')}>[ WEATHER ]</button>
          </div>
        )}
      </div>

      {/* Gmail OAuth Card */}
      {!editApp && (
        <div style={{ padding: '14px 18px 0' }}>
          <div className="ac-gmail-card">
            <div className="ac-gmail-info">
              <div className="ac-gmail-icon">📧</div>
              <div>
                <div className="ac-gmail-title">GMAIL INTEGRATION</div>
                <div className="ac-gmail-sub">
                  {gmailChecking
                    ? 'Checking connection...'
                    : gmailConnected
                      ? 'OAuth2 connected — read, send & search emails via VBOS'
                      : 'Connect via Google OAuth2 — no API key required'}
                </div>
                {gmailConnected && (
                  <div className="ac-gmail-connected" style={{ marginTop: 4 }}>
                    <span className="ac-gmail-dot" />
                    CONNECTED
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {gmailConnected
                ? <button type="button" className="ac-btn-gmail-disconnect" onClick={handleGmailDisconnect}>DISCONNECT</button>
                : <button type="button" className="ac-btn-gmail" onClick={handleGmailConnect}>
                  <span>G</span> CONNECT GMAIL →
                </button>
              }
            </div>
          </div>
          <div className="ac-gmail-card">
            <div className="ac-gmail-info">
              <div className="ac-gmail-icon">📊</div>
              <div>
                <div className="ac-gmail-title">GOOGLE SHEETS INTEGRATION</div>
                <div className="ac-gmail-sub">
                  {sheetsChecking
                    ? 'Checking connection...'
                    : sheetsConnected
                      ? 'OAuth2 connected — read, update & append spreadsheets via VBOS'
                      : 'Connect via Google Sheets OAuth2 — no API key required'}
                </div>
                {sheetsConnected && (
                  <div className="ac-gmail-connected" style={{ marginTop: 4 }}>
                    <span className="ac-gmail-dot" />
                    CONNECTED
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {sheetsConnected
                ? <button type="button" className="ac-btn-gmail-disconnect" onClick={handleSheetsDisconnect}>DISCONNECT</button>
                : <button type="button" className="ac-btn-gmail" onClick={handleSheetsConnect}>
                  <span>G</span> CONNECT SHEETS →
                </button>
              }
            </div>
          </div>
          <div style={{ borderTop: '1px solid #00ff4122', marginBottom: 14, fontSize: 10, color: '#2d6b2d', letterSpacing: '0.1em', paddingTop: 10 }}>
            — OR CONNECT A CUSTOM REST API BELOW —
          </div>
        </div>
      )}

      {/* Form */}
      <div className="ac-body">
        <form onSubmit={handleSubmit}>
          <div className="ac-grid-2">
            <div className="ac-field">
              <label className="ac-label">&gt; APP NAME *</label>
              <input className="ac-input" type="text" required value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wave Finance, Slack, WeatherAPI" />
            </div>
            <div className="ac-field">
              <label className="ac-label">&gt; BASE API URL *</label>
              <input className="ac-input" type="url" required value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com" />
            </div>
          </div>

          <div className="ac-grid-3">
            <div className="ac-field">
              <label className="ac-label">&gt; API KEY / TOKEN</label>
              <input className="ac-input" type="password" value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••••••" />
            </div>
            <div className="ac-field">
              <label className="ac-label">&gt; AUTH HEADER</label>
              <input className="ac-input" type="text" value={authHeader}
                onChange={(e) => setAuthHeader(e.target.value)}
                placeholder="Authorization" />
            </div>
            <div className="ac-field">
              <label className="ac-label">&gt; AUTH PREFIX</label>
              <input className="ac-input" type="text" value={authPrefix}
                onChange={(e) => setAuthPrefix(e.target.value)}
                placeholder="Bearer" />
            </div>
          </div>

          <div className="ac-field" style={{ marginBottom: 14 }}>
            <label className="ac-label">&gt; AI DESCRIPTION / CONTEXT (optional)</label>
            <textarea className="ac-textarea" rows={3} value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what the app does, what endpoints are available, and what entities it manages. This context is passed directly to the Gemini model." />
          </div>

          {/* Test result */}
          {testResult && (
            <div className={`ac-result ${testResult === 'success' ? 'ac-result-ok' : 'ac-result-err'}`}>
              {testResult === 'success'
                ? '✔ CONNECTION SUCCEEDED — VBOS can reach the base URL.'
                : `✖ CONNECTION FAILED — ${errorMsg || 'Check your credentials and URL.'}`}
            </div>
          )}
          {errorMsg && !testResult && (
            <div className="ac-result ac-result-err">✖ {errorMsg}</div>
          )}

          {/* Actions */}
          <div className="ac-footer">
            <button type="button" className="ac-btn" disabled={testing} onClick={handleTest}>
              {testing ? '[ TESTING... ]' : '[ TEST CONNECTION ]'}
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="ac-btn-dim" onClick={onCancel}>
                [ CANCEL ]
              </button>
              <button type="submit" className="ac-btn-save">
                [ SAVE CONFIG ]
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
