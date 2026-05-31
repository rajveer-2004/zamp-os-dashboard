import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, Sparkles } from 'lucide-react';

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
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      zIndex: 1
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '40px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative glowing background elements */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          right: '-15%',
          width: '200px',
          height: '200px',
          background: 'rgba(0, 245, 212, 0.08)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-15%',
          width: '200px',
          height: '200px',
          background: 'rgba(67, 97, 238, 0.08)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '28px',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #FFF 40%, var(--accent-teal))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            ⚡ ZAMP NEXUS OS
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
            Smith &amp; Associates Firm Portal
          </p>
        </div>

        {error && (
          <div className="badge-critical" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '20px',
            textTransform: 'none',
            letterSpacing: 'normal'
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                id="email-input"
                type="email"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="accountant@firm.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="password-input">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                id="password-input"
                type="password"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px 0', fontSize: '15px' }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Access Dashboard'}
          </button>
        </form>

        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <Sparkles size={13} style={{ color: 'var(--accent-teal)' }} />
            Looking for demo access?
          </p>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '8px 0', fontSize: '12px', fontWeight: 600 }}
            onClick={handleFillDemo}
            disabled={isLoading}
          >
            Auto-Fill Demo Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
