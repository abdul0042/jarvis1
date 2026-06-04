import React from 'react';

export function VoiceInput({ isListening, onStart, onStop, error, browserSupported }) {
  if (!browserSupported) {
    return (
      <button
        disabled
        title="Speech recognition not supported in this browser"
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          background: 'transparent',
          border: 'none',
          borderLeft: '1px solid #00ff4122',
          color: '#2d6b2d',
          fontSize: 12,
          padding: '0 12px',
          cursor: 'not-allowed',
          height: '100%',
        }}
      >
        🎙
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%', position: 'relative', flexShrink: 0 }}>
      {/* ripple when listening */}
      {isListening && (
        <span style={{
          position: 'absolute',
          inset: '4px',
          borderRadius: '50%',
          border: '1px solid #ff3131',
          boxShadow: '0 0 6px #ff313156',
          animation: 'ch-ripple 1s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      <button
        type="button"
        onClick={isListening ? onStop : onStart}
        title={isListening ? 'Stop Voice Recording' : 'Start Voice Recording'}
        style={{
          fontFamily: "'Share Tech Mono', monospace",
          background: 'transparent',
          border: 'none',
          borderLeft: '1px solid #00ff4133',
          color: isListening ? '#ff3131' : '#4a9e4a',
          fontSize: 12,
          padding: '0 12px',
          cursor: 'pointer',
          transition: 'all 0.15s',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          if (!isListening) e.target.style.color = '#00ff41';
        }}
        onMouseLeave={(e) => {
          if (!isListening) e.target.style.color = '#4a9e4a';
        }}
      >
        {isListening ? '■' : '🎙'}
      </button>

      {error && (
        <div style={{
          position: 'absolute',
          bottom: '120%',
          right: 0,
          background: '#0a0202',
          border: '1px solid #ff313155',
          color: '#ff3131',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          padding: '6px 10px',
          borderRadius: 1,
          whiteSpace: 'nowrap',
          zIndex: 50,
        }}>
          ✖ {error}
        </div>
      )}

      <style>{`
        @keyframes ch-ripple {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
