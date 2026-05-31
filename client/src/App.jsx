import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientDetails from './pages/ClientDetails';
import { LogOut, LayoutGrid } from 'lucide-react';

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
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', background: '#EFEFEF' }}>
        <div className="spinner-container">
          <div className="spinner"></div>
          <p style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.6)' }}>Checking secure firm session...</p>
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
      {/* 260px Pure Black Sidebar */}
      <aside className="sidebar">
        <div>
          {/* Logo with Z Parallelogram SVG Mark */}
          <div className="sidebar-logo" onClick={() => setSelectedClientId(null)} style={{ cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '10px' }}>
              <polygon points="25,80 45,20 75,20 55,80" fill="#005EFF" />
            </svg>
            <span>ZAMP NEXUS OS</span>
          </div>

          <nav className="sidebar-nav">
            <div 
              className={`sidebar-link ${selectedClientId === null ? 'active' : ''}`}
              onClick={() => setSelectedClientId(null)}
            >
              <LayoutGrid size={16} />
              <span>Dashboard</span>
            </div>
          </nav>
        </div>

        {/* User context footer */}
        <div className="sidebar-user">
          <div className="sidebar-user-email" title={accountant.email}>
            {accountant.email}
          </div>
          <button 
            className="btn-sidebar-signout"
            onClick={handleLogout}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Page Area (#EFEFEF light background) */}
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
