import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, Sparkles, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Something went wrong during login.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleFillDemo() {
    setEmail('demo@smithtax.com');
    setPassword('zamp2026');
    setError('');
  }

  return (
    <div className="login-page-container">
      {/* Scope login CSS styles specifically inside this page to avoid leaks */}
      <style>{`
        .login-page-container {
          display: flex;
          min-height: 100vh;
          width: 100vw;
          background-color: #EFEFEF;
          font-family: 'Geist', 'Inter', -apple-system, sans-serif;
          color: #111111;
          overflow: hidden;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 99999;
        }

        .login-column-form {
          flex: 1.1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 60px;
          background-color: #EFEFEF;
          box-shadow: 10px 0 30px rgba(0, 0, 0, 0.02);
          z-index: 10;
        }

        .login-column-brand {
          flex: 1.4;
          background: linear-gradient(135deg, #0A0F1E 0%, #151C33 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 80px;
          color: #FFFFFF;
          position: relative;
          overflow: hidden;
        }

        .login-column-brand::before {
          content: '';
          position: absolute;
          width: 200%;
          height: 200%;
          top: -50%;
          left: -50%;
          background-image: 
            radial-gradient(circle at 80% 20%, rgba(0, 245, 212, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 20% 80%, rgba(67, 97, 238, 0.08) 0%, transparent 50%),
            linear-gradient(rgba(255, 255, 255, 0.005) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.005) 1px, transparent 1px);
          background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
          pointer-events: none;
        }

        .login-form-wrapper {
          width: 100%;
          maxWidth: 400px;
          margin: 0 auto;
        }

        .login-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #000000;
          margin-bottom: 40px;
        }

        .login-header-title {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: #000000;
          margin-bottom: 8px;
          line-height: 1.15;
        }

        .login-header-subtitle {
          color: #666666;
          font-size: 15px;
          margin-bottom: 32px;
          font-weight: 400;
        }

        .login-input-group {
          margin-bottom: 20px;
        }

        .login-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #333333;
          margin-bottom: 8px;
        }

        .login-input-wrapper {
          position: relative;
        }

        .login-input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #999999;
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .login-input {
          width: 100%;
          padding: 14px 16px 14px 46px;
          background-color: #FFFFFF;
          border: 1px solid #DDDDDD;
          border-radius: 12px;
          color: #000000;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        .login-input:focus {
          border-color: #000000;
          box-shadow: 0 0 0 1px #000000;
        }

        .login-input:focus + .login-input-icon {
          color: #000000;
        }

        /* Black Pill Button */
        .btn-pill-black {
          width: 100%;
          padding: 14px 28px;
          background-color: #000000;
          color: #FFFFFF;
          border: none;
          border-radius: 9999px;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
        }

        .btn-pill-black:hover {
          background-color: #222222;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .btn-pill-black:active {
          transform: translateY(0);
        }

        .btn-pill-black:disabled {
          background-color: #888888;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Outline Pill Button */
        .btn-pill-outline {
          width: 100%;
          padding: 12px 24px;
          background-color: transparent;
          color: #111111;
          border: 1px solid #CCCCCC;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .btn-pill-outline:hover:not(:disabled) {
          border-color: #000000;
          background-color: rgba(0, 0, 0, 0.03);
        }

        .login-divider {
          height: 1px;
          background-color: #E0E0E0;
          margin: 32px 0 24px 0;
          position: relative;
        }

        .login-divider-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: #EFEFEF;
          padding: 0 12px;
          font-size: 11px;
          color: #888888;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .login-alert {
          background-color: #FFF0F0;
          border: 1px solid #FFE0E0;
          color: #D32F2F;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 24px;
          line-height: 1.4;
        }

        /* Brand Column Details */
        .brand-content {
          max-width: 520px;
          z-index: 5;
        }

        .brand-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #00F5D4;
          margin-bottom: 20px;
        }

        .brand-headline {
          font-size: 40px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.15;
          margin-bottom: 20px;
        }

        .brand-desc {
          color: #A0AEC0;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 40px;
        }

        /* High-Fidelity Interactive Preview Widget */
        .nexus-preview-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          width: 100%;
        }

        .preview-title-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 12px;
        }

        .preview-title {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .preview-status {
          font-size: 11px;
          font-weight: 700;
          color: #00F5D4;
          text-transform: uppercase;
          background: rgba(0, 245, 212, 0.1);
          padding: 4px 10px;
          border-radius: 20px;
        }

        .preview-state-row {
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 12px;
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          align-items: center;
        }

        .preview-state-row:last-child {
          margin-bottom: 0;
        }

        .preview-state-name {
          font-weight: 700;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .preview-metric-value {
          font-family: monospace;
          font-size: 13px;
          font-weight: 600;
        }

        .preview-metric-label {
          display: block;
          font-size: 9px;
          color: #718096;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .status-triggered {
          color: #FF5A5F;
        }

        .status-near {
          color: #F18F01;
        }

        .status-safe {
          color: #00F5D4;
        }

        @media (max-width: 900px) {
          .login-page-container {
            flex-direction: column;
            position: relative;
            height: auto;
            min-height: 100vh;
            overflow-y: auto;
          }

          .login-column-form {
            padding: 50px 30px;
            min-height: 100vh;
          }

          .login-column-brand {
            display: none; /* Hide brand panel on smaller screens for ultra clean mobile form entry */
          }
        }
      `}</style>

      {/* Left Column: Login Form */}
      <div className="login-column-form">
        <div className="login-form-wrapper">
          <div className="login-logo">
            <span style={{ fontSize: '24px' }}>⚡</span> ZAMP NEXUS OS
          </div>

          <h2 className="login-header-title">Access Dashboard</h2>
          <p className="login-header-subtitle">Enter your details to log in to the Smith &amp; Associates Firm Portal.</p>

          {error && (
            <div className="login-alert">
              <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-input-group">
              <label className="login-label" htmlFor="email-input">Email Address</label>
              <div className="login-input-wrapper">
                <input
                  id="email-input"
                  type="email"
                  className="login-input"
                  placeholder="accountant@smithtax.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Mail size={16} className="login-input-icon" />
              </div>
            </div>

            <div className="login-input-group" style={{ marginBottom: '28px' }}>
              <label className="login-label" htmlFor="password-input">Password</label>
              <div className="login-input-wrapper">
                <input
                  id="password-input"
                  type="password"
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Lock size={16} className="login-input-icon" />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-pill-black" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Access Dashboard'}
              {!isLoading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="login-divider">
            <span className="login-divider-text">Demo Access</span>
          </div>

          <p style={{
            fontSize: '12.5px',
            color: '#666666',
            textAlign: 'center',
            marginBottom: '16px',
            lineHeight: 1.4
          }}>
            Log in with our pre-loaded portfolio advisor account to test the Sales Tax Nexus exposure features.
          </p>

          <button 
            type="button" 
            className="btn-pill-outline" 
            onClick={handleFillDemo}
            disabled={isLoading}
          >
            <Sparkles size={14} style={{ color: '#F18F01' }} />
            Auto-Fill Demo Credentials
          </button>
        </div>
      </div>

      {/* Right Column: Premium Brand Showcase */}
      <div className="login-column-brand">
        <div className="brand-content">
          <div className="brand-tag">
            <Sparkles size={14} />
            Nexus Engine Active
          </div>

          <h1 className="brand-headline">
            Automate Portfolio<br />
            Sales Tax Exposure.
          </h1>

          <p className="brand-desc">
            Continuous, automated revenue and transaction tracking across all 50 states. Keep your SaaS and E-commerce clients compliant with zero friction.
          </p>

          {/* Interactive UI Widget Mockup */}
          <div className="nexus-preview-card">
            <div className="preview-title-bar">
              <span className="preview-title">
                <ShieldCheck size={18} style={{ color: '#00F5D4' }} />
                Smith &amp; Associates • Client Portfolio
              </span>
              <span className="preview-status">Live Exposure</span>
            </div>

            {/* State Row 1: California - Triggered */}
            <div className="preview-state-row">
              <div className="preview-state-name status-triggered">
                <AlertTriangle size={14} />
                California
              </div>
              <div>
                <span className="preview-metric-value">$142,000</span>
                <span className="preview-metric-label">Revenue (142%)</span>
              </div>
              <div>
                <span className="preview-metric-value">310 Txns</span>
                <span className="preview-metric-label">Limit Exceeded</span>
              </div>
            </div>

            {/* State Row 2: Texas - Near */}
            <div className="preview-state-row">
              <div className="preview-state-name status-near">
                <AlertTriangle size={14} />
                New York
              </div>
              <div>
                <span className="preview-metric-value">$67,000</span>
                <span className="preview-metric-label">Revenue (67%)</span>
              </div>
              <div>
                <span className="preview-metric-value">140 Txns</span>
                <span className="preview-metric-label">Threshold Warning</span>
              </div>
            </div>

            {/* State Row 3: Oregon - Safe */}
            <div className="preview-state-row">
              <div className="preview-state-name status-safe">
                <CheckCircle2 size={14} />
                Oregon
              </div>
              <div>
                <span className="preview-metric-value">$61,000</span>
                <span className="preview-metric-label">Revenue (61%)</span>
              </div>
              <div>
                <span className="preview-metric-value">130 Txns</span>
                <span className="preview-metric-label">Under Limits</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
