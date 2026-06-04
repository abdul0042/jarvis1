import React, { useState } from 'react';

export function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network authentication delay for high-tech experience
    setTimeout(() => {
      if (email === 'techvaseegrah26@gmail.com' && password === '123456') {
        onLoginSuccess();
      } else {
        setError('AUTHENTICATION FAILED: INVALID CREDENTIALS');
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div style={styles.container}>
      {/* Background Matrix/Radar Grid */}
      <div style={styles.gridOverlay} />

      {/* Login Box */}
      <div style={styles.loginBox}>
        {/* Futuristic Header Brackets */}
        <div style={styles.headerBracket}>┌─[ ACCESS RESTRICTED ]─┐</div>
        
        <h1 style={styles.title}>
          JARVIS<span style={styles.caret} />
        </h1>
        
        <div style={styles.subtitle}>SECURE PORTAL LOGIN</div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputContainer}>
            <label style={styles.label}>&gt; USER IDENTITY (EMAIL)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter secure email..."
              required
              disabled={loading}
              style={{
                ...styles.input,
                borderColor: error ? 'rgba(255, 49, 49, 0.4)' : 'rgba(0, 255, 65, 0.25)',
              }}
            />
          </div>

          <div style={styles.inputContainer}>
            <label style={styles.label}>&gt; SECURITY PASSCODE</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
              disabled={loading}
              style={{
                ...styles.input,
                borderColor: error ? 'rgba(255, 49, 49, 0.4)' : 'rgba(0, 255, 65, 0.25)',
              }}
            />
          </div>

          {error && <div style={styles.errorText}>[!] {error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              background: loading ? 'rgba(0, 255, 65, 0.05)' : 'rgba(0, 255, 65, 0.1)',
            }}
          >
            {loading ? 'RUNNING AUTHENTICATION DECRYPTOR...' : 'DECRYPT & ENTER'}
          </button>
        </form>

        <div style={styles.footerBracket}>└───────────────────────┘</div>
        <div style={styles.systemStatus}>● SYSTEM STATUS: ONLINE | FIREWALL SECURE</div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#000000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Share Tech Mono', monospace",
    color: '#00ff41',
    position: 'relative',
    overflow: 'hidden',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '30px 30px',
    pointerEvents: 'none',
  },
  loginBox: {
    width: '420px',
    backgroundColor: 'rgba(4, 8, 4, 0.9)',
    border: '1px solid rgba(0, 255, 65, 0.3)',
    borderRadius: '4px',
    padding: '30px 40px',
    boxShadow: '0 0 30px rgba(0, 255, 65, 0.15)',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  headerBracket: {
    fontSize: '12px',
    letterSpacing: '0.15em',
    color: 'rgba(0, 255, 65, 0.6)',
    marginBottom: '20px',
  },
  footerBracket: {
    fontSize: '12px',
    letterSpacing: '0.15em',
    color: 'rgba(0, 255, 65, 0.6)',
    marginTop: '20px',
    width: '100%',
    textAlign: 'center',
  },
  title: {
    fontSize: '28px',
    letterSpacing: '0.25em',
    textShadow: '0 0 10px rgba(0, 255, 65, 0.6)',
    fontWeight: 'normal',
    margin: '0 0 10px 0',
  },
  caret: {
    display: 'inline-block',
    width: '10px',
    height: '22px',
    backgroundColor: '#00ff41',
    verticalAlign: 'middle',
    marginLeft: '6px',
    animation: 'app-caret 1s step-end infinite',
    boxShadow: '0 0 8px #00ff41',
  },
  subtitle: {
    fontSize: '11px',
    letterSpacing: '0.2em',
    color: 'rgba(0, 255, 65, 0.5)',
    marginBottom: '35px',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    letterSpacing: '0.1em',
    color: 'rgba(0, 255, 65, 0.7)',
  },
  input: {
    backgroundColor: '#000000',
    color: '#00ff41',
    border: '1px solid rgba(0, 255, 65, 0.25)',
    borderRadius: '2px',
    padding: '10px 12px',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '14px',
    outline: 'none',
    boxShadow: 'inset 0 0 4px rgba(0, 255, 65, 0.05)',
    transition: 'all 0.2s',
  },
  errorText: {
    color: '#ff3131',
    fontSize: '11px',
    letterSpacing: '0.05em',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 49, 49, 0.08)',
    border: '1px solid rgba(255, 49, 49, 0.2)',
    padding: '8px',
    borderRadius: '2px',
  },
  button: {
    color: '#00ff41',
    border: '1px solid rgba(0, 255, 65, 0.4)',
    borderRadius: '2px',
    padding: '12px 0',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '13px',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 0 10px rgba(0, 255, 65, 0.1)',
  },
  systemStatus: {
    fontSize: '9px',
    color: 'rgba(0, 255, 65, 0.4)',
    marginTop: '15px',
    letterSpacing: '0.05em',
  },
};
