import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientDetails from './pages/ClientDetails';
import Modal from './components/Modal';
import Sidebar from './components/Sidebar';

export default function App() {
  const [accountant, setAccountant] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clients, setClients] = useState([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Add Client Modal State in App.jsx
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('E-commerce');
  const [newClientNotes, setNewClientNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Fetch clients when authenticated
  useEffect(() => {
    if (accountant) {
      fetchClients();
    }
  }, [accountant]);

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

  async function fetchClients() {
    setIsLoadingClients(true);
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Fetch clients error:', err);
    } finally {
      setIsLoadingClients(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAccountant(null);
      setSelectedClientId(null);
      setClients([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  async function handleAddClient(e) {
    e.preventDefault();
    if (!newClientName || !newClientIndustry) {
      setAddError('Client name and industry are required.');
      return;
    }

    setIsSubmitting(true);
    setAddError('');

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClientName,
          industry: newClientIndustry,
          notes: newClientNotes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create client');

      // Append new client and reset state
      setClients(prev => [data, ...prev]);
      setIsAddOpen(false);
      setNewClientName('');
      setNewClientIndustry('E-commerce');
      setNewClientNotes('');
      
      // Auto navigate to new client details to prompt immediate CSV upload!
      setSelectedClientId(data.id);
    } catch (err) {
      setAddError(err.message || 'Server error creating client.');
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="app-container">
      <Sidebar 
        clients={clients}
        selectedClientId={selectedClientId}
        onSelectClient={setSelectedClientId}
        onOpenAddClient={() => setIsAddOpen(true)}
        accountant={accountant}
        onLogout={handleLogout}
      />

      {/* Main Page Area (#EFEFEF background) */}
      <main className="main-content">
        {selectedClientId === null ? (
          <Dashboard 
            onSelectClient={setSelectedClientId} 
            accountant={accountant}
            clients={clients}
            isLoadingClients={isLoadingClients}
            fetchClients={fetchClients}
            onOpenAddClient={() => setIsAddOpen(true)}
          />
        ) : (
          <ClientDetails 
            clientId={selectedClientId} 
            onBackToDashboard={() => setSelectedClientId(null)} 
            onRefreshClients={fetchClients}
          />
        )}
      </main>

      {/* Onboard New Client Modal managed globally in App.jsx */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Onboard New Client">
        {addError && (
          <div className="badge-critical" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '16px',
            textTransform: 'none',
            letterSpacing: 'normal'
          }}>
            <span>{addError}</span>
          </div>
        )}
        
        <form onSubmit={handleAddClient}>
          <div className="form-group">
            <label className="form-label" htmlFor="client-name-input">Client Company Name</label>
            <input
              id="client-name-input"
              type="text"
              className="form-input"
              placeholder="e.g. Acme Commerce"
              value={newClientName}
              onChange={e => setNewClientName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="industry-select">Industry Sector</label>
            <select
              id="industry-select"
              className="form-input form-select"
              value={newClientIndustry}
              onChange={e => setNewClientIndustry(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="E-commerce">E-commerce</option>
              <option value="SaaS">SaaS</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Services">Services</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="notes-textarea">Client Compliance Profile / Notes</label>
            <textarea
              id="notes-textarea"
              className="form-input form-textarea"
              placeholder="Add key insights (e.g., physical offices in CA, warehouse in TX, drop-shipping models...)"
              value={newClientNotes}
              onChange={e => setNewClientNotes(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Onboarding...' : 'Onboard Client'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
