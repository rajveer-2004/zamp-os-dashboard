import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientDetails from './pages/ClientDetails';
import { LogOut, User } from 'lucide-react';

export default function App() {
  const [accountant, setAccountant] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState(null);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    setIsCheckingSession(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setAccountant(data);
      } else {
        setAccountant(null);
      }
    } catch (err) {
      console.error('Session check error:', err);
      setAccountant(null);
    } finally {
      setIsCheckingSession(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAccountant(null);
      setSelectedClientId(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  if (isCheckingSession) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner-container">
          <div className="spinner"></div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Checking secure firm session...</p>
        </div>
      </div>
    );
  }

  // Render Login page if not authenticated
  if (!accountant) {
    return (
      <div className="app-container">
        <Login onLoginSuccess={(user) => setAccountant(user)} />
      </div>
    );
  }

  // Render Accountant Workspace if authenticated
  return (
    <div className="app-container">
      {/* Top Navigation Header */}
      <header className="header">
        <div className="header-brand" onClick={() => setSelectedClientId(null)} style={{ cursor: 'pointer' }}>
          ⚡ Zamp Nexus OS
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '14px', 
            color: 'var(--text-secondary)',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid var(--border-color)'
          }}>
            <User size={14} style={{ color: 'var(--accent-teal)' }} />
            <span>{accountant.email}</span>
          </div>

          <button 
            className="btn btn-secondary" 
            style={{ padding: '8px 14px', display: 'flex', gap: '6px', fontSize: '13px' }}
            onClick={handleLogout}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="main-content">
        {selectedClientId === null ? (
          <Dashboard 
            onSelectClient={setSelectedClientId} 
            accountant={accountant} 
          />
        ) : (
          <ClientDetails 
            clientId={selectedClientId} 
            onBackToDashboard={() => setSelectedClientId(null)} 
          />
        )}
      </main>
    </div>
  );
}
