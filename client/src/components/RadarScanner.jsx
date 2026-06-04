import React, { useEffect, useState } from 'react';

const RADAR_CSS = `
  .radar-wrapper {
    position: relative;
    width: 100%;
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    font-family: 'Share Tech Mono', monospace;
  }

  .radar-container {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    max-width: 100%;
    margin: 0 auto;
    background: radial-gradient(circle, rgba(2, 16, 2, 0.45) 0%, rgba(0, 0, 0, 0.95) 100%);
    border-radius: 50%;
    border: 2px solid rgba(0, 255, 65, 0.5);
    box-shadow: 0 0 25px rgba(0, 255, 65, 0.25), inset 0 0 35px rgba(0, 255, 65, 0.15);
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .radar-container.alert-mode {
    border-color: rgba(255, 49, 49, 0.6);
    box-shadow: 0 0 25px rgba(255, 49, 49, 0.25), inset 0 0 35px rgba(255, 49, 49, 0.15);
  }

  /* Grid lines inside radar */
  .radar-grid {
    position: absolute;
    inset: -50%;
    background-image: 
      linear-gradient(rgba(0, 255, 65, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 65, 0.08) 1px, transparent 1px);
    background-size: 30px 30px;
    background-position: center center;
    z-index: 0;
  }
  .radar-container.alert-mode .radar-grid {
    background-image: 
      linear-gradient(rgba(255, 49, 49, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 49, 49, 0.08) 1px, transparent 1px);
  }

  /* Concentric circles */
  .radar-circle {
    position: absolute;
    border: 1px dashed rgba(0, 255, 65, 0.2);
    border-radius: 50%;
  }
  .radar-container.alert-mode .radar-circle {
    border: 1px dashed rgba(255, 49, 49, 0.2);
  }
  .radar-circle-1 { width: 20%; height: 20%; }
  .radar-circle-2 { width: 40%; height: 40%; }
  .radar-circle-3 { width: 60%; height: 60%; }
  .radar-circle-4 { width: 80%; height: 80%; }
  .radar-circle-5 { width: 95%; height: 95%; border: 1.5px solid rgba(0, 255, 65, 0.35); }
  .radar-container.alert-mode .radar-circle-5 { border-color: rgba(255, 49, 49, 0.35); }

  /* Polar lines */
  .radar-polar {
    position: absolute;
    width: 1px;
    height: 100%;
    background: rgba(0, 255, 65, 0.1);
    top: 0; left: 50%;
  }
  .radar-container.alert-mode .radar-polar {
    background: rgba(255, 49, 49, 0.1);
  }
  .polar-30 { transform: translateX(-50%) rotate(30deg); }
  .polar-60 { transform: translateX(-50%) rotate(60deg); }
  .polar-90 { transform: translateX(-50%) rotate(90deg); }
  .polar-120 { transform: translateX(-50%) rotate(120deg); }
  .polar-150 { transform: translateX(-50%) rotate(150deg); }
  .polar-180 { transform: translateX(-50%) rotate(180deg); }

  /* Ticks & Labels */
  .radar-tick-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 4;
  }
  .radar-tick-wrapper {
    position: absolute;
    top: 0; left: 50%;
    width: 2px;
    height: 50%;
    transform-origin: bottom center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .radar-tick-mark {
    width: 1px;
    height: 6px;
    background: rgba(0, 255, 65, 0.5);
  }
  .radar-tick-label {
    color: rgba(0, 255, 65, 0.6);
    font-size: 7px;
    font-family: 'Share Tech Mono', monospace;
    margin-top: 2px;
  }
  .radar-container.alert-mode .radar-tick-mark { background: rgba(255, 49, 49, 0.5); }
  .radar-container.alert-mode .radar-tick-label { color: rgba(255, 49, 49, 0.6); }

  /* Sweep Beam */
  .radar-sweep {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0; left: 0;
    background: conic-gradient(from 0deg, rgba(0, 255, 65, 0) 0deg, rgba(0, 255, 65, 0.02) 260deg, rgba(0, 255, 65, 0.28) 360deg);
    border-radius: 50%;
    animation: radar-spin 4s linear infinite;
    z-index: 2;
    pointer-events: none;
  }
  .radar-container.alert-mode .radar-sweep {
    background: conic-gradient(from 0deg, rgba(255, 49, 49, 0) 0deg, rgba(255, 49, 49, 0.02) 260deg, rgba(255, 49, 49, 0.28) 360deg);
  }

  /* Pulse Rings */
  .radar-pulse {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 1px solid rgba(0, 255, 65, 0.35);
    border-radius: 50%;
    opacity: 0;
    animation: radar-pulse-anim 3s ease-out infinite;
    z-index: 1;
  }
  .radar-container.alert-mode .radar-pulse {
    border: 1px solid rgba(255, 49, 49, 0.35);
    animation: radar-pulse-alert 1.5s ease-out infinite;
  }

  @keyframes radar-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes radar-pulse-alert {
    0% { transform: scale(0.1); opacity: 0.8; }
    100% { transform: scale(1); opacity: 0; }
  }

  @keyframes radar-pulse-anim {
    0% { transform: scale(0.1); opacity: 0.6; }
    100% { transform: scale(1); opacity: 0; }
  }

  .radar-dot-container {
    position: absolute;
    z-index: 5;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .radar-dot {
    width: 6px;
    height: 6px;
    background-color: #00ff41;
    border-radius: 50%;
    box-shadow: 0 0 8px #00ff41, 0 0 16px #00ff41;
    animation: dot-blink 3s infinite;
    flex-shrink: 0;
  }
  .radar-dot.error {
    background-color: #ff3131;
    box-shadow: 0 0 8px #ff3131, 0 0 16px #ff3131;
    animation: dot-error-blink 1s infinite;
  }

  .radar-dot-name {
    color: #00ff41;
    background: rgba(2, 8, 2, 0.85);
    border: 1px solid rgba(0, 255, 65, 0.4);
    font-size: 9px;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 1px;
    font-family: 'Share Tech Mono', monospace;
    white-space: nowrap;
    box-shadow: 0 0 6px rgba(0, 255, 65, 0.15);
    text-transform: uppercase;
    letter-spacing: 1px;
    animation: fade-in 1s ease-out forwards;
    text-shadow: 0 0 3px rgba(0, 255, 65, 0.4);
  }
  .radar-dot-name.error {
    background: rgba(15, 2, 2, 0.85);
    border-color: rgba(255, 49, 49, 0.45);
    color: #ff3131;
    box-shadow: 0 0 6px rgba(255, 49, 49, 0.15);
    text-shadow: 0 0 3px rgba(255, 49, 49, 0.4);
  }

  @keyframes dot-blink {
    0%, 10% { opacity: 0; transform: scale(0.5); }
    11%, 30% { opacity: 1; transform: scale(1.2); }
    100% { opacity: 0; transform: scale(0.8); }
  }
  @keyframes dot-error-blink {
    0% { opacity: 1; transform: scale(1.2); }
    50% { opacity: 0.4; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1.2); }
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .radar-status {
    color: #00ff41;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-shadow: 0 0 4px rgba(0, 255, 65, 0.3);
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .radar-status.alert-mode {
    color: #ff3131;
    text-shadow: 0 0 4px rgba(255, 49, 49, 0.4);
    font-weight: bold;
  }
  
  .radar-status-dot {
    width: 6px;
    height: 6px;
    background: #00ff41;
    border-radius: 50%;
    animation: hud-blink 1.5s infinite;
  }
  .radar-status.alert-mode .radar-status-dot {
    background: #ff3131;
    box-shadow: 0 0 6px #ff3131;
    animation: rec-blink 0.5s step-end infinite;
  }

  .loading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    color: #00ff41;
    font-size: 11px;
    letter-spacing: 0.1em;
    z-index: 10;
    animation: fade-out 2s forwards 1.5s;
    pointer-events: none;
  }
  @keyframes fade-out {
    to { opacity: 0; visibility: hidden; }
  }

  .radar-hud-text {
    position: absolute;
    font-size: 8px;
    color: rgba(0, 255, 65, 0.6);
    pointer-events: none;
    z-index: 4;
    font-family: 'Share Tech Mono', monospace;
    letter-spacing: 0.05em;
  }
  .radar-hud-text.top-left { top: 12px; left: 12px; }
  .radar-hud-text.top-right { top: 12px; right: 12px; }
  .radar-hud-text.bottom-left { bottom: 12px; left: 12px; }
  .radar-hud-text.bottom-right { bottom: 12px; right: 12px; }
  
  .radar-container.alert-mode .radar-hud-text {
    color: rgba(255, 49, 49, 0.65);
  }

  .radar-scanline {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      rgba(18, 16, 16, 0) 50%, 
      rgba(0, 0, 0, 0.12) 50%
    );
    background-size: 100% 4px;
    pointer-events: none;
    z-index: 3;
    opacity: 0.4;
    border-radius: 50%;
  }

  @media (max-width: 600px) {
    .radar-wrapper { padding: 5px; gap: 8px; }
    .radar-tick-label { font-size: 5px; margin-top: 1px; }
    .radar-tick-mark { height: 4px; }
    .radar-status { font-size: 9px; }
  }
`;

