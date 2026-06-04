import React, { useState, useEffect } from 'react';
import { AppConnector } from '../components/AppConnector';

/* ─── Scoped terminal styles ─── */
const SETTINGS_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

  .st-root {
    font-family: 'Share Tech Mono', monospace;
    color: #00ff41;
  }

  /* title bar */
  .st-title-bar {
    border-bottom: 1px solid #00ff4155;
    padding: 10px 0;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    letter-spacing: 0.18em;
  }

  /* panel */
  .st-panel {
    background: #050a05;
    border: 1px solid #00ff41;
    box-shadow: 0 0 8px #00ff41;
    border-radius: 2px;
    overflow: hidden;
  }

  /* panel header */
  .st-panel-header {
    padding: 8px 14px;
    border-bottom: 1px solid #00ff4155;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    letter-spacing: 0.12em;
    color: #00ff41;
    background: #030803;
  }
  .st-panel-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  @keyframes st-blink {
    0%,49%{opacity:1}50%,100%{opacity:0}
  }
  .st-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #00ff41;
    box-shadow: 0 0 6px #00ff41;
    animation: st-blink 1.1s step-end infinite;
  }

  /* add button */
  .st-add-btn {
    background: #000;
    border: 1px solid #00ff41;
    color: #00ff41;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    padding: 4px 12px;
    cursor: pointer;
    border-radius: 1px;
    letter-spacing: 0.08em;
    transition: background 0.15s, box-shadow 0.15s;
  }
  .st-add-btn:hover {
    background: #00ff4118;
    box-shadow: 0 0 8px #00ff41;
  }

  /* back link */
  .st-back-btn {
    background: transparent;
    border: none;
    color: #4a9e4a;
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    cursor: pointer;
    letter-spacing: 0.08em;
    padding: 0;
    margin-bottom: 16px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: color 0.15s;
  }
  .st-back-btn:hover { color: #00ff41; }

  /* empty state */
  .st-empty {
    padding: 48px 20px;
    text-align: center;
    color: #4a9e4a;
    font-size: 12px;
    letter-spacing: 0.06em;
    line-height: 2;
  }
  .st-empty-title {
    color: #00ff41;
    font-size: 13px;
    margin-bottom: 8px;
  }

  /* table */
  .st-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    table-layout: fixed;
  }
  .st-table thead tr {
    border-bottom: 1px solid #00ff4155;
    background: #030803;
  }
  .st-table thead th {
    padding: 8px 14px;
    font-size: 10px;
    letter-spacing: 0.14em;
    color: #4a9e4a;
    text-align: left;
    font-weight: normal;
    white-space: nowrap;
    overflow: hidden;
  }
  .st-table col.col-app     { width: 24%; }
  .st-table col.col-url     { width: 26%; }
  .st-table col.col-status  { width: 10%; }
  .st-table col.col-auth    { width: 22%; }
  .st-table col.col-actions { width: 18%; }

  .st-table thead th.st-col-actions { text-align: right; }
  .st-table tbody tr {
    border-bottom: 1px solid #00ff4115;
    transition: background 0.1s;
  }
  .st-table tbody tr:last-child { border-bottom: none; }
  .st-table tbody tr:hover { background: #00ff4108; }
  .st-table td {
    padding: 10px 14px;
    color: #00ff41;
    vertical-align: middle;
    overflow: hidden;
  }
  .st-table td.st-col-actions { text-align: right; }

  .st-app-name {
    color: #00ff41;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .st-app-desc {
    color: #2d6b2d;
    font-size: 10px;
    margin-top: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .st-url {
    color: #4a9e4a;
    font-size: 11px;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* status badges */
  .st-status-ok  { color: #00ff41; font-size: 11px; }
  .st-status-err { color: #ff3131; font-size: 11px; }
  .st-status-unk { color: #4a9e4a; font-size: 11px; }

  .st-auth-tag {
    border: 1px solid #00ff4133;
    background: #020502;
    padding: 3px 8px;
    font-size: 10px;
    color: #4a9e4a;
    letter-spacing: 0.04em;
    display: inline-block;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .st-auth-tag-oauth {
    border: 1px solid #00ff4166;
    background: #011601;
    padding: 3px 8px;
    font-size: 10px;
    color: #00ff41;
    letter-spacing: 0.06em;
    display: inline-block;
  }

  /* row action buttons */
  .st-row-btns { display: inline-flex; justify-content: flex-end; gap: 6px; white-space: nowrap; }
  .st-row-btn {
    background: #000;
    border: 1px solid #00ff4155;
    color: #4a9e4a;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    padding: 3px 8px;
    cursor: pointer;
    border-radius: 1px;
    transition: all 0.15s;
    letter-spacing: 0.06em;
  }
  .st-row-btn:hover { color: #00ff41; border-color: #00ff41; background: #00ff4112; }
  .st-row-btn-del { border-color: #ff313133; color: #ff3131; }
  .st-row-btn-del:hover { border-color: #ff3131; background: #ff313112; box-shadow: 0 0 6px #ff313144; }

  /* gmail special card */
  .st-gmail-card {
    border: 1px solid #00ff4155;
    background: #020a02;
    border-radius: 2px;
    padding: 16px;
    margin: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .st-gmail-status {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #00ff41;
    font-size: 10px;
    letter-spacing: 0.1em;
    margin-bottom: 4px;
  }
  .st-gmail-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #00ff41;
    box-shadow: 0 0 4px #00ff41;
    animation: app-pulse 1.8s ease-in-out infinite;
  }
  .st-gmail-name { color: #00ff41; font-size: 14px; font-weight: bold; }
  .st-gmail-url { color: #4a9e4a; font-size: 11px; }
  .st-gmail-email { color: #2d6b2d; font-size: 10px; margin-bottom: 8px; }
  .st-gmail-btn {
    align-self: flex-start;
    background: transparent;
    border: 1px solid #ff313177;
    color: #ff5555;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    padding: 4px 12px;
    cursor: pointer;
    border-radius: 2px;
    letter-spacing: 0.06em;
    transition: all 0.15s;
  }
  .st-gmail-btn:hover { border-color: #ff3131; background: rgba(255,49,49,0.07); }
  @keyframes app-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  /* footer */
  .st-footer {
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

function useSettingsStyle() {
  useEffect(() => {
    const id = 'st-style';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = SETTINGS_STYLE;
      document.head.appendChild(tag);
    }
    return () => { const t = document.getElementById(id); if (t) t.remove(); };
  }, []);
}

const statusLabel = (s) => {
  if (s === 'connected') return <span className="st-status-ok">● ONLINE</span>;
  if (s === 'error')     return <span className="st-status-err">✖ ERROR</span>;
  return <span className="st-status-unk">◌ UNTESTED</span>;
};

export function Settings({ apps, setApps }) {
  useSettingsStyle();

  const [isAdding, setIsAdding]     = useState(false);
  const [editingApp, setEditingApp] = useState(null);

  // Check if Gmail is connected
  const gmailTokens = (() => { try { return JSON.parse(localStorage.getItem('jarvis_gmail_tokens') || '{}'); } catch { return {}; } })();
  const gmailConnected = !!gmailTokens.access_token;

  // Check if Google Sheets is connected
  const sheetsTokens = (() => { try { return JSON.parse(localStorage.getItem('jarvis_sheets_tokens') || '{}'); } catch { return {}; } })();
  const sheetsConnected = !!sheetsTokens.access_token;

  const handleSaveApp = async (appData) => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        appData.name,
          baseUrl:     appData.baseUrl,
          description: appData.description || '',
          authType:    appData.authHeader ? 'apiKey' : 'none',
          credentials: {
            authHeader: appData.authHeader,
            authPrefix: appData.authPrefix,
            authToken:  appData.apiKey || appData.authToken || '',
          },
          status:      appData.status || 'untested',
        }),
      });
      const data = await res.json();
      if (data.success) {
        const saved = { ...appData, id: data.app._id || appData.id };
        if (editingApp) {
          setApps(prev => prev.map(a => (a.id === appData.id ? saved : a)));
          setEditingApp(null);
        } else {
          setApps(prev => [...prev, saved]);
          setIsAdding(false);
        }
      }
    } catch (err) {
      console.error('[Settings] Failed to save app:', err);
      // Fallback: update local state only
      if (editingApp) {
        setApps(prev => prev.map(a => (a.id === appData.id ? appData : a)));
        setEditingApp(null);
      } else {
        setApps(prev => [...prev, appData]);
        setIsAdding(false);
      }
    }
  };

  const handleDeleteApp = async (id) => {
    if (!window.confirm('Remove this connected app?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + ''}/api/apps/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('[Settings] Failed to delete app from DB:', err);
    }
    // Always update local state regardless of API success
    setApps(prev => prev.filter(app => app.id !== id));
  };

  /* ── Add / Edit view ── */
  if (isAdding || editingApp) {
    return (
      <div className="st-root">
        <div className="st-title-bar">
          <span style={{ color: '#4a9e4a' }}>┌──[</span>
          <span style={{ color: '#00ff41' }}>JARVIS // INTEGRATIONS</span>
          <span style={{ color: '#4a9e4a' }}>]</span>
          <span style={{ flex: 1, borderTop: '1px solid #00ff4130' }} />
        </div>

        <button className="st-back-btn" onClick={() => { setIsAdding(false); setEditingApp(null); }}>
          ← BACK TO APP LIST
        </button>

        <AppConnector
          onSave={handleSaveApp}
          onCancel={() => { setIsAdding(false); setEditingApp(null); }}
          editApp={editingApp}
        />
      </div>
    );
  }

  /* ── Main list view ── */
  return (
    <div className="st-root">
      {/* Title bar */}
      <div className="st-title-bar">
        <span style={{ color: '#4a9e4a' }}>┌──[</span>
        <span style={{ color: '#00ff41' }}>JARVIS // INTEGRATIONS</span>
        <span style={{ color: '#4a9e4a' }}>]</span>
        <span style={{ flex: 1, borderTop: '1px solid #00ff4130' }} />
        <span style={{ color: '#4a9e4a', fontSize: 11 }}>{apps.length} APP{apps.length !== 1 ? 'S' : ''} CONNECTED</span>
      </div>

      {/* Panel */}
      <div className="st-panel">
        <div className="st-panel-header">
          <div className="st-panel-header-left">
            <span>┌─[</span>
            <span style={{ letterSpacing: '0.15em' }}>CONNECTED APPS</span>
            <span>]─</span>
            <span style={{ flex: 1, borderTop: '1px solid #00ff4155', margin: '0 8px', minWidth: 20 }} />
            <span className="st-dot" />
          </div>
          <button className="st-add-btn" onClick={() => setIsAdding(true)}>
            [ + ADD CONNECTION ]
          </button>
        </div>

        {/* Gmail Special Card */}
        {gmailConnected && (
          <div className="st-gmail-card">
            <div className="st-gmail-status">
              <span className="st-gmail-dot"></span>
              <span>ONLINE</span>
            </div>
            <div className="st-gmail-name">&gt; Gmail Integration</div>
            <div className="st-gmail-url">{import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com'}/api/gmail</div>
            <div className="st-gmail-email">
              &gt; {gmailTokens.email || 'OAuth Connected'}
            </div>
            <div>
              <button className="st-gmail-btn" onClick={() => {
                fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/tokens/gmail', { method: 'DELETE' }).catch(console.error);
                localStorage.removeItem('jarvis_gmail_tokens');
                setApps((prev) => prev.filter(a => !a.isGmail));
                window.location.reload();
              }}>
                [ DISCONNECT ]
              </button>
            </div>
          </div>
        )}
        {/* Google Sheets Special Card */}
        {sheetsConnected && (
          <div className="st-gmail-card" style={{ marginTop: gmailConnected ? 12 : 0 }}>
            <div className="st-gmail-status">
              <span className="st-gmail-dot" style={{ backgroundColor: '#00ff41', boxShadow: '0 0 4px #00ff41' }}></span>
              <span>ONLINE</span>
            </div>
            <div className="st-gmail-name">&gt; Google Sheets Integration</div>
            <div className="st-gmail-url">{import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com'}/api/sheets</div>
            <div className="st-gmail-email">
              &gt; Sheets OAuth Connected
            </div>
            <div>
              <button className="st-gmail-btn" onClick={() => {
                fetch((import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + '/api/tokens/sheets', { method: 'DELETE' }).catch(console.error);
                localStorage.removeItem('jarvis_sheets_tokens');
                setApps((prev) => prev.filter(a => !a.isSheets));
                window.location.reload();
              }}>
                [ DISCONNECT ]
              </button>
            </div>
          </div>
        )}

        {apps.filter(app => !app.isGmail && !app.isSheets).length === 0 && !gmailConnected && !sheetsConnected ? (
          <div className="st-empty">
            <div className="st-empty-title">NO INTEGRATIONS CONNECTED</div>
            <div>&gt; No external apps registered in the system.</div>
            <div>&gt; Click [ + ADD CONNECTION ] to link a new API.</div>
            <div style={{ marginTop: 16 }}>
              <button className="st-add-btn" onClick={() => setIsAdding(true)}>
                [ CONNECT FIRST APP ]
              </button>
            </div>
          </div>
        ) : (
          apps.filter(app => !app.isGmail && !app.isSheets).length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="st-table">
              <colgroup>
                <col className="col-app" />
                <col className="col-url" />
                <col className="col-status" />
                <col className="col-auth" />
                <col className="col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>APPLICATION</th>
                  <th>BASE URL</th>
                  <th className="st-col-status">STATUS</th>
                  <th>AUTH</th>
                  <th className="st-col-actions">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {apps.filter(app => !app.isGmail && !app.isSheets).map((app) => (
                  <tr key={app.id}>
                    <td>
                      <div className="st-app-name" title={app.name}>&gt; {app.name}</div>
                      <div className="st-app-desc" title={app.description}>
                        {app.description
                          ? app.description.length > 60
                            ? app.description.slice(0, 60) + '…'
                            : app.description
                          : 'No description'}
                      </div>
                    </td>
                    <td>
                      <span className="st-url" title={app.baseUrl}>{app.baseUrl}</span>
                    </td>
                    <td>{statusLabel(app.status)}</td>
                    <td>
                      {app.isGmail || app.isSheets
                        ? <span className="st-auth-tag-oauth">● OAuth2</span>
                        : app.apiKey
                          ? <span className="st-auth-tag" title={`${app.authHeader}: ${app.authPrefix} ••••`}>
                              {app.authHeader || 'Authorization'} ••••
                            </span>
                          : <span className="st-auth-tag">No Auth</span>
                      }
                    </td>
                    <td className="st-col-actions">
                      <div className="st-row-btns">
                        <button className="st-row-btn" onClick={() => setEditingApp(app)} title="Edit">
                          [ EDIT ]
                        </button>
                        <button className="st-row-btn st-row-btn-del" onClick={() => handleDeleteApp(app.id)} title="Delete">
                          [ DEL ]
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        )}
      </div>

      {/* Footer */}
      <div className="st-footer">
        <span>JARVIS // SECURE LOCAL PROXY ACTIVE</span>
        <span>PORT: 5000 // GEMINI API CONNECTED</span>
      </div>
    </div>
  );
}
