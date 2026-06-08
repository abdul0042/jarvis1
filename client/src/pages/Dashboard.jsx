import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { testConnection, executeAction } from '../utils/appExecutor';
import { RadarScanner } from '../components/RadarScanner';

/* ─── Hacker HUD styles injected into <head> ─── */
const DASHBOARD_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

  .db-root {
    font-family: 'Share Tech Mono', monospace;
    background: #000000;
    color: #00ff41;
    position: relative;
    min-height: 100%;
    padding: 4px;
  }

  /* dot-grid background */
  .db-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: radial-gradient(circle, rgba(0, 255, 65, 0.08) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
    z-index: 0;
  }

  /* scanline overlay */
  .db-root::after {
    content: '';
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 255, 65, 0.015) 2px,
      rgba(0, 255, 65, 0.015) 4px
    );
    pointer-events: none;
    z-index: 0;
  }

  .db-inner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Glassmorphic Panel with sci-fi design */
  .hud-panel {
    background: rgba(4, 8, 4, 0.85);
    border: 1px solid rgba(0, 255, 65, 0.35);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), inset 0 0 10px rgba(0, 255, 65, 0.05);
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: border-color 0.25s, box-shadow 0.25s;
  }

  .hud-panel:hover {
    border-color: #00ff41;
    box-shadow: 0 0 12px rgba(0, 255, 65, 0.25), inset 0 0 12px rgba(0, 255, 65, 0.08);
  }

  /* Corner Accents */
  .hud-corner {
    position: absolute;
    width: 8px;
    height: 8px;
    border-color: rgba(0, 255, 65, 0.65);
    border-style: solid;
    pointer-events: none;
    z-index: 5;
  }
  .hud-corner.top-left { top: 0; left: 0; border-width: 2px 0 0 2px; }
  .hud-corner.top-right { top: 0; right: 0; border-width: 2px 2px 0 0; }
  .hud-corner.bottom-left { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
  .hud-corner.bottom-right { bottom: 0; right: 0; border-width: 0 2px 2px 0; }

  /* Panel Header */
  .hud-header {
    font-size: 11px;
    letter-spacing: 0.12em;
    padding: 8px 14px;
    background: #020502;
    border-bottom: 1px solid rgba(0, 255, 65, 0.3);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .hud-header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #00ff41;
    text-shadow: 0 0 4px rgba(0, 255, 65, 0.4);
  }
  .hud-header-subtitle {
    font-size: 9px;
    color: #4a9e4a;
  }

  .hud-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    box-shadow: 0 0 8px currentColor;
    flex-shrink: 0;
  }
  .hud-dot-green { background-color: #00ff41; color: #00ff41; animation: hud-blink 1.5s infinite; }
  .hud-dot-red { background-color: #ff3131; color: #ff3131; animation: hud-blink 1s infinite; }

  @keyframes hud-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .hud-body {
    padding: 14px;
    flex: 1;
    overflow: auto;
    font-size: 12px;
  }

  /* Telemetry meters and grids */
  .telemetry-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(0, 255, 65, 0.1);
    padding-bottom: 4px;
  }
  .telemetry-row:last-child {
    margin-bottom: 0;
    border-bottom: none;
    padding-bottom: 0;
  }
  .telemetry-label {
    color: #4a9e4a;
    font-size: 11px;
    letter-spacing: 0.05em;
  }
  .telemetry-value {
    color: #00ff41;
    font-weight: bold;
    text-shadow: 0 0 4px rgba(0, 255, 65, 0.2);
  }
  .telemetry-value.pink {
    color: #ff3131;
    text-shadow: 0 0 4px rgba(255, 49, 49, 0.2);
  }

  /* Cyber Meter / Progress Bar */
  .hud-meter-container {
    width: 80px;
    height: 6px;
    background: rgba(0, 255, 65, 0.1);
    border-radius: 1px;
    overflow: hidden;
    position: relative;
    border: 1px solid rgba(0, 255, 65, 0.15);
  }
  .hud-meter-fill {
    height: 100%;
    background: #00ff41;
    box-shadow: 0 0 6px #00ff41;
    transition: width 0.5s ease-out;
  }
  .hud-meter-fill.pink {
    background: #ff3131;
    box-shadow: 0 0 6px #ff3131;
  }

  /* Ambient Background Eye Core */
  .hud-eye-bg-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 0;
  }
  .hud-eye-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.28;
    mix-blend-mode: screen;
    filter: brightness(1.1) contrast(1.2) saturate(0.4) sepia(0.8) hue-rotate(80deg);
  }

  .hud-feed-container {
    position: relative;
    width: 100%;
    height: 100%;
    flex: 1;
    overflow: hidden;
  }
  .hud-feed-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.08) translateY(-6px);
    opacity: 0.75;
    filter: brightness(1.1) contrast(1.2) saturate(0.4) sepia(0.8) hue-rotate(80deg);
    transition: opacity 0.3s;
  }
  .hud-feed-container:hover .hud-feed-img {
    opacity: 0.9;
  }
  .hud-feed-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(0, 255, 65, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 65, 0.05) 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
    z-index: 1;
  }
  .hud-scanline {
    position: absolute;
    width: 100%;
    height: 4px;
    background: linear-gradient(180deg, rgba(0, 255, 65, 0) 0%, rgba(0, 255, 65, 0.4) 50%, rgba(0, 255, 65, 0) 100%);
    animation: scanline-move 5s linear infinite;
    pointer-events: none;
    z-index: 2;
  }
  @keyframes scanline-move {
    0% { top: -4px; }
    100% { top: 100%; }
  }
  .hud-crosshair-v {
    position: absolute;
    left: 50%;
    top: 5%;
    bottom: 5%;
    width: 1px;
    background: rgba(0, 255, 65, 0.25);
    pointer-events: none;
    z-index: 1;
  }
  .hud-crosshair-h {
    position: absolute;
    top: 50%;
    left: 5%;
    right: 5%;
    height: 1px;
    background: rgba(0, 255, 65, 0.25);
    pointer-events: none;
    z-index: 1;
  }
  .hud-reticle {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 32px;
    height: 32px;
    border: 1px solid rgba(0, 255, 65, 0.45);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 1;
  }
  .hud-reticle::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 4px;
    height: 4px;
    background: #00ff41;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 6px #00ff41;
  }
  .hud-feed-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: #000;
    border: 1px solid rgba(0, 255, 65, 0.5);
    color: #00ff41;
    padding: 2px 6px;
    font-size: 9px;
    z-index: 3;
  }
  .hud-feed-telemetry {
    position: absolute;
    bottom: 8px;
    left: 8px;
    right: 8px;
    display: flex;
    justify-content: space-between;
    color: rgba(0, 255, 65, 0.7);
    font-size: 8px;
    z-index: 3;
    background: #000;
    padding: 2px 6px;
    border: 1px solid rgba(0, 255, 65, 0.3);
  }

  /* Surveillance Feed Widget */
  .hud-cam-container {
    position: relative;
    width: 100%;
    height: 150px;
    background: #000;
    border: 1px solid rgba(0, 255, 65, 0.3);
    overflow: hidden;
    border-radius: 2px;
    margin-bottom: 12px;
    box-shadow: inset 0 0 20px rgba(0, 255, 65, 0.1);
  }
  .hud-cam-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform: scale(1.85) translateY(18px);
    opacity: 0.7;
    filter: brightness(1.05) contrast(1.15) saturate(0.3) sepia(0.8) hue-rotate(80deg);
  }
  .hud-cam-overlay-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px);
    background-size: 15px 15px;
    pointer-events: none;
    z-index: 1;
  }
  .hud-cam-scanline {
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%);
    background-size: 100% 4px;
    pointer-events: none;
    z-index: 2;
    animation: cam-flicker 0.2s infinite;
  }
  @keyframes cam-flicker {
    0% { opacity: 0.96; }
    50% { opacity: 1; }
    100% { opacity: 0.98; }
  }
  .hud-cam-rec {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    background: #000;
    padding: 2px 6px;
    border-radius: 1px;
    border: 1px solid #ff3131;
    color: #ff3131;
    font-size: 9px;
    font-weight: 700;
    z-index: 3;
    box-shadow: 0 0 5px rgba(255, 49, 49, 0.3);
  }
  .hud-rec-dot {
    width: 6px;
    height: 6px;
    background: #ff3131;
    border-radius: 50%;
    animation: rec-blink 1s step-end infinite;
    box-shadow: 0 0 6px #ff3131;
  }
  @keyframes rec-blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  .hud-cam-info {
    position: absolute;
    top: 8px;
    left: 8px;
    background: #000;
    color: rgba(0, 255, 65, 0.85);
    padding: 2px 6px;
    border-radius: 1px;
    font-size: 9px;
    border: 1px solid rgba(0, 255, 65, 0.3);
    z-index: 3;
  }

  /* Cyber Buttons with hacker green styles */
  .cyber-btn {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    background: #000;
    color: #00ff41;
    border: 1px solid rgba(0, 255, 65, 0.45);
    padding: 6px 12px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .cyber-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(0, 255, 65, 0.15), transparent);
    transition: left 0.5s;
  }
  .cyber-btn:hover::before { left: 100%; }
  .cyber-btn:hover {
    background: rgba(0, 255, 65, 0.15);
    border-color: #00ff41;
    box-shadow: 0 0 8px rgba(0, 255, 65, 0.35);
  }
  .cyber-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .cyber-btn-red {
    color: #ff3131;
    border-color: rgba(255, 49, 49, 0.4);
  }
  .cyber-btn-red:hover {
    background: rgba(255, 49, 49, 0.15);
    border-color: #ff3131;
    box-shadow: 0 0 8px rgba(255, 49, 49, 0.35);
  }

  /* Integration app card */
  .cyber-app-card {
    background: #020502;
    border: 1px solid rgba(0, 255, 65, 0.15);
    border-left: 3px solid #4a9e4a;
    border-radius: 2px;
    padding: 8px 12px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    transition: all 0.2s ease;
  }
  .cyber-app-card:last-child { margin-bottom: 0; }
  .cyber-app-card:hover {
    background: #030803;
    border-color: rgba(0, 255, 65, 0.45);
    box-shadow: 0 0 8px rgba(0, 255, 65, 0.15);
    transform: translateX(2px);
  }
  .cyber-app-card.status-connected { border-left-color: #00ff41; }
  .cyber-app-card.status-error {
    border-left-color: #ff3131;
    background: rgba(255, 49, 49, 0.02);
  }
  .cyber-app-card.status-error:hover {
    border-color: rgba(255, 49, 49, 0.45);
    box-shadow: 0 0 8px rgba(255, 49, 49, 0.15);
  }

  /* Log items */
  .log-stream {
    font-size: 11px;
    line-height: 1.6;
    max-height: 270px;
    overflow-y: auto;
  }
  .log-row {
    display: flex;
    gap: 8px;
    padding: 6px 8px;
    border-bottom: 1px solid rgba(0, 255, 65, 0.1);
    align-items: flex-start;
    animation: row-fadein 0.3s ease both;
  }
  .log-row:last-child { border-bottom: none; }
  .log-row:hover { background: rgba(0, 255, 65, 0.05); }
  @keyframes row-fadein {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .log-ts { color: #4a9e4a; flex-shrink: 0; }
  .log-ok { color: #00ff41; text-shadow: 0 0 4px rgba(0, 255, 65, 0.3); }
  .log-err { color: #ff3131; text-shadow: 0 0 4px rgba(255, 49, 49, 0.3); }
  
  .log-method { font-weight: bold; }
  .method-get { color: #00ff41; }
  .method-post { color: #00ff66; }
  .method-delete { color: #ff3131; }
  .method-put { color: #eab308; }

  /* Faint Hex Grid Overlay */
  .hex-grid-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='41.5' viewBox='0 0 24 41.5'%3E%3Cpath d='M12 0 L24 7 L24 20.75 L12 27.75 L0 20.75 L0 7 Z M12 41.5 L24 34.5 L24 20.75 L12 27.75 L0 20.75 L0 34.5 Z' fill='none' stroke='%2300ff41' stroke-width='0.75'/%3E%3C/svg%3E");
    background-size: 24px 41.5px;
  }

  /* Commands console Grid */
  .console-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .console-btn {
    background: #010301;
    border: 1px solid rgba(0, 255, 65, 0.2);
    padding: 8px 10px;
    text-align: left;
    font-size: 11px;
    color: #00ff41;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
    border-radius: 2px;
    overflow: hidden;
  }

  .console-btn::after {
    content: '▶';
    position: absolute;
    right: 10px;
    font-size: 8px;
    opacity: 0;
    transform: translateX(-4px);
    transition: all 0.2s;
  }

  .console-btn:hover {
    border-color: #00ff41;
    background: rgba(0, 255, 65, 0.12);
    box-shadow: 0 0 10px rgba(0, 255, 65, 0.25);
    padding-right: 20px;
  }

  .console-btn:hover::after {
    opacity: 1;
    transform: translateX(0);
  }

  /* Navigation buttons - solid border & glow */
  .nav-btn {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    background: rgba(0, 255, 65, 0.03);
    color: #00ff41;
    border: 1px solid #00ff41;
    padding: 8px 14px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.25s;
    width: 100%;
    text-align: center;
    text-transform: uppercase;
    font-weight: bold;
    letter-spacing: 0.1em;
    box-shadow: 0 0 8px rgba(0, 255, 65, 0.25);
    display: block;
  }

  .nav-btn:hover {
    background: rgba(0, 255, 65, 0.12);
    box-shadow: 0 0 14px rgba(0, 255, 65, 0.45);
    border-color: #00ff41;
  }

  .hud-col-5 {
    grid-column: span 5;
  }
  .hud-col-6 {
    grid-column: span 6;
  }
  .hud-col-7 {
    grid-column: span 7;
  }
  .hud-col-10 {
    grid-column: span 10;
  }
  .wide-panel {
    grid-column: span 20;
  }

  /* Custom grid columns */
  .hud-grid {
    display: grid;
    grid-template-columns: repeat(20, 1fr);
    gap: 16px;
  }

  @media (max-width: 950px) {
    .hud-grid {
      grid-template-columns: 1fr;
    }
    .hud-col-5, .hud-col-6, .hud-col-7, .hud-col-10, .wide-panel {
      grid-column: auto !important;
    }
  }

  /* Empty state */
  .db-empty {
    color: #4a9e4a;
    font-size: 11px;
    padding: 16px 0;
    text-align: center;
  }

  /* Custom scrollbar utility for high-tech HUD styling */
  .cyber-scroll-container::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  .cyber-scroll-container::-webkit-scrollbar-track {
    background: rgba(0, 255, 65, 0.02);
    border-radius: 2px;
  }
  .cyber-scroll-container::-webkit-scrollbar-thumb {
    background: rgba(0, 255, 65, 0.25);
    border-radius: 2px;
    box-shadow: inset 0 0 1px rgba(0, 255, 65, 0.5);
  }
  .cyber-scroll-container::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 255, 65, 0.6);
    box-shadow: 0 0 6px rgba(0, 255, 65, 0.5);
  }
`;

/* ─── Inject style once ─── */
function useGlobalStyle(css) {
  useEffect(() => {
    const id = 'db-hacker-style';
    let tag = document.getElementById(id);
    if (!tag) {
      tag = document.createElement('style');
      tag.id = id;
      document.head.appendChild(tag);
    }
    tag.textContent = css;
    return () => {
      const activeTag = document.getElementById(id);
      if (activeTag) activeTag.remove();
    };
  }, [css]);
}

/* ─── Corner Accent Component ─── */
function CornerAccents() {
  return (
    <>
      <div className="hud-corner top-left" />
      <div className="hud-corner top-right" />
      <div className="hud-corner bottom-left" />
      <div className="hud-corner bottom-right" />
    </>
  );
}

/* ─── HUD Panel Header ─── */
function PanelHeader({ label, dotActive, subLabel }) {
  return (
    <div className="hud-header">
      <div className="hud-header-title">
        <span>┌─[</span>
        <span>{label}</span>
        <span>]─</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {subLabel && <span className="hud-header-subtitle">{subLabel}</span>}
        <span
          className={`hud-dot ${dotActive ? 'hud-dot-green' : 'hud-dot-red'}`}
          title={dotActive ? 'Active' : 'Offline'}
        />
      </div>
    </div>
  );
}

/* ─── Neural Link / Visual Feed Panel ─── */
function NeuralLinkPanel({ className = "hud-col-5" }) {
  const [signal, setSignal] = useState(99.4);

  useEffect(() => {
    const t = setInterval(() => {
      setSignal(Number((98.5 + Math.random() * 1.4).toFixed(2)));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={`hud-panel ${className}`}>
      <CornerAccents />
      <PanelHeader label="SYSTEM VISUAL FEED" dotActive={true} subLabel="DIRECT FEED" />
      <div className="hud-body" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Animated Target reticle over Hands image */}
        <div className="hud-feed-container">
          <div className="hud-feed-grid" />
          <div className="hud-scanline" />
          <div className="hud-crosshair-v" />
          <div className="hud-crosshair-h" />
          <div className="hud-reticle" />
          <video
            src="/skull.mp4"
            className="hud-feed-img"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="hud-feed-badge">LINK_STABILITY [{signal}%]</div>
          <div className="hud-feed-telemetry">
            <span>COGNITIVE: SYNCED</span>
            <span>CHANNELS: 16/16</span>
            <span>LATENCY: 0.1ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ─── Live Feed Panel ─── */
function LiveFeedPanel({ apps }) {
  const [events, setEvents] = useState([]);
  const [polling, setPolling] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const feedRef = useRef(null);

  const fmtTs = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const addEvent = (appName, icon, message, level = 'info') => {
    setEvents(prev => [{
      id: `${Date.now()}-${Math.random()}`,
      ts: fmtTs(),
      appName,
      icon,
      message,
      level,
    }, ...prev].slice(0, 60)); // keep last 60 events
  };

  // Detect app type and pick the right polling endpoint + parser
  const getAppPoller = (app) => {
    const name = app.name.toLowerCase();
    if (name.includes('gmail')) {
      return {
        endpoint: '/inbox',
        parse: (data) => {
          const emails = data?.emails || [];
          const count = data?.count ?? emails.length ?? 0;
          return { count, emails };
        },
        icon: '📧',
        level: (r) => r.count > 0 ? 'alert' : 'info',
        isGmail: true,
      };
    }
    if (name.includes('sheet') || name.includes('google')) {
      return {
        endpoint: '/spreadsheets',
        parse: (data) => {
          const title = data?.properties?.title || data?.title || 'Sheet';
          const sheets = data?.sheets?.length || 0;
          return { title, sheets };
        },
        icon: '📊',
        label: (r) => `"${r.title}" active — ${r.sheets} sheet(s)`,
        level: () => 'info',
      };
    }
    // WooCommerce / F3 / generic orders app
    if (name.includes('woo') || name.includes('commerce') || name.includes('f3') || name.includes('order')) {
      return {
        endpoint: '/orders?per_page=5&orderby=date&order=desc',
        parse: (data) => {
          const rawOrders =
            Array.isArray(data) ? data :
              Array.isArray(data?.data) ? data.data :
                Array.isArray(data?.orders) ? data.orders :
                  [];
          const total = data?.total ?? data?.total_orders ?? data?.total_count ?? rawOrders.length;
          const latest = rawOrders[0];
          return { total, latest };
        },
        icon: '🛒',
        label: (r) => {
          if (!r.latest) return `${r.total} total orders`;
          const id = r.latest.id || r.latest.number || r.latest.orderId || '?';
          const status = r.latest.status || 'unknown';
          const customer = r.latest.billing?.first_name || r.latest.customer_name || r.latest.customerName || 'Customer';
          return `#${id} — ${status} — ${customer} | Total: ${r.total}`;
        },
        level: (r) => r.latest?.status === 'processing' || r.latest?.status === 'pending' ? 'alert' : 'info',
      };
    }
    // Generic fallback — just ping the base URL
    return null;
  };

  const pollAll = async () => {
    if (!apps.length) return;
    setPolling(true);
    for (const app of apps) {
      const poller = getAppPoller(app);
      if (!poller) {
        addEvent(app.name, '🔌', `Ping OK — ${app.baseUrl}`, 'info');
        continue;
      }
      try {
        const result = await executeAction(app, { method: 'GET', endpoint: poller.endpoint, payload: {} });
        if (result.status >= 200 && result.status < 400) {
          const parsed = poller.parse(result.data);

          if (poller.isGmail) {
            // Show only the latest email
            if (parsed.count === 0) {
              addEvent(app.name, '📧', 'No unread emails', 'info');
            } else {
              const latest = parsed.emails[0];
              if (latest) {
                const rawFrom = latest.from || '';
                const sender = rawFrom.split('<')[0].trim().replace(/"/g, '') || rawFrom || 'Unknown';
                const subject = latest.subject || '(no subject)';
                addEvent(app.name, '📨', `You received a message from ${sender} — "${subject}" | ${parsed.count} unread total`, 'alert');
              } else {
                addEvent(app.name, '📧', `${parsed.count} unread email${parsed.count !== 1 ? 's' : ''} in inbox`, 'alert');
              }
            }
          } else {
            addEvent(app.name, poller.icon, poller.label(parsed), poller.level(parsed));
          }
        } else {
          addEvent(app.name, '⚠', `Fetch error ${result.status}`, 'err');
        }
      } catch {
        addEvent(app.name, '✖', 'Unreachable', 'err');
      }
    }
    setPolling(false);
  };

  // Poll on mount + every 30s
  useEffect(() => {
    if (!apps.length) return;
    pollAll();
    const t = setInterval(pollAll, 30000);
    return () => clearInterval(t);
  }, [apps]);

  // Auto-scroll feed to top when new event arrives
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [events]);

  return (
    <div className="hud-panel hud-col-7">
      <CornerAccents />
      <PanelHeader
        label="LIVE APP FEED"
        dotActive={apps.length > 0}
        subLabel={polling ? 'POLLING...' : `AUTO-REFRESH 30s`}
      />
      <div className="hud-body" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Refresh bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 12px', borderBottom: '1px solid rgba(0,255,65,0.12)',
          fontSize: 10, color: '#4a9e4a',
        }}>
          <span>// REAL-TIME EVENTS — {apps.length} APP{apps.length !== 1 ? 'S' : ''}</span>
          <button
            onClick={pollAll}
            disabled={polling || !apps.length}
            style={{
              background: 'transparent', border: '1px solid #00ff4144',
              color: polling ? '#4a9e4a' : '#00ff41', fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9, padding: '2px 8px', cursor: 'pointer', letterSpacing: '0.07em',
            }}
          >
            {polling ? '⟳ POLLING' : '⟳ REFRESH'}
          </button>
        </div>

        {/* Feed list */}
        <div
          ref={feedRef}
          className="cyber-scroll-container"
          style={{
            flex: 1, overflowY: 'auto', padding: '8px 0',
            scrollbarWidth: 'thin', scrollbarColor: '#00ff4133 transparent',
          }}
        >
          {apps.length === 0 && (
            <div style={{ textAlign: 'center', color: '#2d6b2d', fontSize: 11, padding: '30px 14px', letterSpacing: '0.07em' }}>
              &gt; No apps connected.<br />Connect an integration to see live data.
            </div>
          )}
          {apps.length > 0 && events.length === 0 && (
            <div style={{ textAlign: 'center', color: '#2d6b2d', fontSize: 11, padding: '24px 14px', letterSpacing: '0.06em' }}>
              {polling ? '> Fetching live data...' : '> Awaiting first poll...'}
            </div>
          )}
          {events.slice(0, 6).map(ev => (
            <div key={ev.id} className="log-row" style={{ flexDirection: 'column', gap: 2, padding: '7px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="log-ts">[{ev.ts}]</span>
                <span style={{
                  fontSize: 9, letterSpacing: '0.1em', padding: '1px 6px',
                  border: `1px solid ${ev.level === 'err' ? '#ff313155' : ev.level === 'alert' ? '#eab30855' : '#00ff4133'}`,
                  color: ev.level === 'err' ? '#ff3131' : ev.level === 'alert' ? '#eab308' : '#4a9e4a',
                  background: ev.level === 'err' ? '#0a0202' : ev.level === 'alert' ? '#0a0800' : '#020502',
                }}>
                  {ev.icon} {ev.appName.toUpperCase()}
                </span>
              </div>
              <div style={{ paddingLeft: 4, fontSize: 11, color: ev.level === 'err' ? '#ff3131' : ev.level === 'alert' ? '#eab308' : '#00ff41', wordBreak: 'break-word' }}>
                &gt; {ev.message}
              </div>
            </div>
          ))}
        </div>

        {/* View All button */}
        {events.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(0,255,65,0.12)', padding: '8px 12px', flexShrink: 0 }}>
            <button
              onClick={() => setShowAllModal(true)}
              style={{
                width: '100%', background: 'transparent',
                border: '1px solid #00ff4144', color: '#00ff41',
                fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
                padding: '6px 0', cursor: 'pointer', letterSpacing: '0.1em',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,65,0.08)'; e.currentTarget.style.borderColor = '#00ff41'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#00ff4144'; }}
            >
              [ VIEW ALL FEED ({events.length}) ]
            </button>
          </div>
        )}
      </div>

      {/* Full Feed Modal */}
      {showAllModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowAllModal(false); }}
        >
          <div style={{
            width: '680px', maxWidth: '95vw', maxHeight: '80vh',
            background: '#050a05', border: '1px solid #00ff41',
            boxShadow: '0 0 30px rgba(0,255,65,0.3)',
            display: 'flex', flexDirection: 'column',
            fontFamily: "'Share Tech Mono', monospace",
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', borderBottom: '1px solid #00ff4133',
              background: '#020702', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#00ff41', letterSpacing: '0.12em' }}>
                LIVE APP FEED // ALL EVENTS
                <span style={{ fontSize: 9, color: '#4a9e4a', border: '1px solid #00ff4133', padding: '1px 6px' }}>
                  {events.length} ENTRIES
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setEvents([]); setShowAllModal(false); }}
                  style={{
                    background: 'transparent', border: '1px solid #ff313144',
                    color: '#ff3131', fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 9, padding: '2px 8px', cursor: 'pointer',
                  }}
                >[ CLR ]</button>
                <button
                  onClick={() => setShowAllModal(false)}
                  style={{ background: 'transparent', border: 'none', color: '#4a9e4a', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff3131'}
                  onMouseLeave={e => e.currentTarget.style.color = '#4a9e4a'}
                >x</button>
              </div>
            </div>

            {/* Legend */}
            <div style={{
              padding: '5px 16px', borderBottom: '1px solid #00ff4115',
              fontSize: 9, color: '#2d6b2d', display: 'flex', gap: 16, flexShrink: 0,
            }}>
              <span>GREEN = INFO</span>
              <span>YELLOW = ALERT (new orders / unread mail)</span>
              <span>RED = ERROR</span>
            </div>

            {/* All events scrollable */}
            <div
              className="cyber-scroll-container"
              style={{ flex: 1, overflowY: 'auto', padding: '8px 0', scrollbarWidth: 'thin', scrollbarColor: '#00ff4133 transparent' }}
            >
              {events.map((ev, idx) => (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 3,
                    padding: '8px 16px', borderBottom: '1px solid rgba(0,255,65,0.07)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(0,255,65,0.015)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 9, color: '#1d4d1d' }}>#{String(idx + 1).padStart(2, '0')}</span>
                    <span style={{ color: '#4a9e4a', fontSize: 10 }}>[{ev.ts}]</span>
                    <span style={{
                      fontSize: 9, letterSpacing: '0.1em', padding: '1px 8px',
                      border: `1px solid ${ev.level === 'err' ? '#ff313155' : ev.level === 'alert' ? '#eab30855' : '#00ff4133'}`,
                      color: ev.level === 'err' ? '#ff3131' : ev.level === 'alert' ? '#eab308' : '#4a9e4a',
                      background: ev.level === 'err' ? '#0a0202' : ev.level === 'alert' ? '#0a0800' : '#020502',
                    }}>{ev.icon} {ev.appName.toUpperCase()}</span>
                  </div>
                  <div style={{
                    paddingLeft: 38, fontSize: 11, lineHeight: 1.6, wordBreak: 'break-word',
                    color: ev.level === 'err' ? '#ff3131' : ev.level === 'alert' ? '#eab308' : '#00ff41',
                  }}>&gt; {ev.message}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{
              padding: '8px 16px', borderTop: '1px solid #00ff4115',
              fontSize: 9, color: '#2d6b2d',
              display: 'flex', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <span>VBOS // LIVE APP FEED MONITOR</span>
              <span>AUTO-REFRESH: 30s INTERVAL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Connected Apps Panel ─── */
function ConnectedAppsPanel({ apps, setApps }) {
  const [testing, setTesting] = useState({});
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString());
    };
    updateTime();
    const t = setInterval(updateTime, 1000);
    return () => clearInterval(t);
  }, []);

  const handleTest = async (app) => {
    setTesting(s => ({ ...s, [app.id]: true }));
    try {
      const ok = await testConnection(app);
      const newStatus = ok ? 'connected' : 'error';

      if (app.id && app.id !== 'gmail-oauth' && app.id !== 'sheets-oauth') {
        await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + ''}/api/apps/${app.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }).catch(err => console.error('Failed to update app status in DB:', err));
      }

      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: newStatus } : a));
    } catch {
      const newStatus = 'error';
      if (app.id && app.id !== 'gmail-oauth' && app.id !== 'sheets-oauth') {
        await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'https://jarvis1-92wq.onrender.com') + ''}/api/apps/${app.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }).catch(err => console.error('Failed to update app status in DB:', err));
      }
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: newStatus } : a));
    } finally {
      setTesting(s => ({ ...s, [app.id]: false }));
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Remove this connected app?')) {
      setApps(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <div className="hud-panel hud-col-7">
      <CornerAccents />
      <PanelHeader label="CONNECTED APPS" dotActive={apps.length > 0} subLabel="NODE MANAGER" />
      <div className="hud-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Surveillance Feed Mock Camera */}
        <div className="hud-cam-container" style={{ marginBottom: 0 }}>
          <div className="hud-cam-overlay-grid" />
          <div className="hud-cam-scanline" />
          <img src="/hands.jfif.jfif" className="hud-cam-img" alt="Systems Network Feed" />
          <div className="hud-cam-rec">
            <span className="hud-rec-dot" />
            <span>REC [GATEWAY_CAM_01]</span>
          </div>
          <div className="hud-cam-info">ISO: 400 | Shutter: 1/80 | {currentTime}</div>
        </div>

        {/* Connected Apps List */}
        <div
          className="cyber-scroll-container"
          style={{
            maxHeight: '180px',
            overflowY: 'auto',
            paddingRight: '4px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0, 255, 65, 0.2) transparent'
          }}
        >
          {apps.length === 0 ? (
            <div className="db-no-apps" style={{ textAlign: 'center', color: '#2d6b2d', fontSize: 11, padding: '16px 0' }}>
              No integrations connected.<br />
              <Link to="/settings" style={{ color: '#00ff41', textDecoration: 'underline' }}>&gt; Connect an app</Link>
            </div>
          ) : (
            apps.map(app => (
              <div
                key={app.id}
                className={`cyber-app-card ${app.status === 'connected' ? 'status-connected' : app.status === 'error' ? 'status-error' : ''}`}
              >
                {/* Left: status dot & app info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: app.status === 'connected' ? '#00ff41' : app.status === 'error' ? '#ff3131' : '#888',
                      boxShadow: app.status === 'connected' ? '0 0 6px #00ff41' : app.status === 'error' ? '0 0 6px #ff3131' : 'none',
                      flexShrink: 0
                    }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: app.status === 'error' ? '#ff3131' : '#00ff41', flexShrink: 0, letterSpacing: '0.04em' }}>
                    {app.name.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '9px', color: '#4a9e4a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', opacity: 0.8 }}>
                    ({app.baseUrl.replace(/^https?:\/\//, '')})
                  </span>
                </div>

                {/* Right: small actions */}
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                  <button
                    className="cyber-btn"
                    disabled={testing[app.id]}
                    onClick={() => handleTest(app)}
                    style={{ padding: '3px 8px', fontSize: '9px', minWidth: '42px', textAlign: 'center' }}
                  >
                    {testing[app.id] ? '...' : 'TEST'}
                  </button>
                  <Link to="/settings">
                    <button className="cyber-btn" style={{ padding: '3px 8px', fontSize: '9px' }}>EDIT</button>
                  </Link>
                  <button
                    className="cyber-btn cyber-btn-red"
                    onClick={() => handleDelete(app.id)}
                    style={{ padding: '3px 8px', fontSize: '9px' }}
                  >
                    DEL
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Recent Actions Panel ─── */
function RecentActionsPanel({ history }) {
  const navigate = useNavigate();
  const last6 = history.slice(0, 6);

  const fmtTime = (ts) => {
    const d = new Date(ts);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="hud-panel hud-col-10">
      <CornerAccents />
      <PanelHeader label="RECENT ACTIONS" dotActive={history.length > 0} subLabel="TELEMETRY LOGGER" />
      <div className="hud-body">
        {last6.length === 0 ? (
          <div className="db-empty">&gt; No actions logged yet.</div>
        ) : (
          <div className="log-stream cyber-scroll-container">
            {last6.map((log, i) => {
              const ok = log.result?.status >= 200 && log.result?.status < 300;
              const method = log.aiAction?.method || 'MSG';
              const endpoint = log.aiAction?.endpoint || '/';
              const status = log.result?.status ? `${log.result.status} ${ok ? 'OK' : 'ERR'}` : 'N/A';

              let methodClass = 'method-get';
              if (method === 'POST') methodClass = 'method-post';
              if (method === 'DELETE') methodClass = 'method-delete';
              if (method === 'PUT') methodClass = 'method-put';

              return (
                <div
                  key={log.id}
                  className="log-row"
                  onClick={() => navigate('/chat', { state: { openHistory: true, autoFillCommand: log.userMessage } })}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="log-ts">[{fmtTime(log.timestamp)}]</span>
                  <div className="log-body">
                    <span className={`log-method ${methodClass}`}>{method}</span>{' '}
                    <span>{endpoint}</span>{' '}
                    <span style={{ color: 'rgba(0, 255, 65, 0.4)' }}>→</span>{' '}
                    <span className={ok ? 'log-ok' : 'log-err'}>{status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Quick Commands Panel ─── */
function QuickCommandsPanel({ history }) {
  const navigate = useNavigate();
  const cmds = Array.from(new Set(history.map(h => h.userMessage))).slice(0, 3);

  const run = (cmd) => navigate('/chat', { state: { autoRunCommand: cmd } });

  return (
    <div className="hud-panel hud-col-5">
      <CornerAccents />
      <PanelHeader label="QUICK COMMANDS" dotActive={true} subLabel="DIRECT MATRIX EXECUTION" />
      <div className="hud-body" style={{ position: 'relative' }}>
        {/* Faint hex grid background */}
        <div className="hex-grid-bg" />

        {cmds.length === 0 ? (
          <div className="db-empty" style={{ position: 'relative', zIndex: 1 }}>&gt; No recent commands. Use the chat terminal to get started.</div>
        ) : (
          <div className="console-grid" style={{ position: 'relative', zIndex: 1 }}>
            {cmds.map((cmd, i) => (
              <button key={i} className="console-btn" onClick={() => run(cmd)}>
                &gt; {cmd}
              </button>
            ))}
          </div>
        )}

        <div style={{
          marginTop: 14,
          borderTop: '1px solid rgba(0, 255, 65, 0.15)',
          paddingTop: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          position: 'relative',
          zIndex: 1
        }}>
          <Link to="/chat" style={{ width: '100%' }}>
            <button className="nav-btn">
              &gt; open chat terminal_
            </button>
          </Link>
          <Link to="/settings" style={{ width: '100%' }}>
            <button className="nav-btn">
              &gt; manage integrations_
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard root ─── */
export function Dashboard({ apps, setApps, history }) {
  useGlobalStyle(DASHBOARD_STYLE);

  return (
    <div className="db-root">
      <div className="db-inner">

        {/* HUD Matrix Layout Grid */}
        <div className="hud-grid">
          {/* Radar Scanning Panel */}
          <div className="hud-panel hud-col-6">
            <CornerAccents />
            <PanelHeader label="APP CONNECTION TRACKER" dotActive={apps.length > 0} subLabel="RADAR TRACING SYSTEM" />
            <div className="hud-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '260px' }}>
              <RadarScanner apps={apps} />
            </div>
          </div>

          <ConnectedAppsPanel apps={apps} setApps={setApps} />
          <LiveFeedPanel apps={apps} />

          {/* Skull Box (Neural Link Panel) — hidden for now, component kept below */}
          {/* <NeuralLinkPanel className="hud-col-5" /> */}

          <RecentActionsPanel history={history} />
          <QuickCommandsPanel history={history} />
        </div>

      </div>
    </div>
  );
}