export function RadarScanner({ apps = [] }) {
  const [appPositions, setAppPositions] = useState([]);
  const [azimuth, setAzimuth] = useState(142);
  const [ping, setPing] = useState(42);
  const ticks = Array.from({ length: 36 }); // 36 * 10 = 360 degrees

  useEffect(() => {
    // Generate deterministic but scattered positions for apps based on their index
    const positions = apps.map((app, i) => {
      // Calculate a position around the circle
      const angle = (i * (360 / apps.length) + 45) * (Math.PI / 180);
      const radius = 15 + (Math.random() * 15); // Distance from center (%)
      const top = 50 + radius * Math.sin(angle) + '%';
      const left = 50 + radius * Math.cos(angle) + '%';
      return {
        ...app,
        top,
        left,
        delay: Math.random() * 2 + 's'
      };
    });
    setAppPositions(positions);

    // Jitter telemetry variables
    const tVal = setInterval(() => {
      setAzimuth(Math.floor(Math.random() * 360));
      setPing(30 + Math.floor(Math.random() * 25));
    }, 1500);
    
    // Inject CSS
    const id = 'radar-css-style';
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    style.innerHTML = RADAR_CSS;

    return () => clearInterval(tVal);
  }, [apps]);

  const hasError = appPositions.some(app => app.status === 'error');

  return (
    <div className="radar-wrapper">
      <div className="loading-overlay">
        &gt; INITIALIZING TRACING SYSTEM...
      </div>
      
      <div className={`radar-container ${hasError ? 'alert-mode' : ''}`}>
        <div className="radar-grid" />
        <div className="radar-scanline" />
        
        {/* Hacker terminal overlay labels */}
        <div className="radar-hud-text top-left">SYS_PING: {ping}ms</div>
        <div className="radar-hud-text top-right">AZIMUTH: {azimuth.toString().padStart(3, '0')}°</div>
        <div className="radar-hud-text bottom-left">SWEEP_RATE: 4.0s</div>
        <div className="radar-hud-text bottom-right">RANGE: 1500m</div>

        {/* Polar lines */}
        <div className="radar-polar polar-30" />
        <div className="radar-polar polar-60" />
        <div className="radar-polar polar-90" />
        <div className="radar-polar polar-120" />
        <div className="radar-polar polar-150" />
        <div className="radar-polar polar-180" />

        {/* Concentric rings */}
        <div className="radar-circle radar-circle-1" />
        <div className="radar-circle radar-circle-2" />
        <div className="radar-circle radar-circle-3" />
        <div className="radar-circle radar-circle-4" />
        <div className="radar-circle radar-circle-5" />
        
        {/* Outer Tick Marks & Labels */}
        <div className="radar-tick-container">
          {ticks.map((_, i) => (
            <div key={i} className="radar-tick-wrapper" style={{ transform: `translateX(-50%) rotate(${i * 10}deg)` }}>
              <div className="radar-tick-mark" />
              <div className="radar-tick-label">{(i * 10).toString().padStart(3, '0')}</div>
            </div>
          ))}
        </div>

        <div className="radar-sweep" />
        <div className="radar-pulse" />
        
        {appPositions.length === 0 && (
          <div style={{ position: 'absolute', color: 'rgba(0, 255, 65, 0.5)', fontSize: 11, zIndex: 4, top: '65%' }}>
            NO APPS DETECTED
          </div>
        )}

        {appPositions.map((app) => (
          <div 
            key={app.id || Math.random()} 
            className="radar-dot-container"
            style={{ top: app.top, left: app.left }}
          >
            <div 
              className={`radar-dot ${app.status === 'error' ? 'error' : ''}`} 
              style={{ animationDelay: app.delay }} 
            />
            <span className={`radar-dot-name ${app.status === 'error' ? 'error' : ''}`}>
              {app.name}
            </span>
          </div>
        ))}
      </div>
      
      <div className={`radar-status ${hasError ? 'alert-mode' : ''}`}>
        <div className="radar-status-dot" />
        <span>
          {hasError 
            ? `CRITICAL: PROBLEM DETECTED IN ${appPositions.filter(a => a.status === 'error').length} APPS` 
            : `TRACKING ${appPositions.length} CONNECTED APPS`}
        </span>
      </div>
    </div>
  );
}
