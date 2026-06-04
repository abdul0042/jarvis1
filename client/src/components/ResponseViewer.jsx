import React, { useState } from 'react';

export function ResponseViewer({ response, action }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!response) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOk = response.status >= 200 && response.status < 300;
  const statusColor = !response.status ? '#4a9e4a' : isOk ? '#00ff41' : '#ff3131';

  return (
    <div style={{
      marginTop: 10,
      border: `1px solid ${isOk ? '#00ff4133' : '#ff313133'}`,
      background: '#010401',
      borderRadius: 1,
      overflow: 'hidden',
      fontFamily: "'Share Tech Mono', monospace",
    }}>
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#4a9e4a',
          fontSize: 11,
          letterSpacing: '0.06em',
          fontFamily: "'Share Tech Mono', monospace",
        }}
      >
        <span>
          &gt; {action ? `${action.method} ${action.endpoint}` : 'API Response'}
          {response.status && (
            <span style={{ marginLeft: 10, color: statusColor }}>
              [{response.status} {isOk ? 'OK' : 'ERR'}]
            </span>
          )}
        </span>
        <span style={{ color: '#2d6b2d', fontSize: 10 }}>
          {isOpen ? '[ ▲ HIDE ]' : '[ ▼ SHOW ]'}
        </span>
      </button>

      {/* Collapsible JSON */}
      {isOpen && (
        <div style={{
          borderTop: '1px solid #00ff4122',
          padding: '10px',
          position: 'relative',
          background: '#020502',
        }}>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: '#000',
              border: '1px solid #00ff4155',
              color: copied ? '#00ff41' : '#4a9e4a',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 10,
              padding: '2px 8px',
              cursor: 'pointer',
              borderRadius: 1,
              letterSpacing: '0.06em',
            }}
            title="Copy JSON"
          >
            {copied ? '✔ COPIED' : '[ COPY ]'}
          </button>

          <pre style={{
            maxHeight: 280,
            overflow: 'auto',
            fontSize: 11,
            color: '#4a9e4a',
            lineHeight: 1.6,
            margin: 0,
            paddingRight: 60,
            scrollbarWidth: 'thin',
            scrollbarColor: '#00ff4144 transparent',
          }}>
            <code>{JSON.stringify(response, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
