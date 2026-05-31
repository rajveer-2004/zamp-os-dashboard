import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ShieldAlert, TrendingUp, Users, DollarSign, Award, MessageSquare } from 'lucide-react';
import Modal from '../components/Modal';

export default function Dashboard({ onSelectClient, accountant }) {
  const [clients, setClients] = useState([]);
  const [portfolioBrief, setPortfolioBrief] = useState('');
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingBrief, setIsLoadingBrief] = useState(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Add Client Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('E-commerce');
  const [newClientNotes, setNewClientNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchClients();
    fetchBrief();
  }, []);

  async function fetchClients() {
    setIsLoadingClients(true);
    try {
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Failed to fetch clients');
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingClients(false);
    }
  }

  async function fetchBrief() {
    setIsLoadingBrief(true);
    try {
      const res = await fetch('/api/portfolio-brief');
      if (!res.ok) throw new Error('Failed to fetch portfolio brief');
      const data = await res.json();
      setPortfolioBrief(data.brief);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingBrief(false);
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
      onSelectClient(data.id);
    } catch (err) {
      setAddError(err.message || 'Server error creating client.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculate high-level cumulative portfolio metrics
  const totalClients = clients.length;
  const activeNexusStates = clients.reduce((acc, c) => acc + (c.nexusCount || 0), 0);
  const totalRevenueAtRisk = clients.reduce((acc, c) => acc + (c.nexusRevenue || 0), 0);
  const estimatedTaxLiability = totalRevenueAtRisk * 0.07; // 7% average rate

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || client.overallRisk === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '6px' }}>
            Firm Portfolio Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Welcome back. Review sales tax nexus exposure for all accounts at <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>{accountant?.firm_name}</span>.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
          <Plus size={16} /> Onboard New Client
        </button>
      </div>

      {/* Aggregate Metric Cards Grid */}
      <div className="metrics-grid">
        <div className="metric-card glass-panel">
          <div className="metric-card-icon"><Users size={20} /></div>
          <div className="metric-value">{isLoadingClients ? '...' : totalClients}</div>
          <div className="metric-label">Active Clients</div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-card-icon" style={{ color: 'var(--color-critical)' }}><ShieldAlert size={20} /></div>
          <div className="metric-value" style={{ color: 'var(--color-critical)' }}>{isLoadingClients ? '...' : activeNexusStates}</div>
          <div className="metric-label">Active Nexus States</div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-card-icon" style={{ color: 'var(--color-high)' }}><DollarSign size={20} /></div>
          <div className="metric-value">${isLoadingClients ? '...' : totalRevenueAtRisk.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="metric-label">Portfolio Revenue at Risk</div>
        </div>

        <div className="metric-card glass-panel">
          <div className="metric-card-icon" style={{ color: 'var(--color-medium)' }}><TrendingUp size={20} /></div>
          <div className="metric-value" style={{ color: 'var(--color-medium)' }}>
            ${isLoadingClients ? '...' : estimatedTaxLiability.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="metric-label">Est. Tax Liability (7% avg)</div>
        </div>
      </div>

      {/* Analyst Memo Brief Section */}
      <div className="glass-panel brief-card" style={{ padding: '28px', marginBottom: '40px' }}>
        <div className="brief-header">
          <div className="brief-icon-tag">
            <MessageSquare size={18} /> Firm Portfolio Analyst Memo
          </div>
          <div className="badge badge-low" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
            ⚡ Powered by Zamp Compliance Intelligence
          </div>
        </div>
        
        {isLoadingBrief ? (
          <div className="spinner-container" style={{ padding: '10px 0' }}>
            <div className="spinner"></div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Analyzing portfolio transactions and generating briefing memo...</p>
          </div>
        ) : (
          <p className="brief-body">
            "{portfolioBrief}"
          </p>
        )}
      </div>

      {/* Interactive Table Title and Action Filters */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>Client Accounts Overview</h2>
        
        <div className="filter-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search clients by name or industry..."
              className="form-input search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
            <select
              className="form-input form-select filter-select"
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Listing Table */}
      {isLoadingClients ? (
        <div className="glass-panel spinner-container">
          <div className="spinner"></div>
          <p>Retrieving client portfolio data...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No client accounts found matching the criteria.</p>
          <p style={{ fontSize: '14px' }}>Click "+ Onboard New Client" to expand your firm portfolio.</p>
        </div>
      ) : (
        <div className="table-container glass-panel">
          <table className="client-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Industry</th>
                <th>Overall Risk</th>
                <th style={{ textAlign: 'center' }}>Nexus States</th>
                <th style={{ textAlign: 'center' }}>Approaching States</th>
                <th style={{ textAlign: 'right' }}>Revenue at Risk</th>
                <th>Active Snapshot</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => {
                let riskClass = 'badge-low';
                if (client.overallRisk === 'CRITICAL') riskClass = 'badge-critical';
                else if (client.overallRisk === 'HIGH') riskClass = 'badge-high';
                else if (client.overallRisk === 'MEDIUM') riskClass = 'badge-medium';

                return (
                  <tr key={client.id} onClick={() => onSelectClient(client.id)}>
                    <td style={{ fontWeight: 600, color: '#FFF' }}>{client.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{client.industry}</td>
                    <td>
                      <span className={`badge ${riskClass}`}>{client.overallRisk}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: client.nexusCount > 0 ? 'var(--color-critical)' : 'var(--text-primary)' }}>
                      {client.nexusCount}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 500, color: client.approachingCount > 0 ? 'var(--color-medium)' : 'var(--text-secondary)' }}>
                      {client.approachingCount}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: client.nexusRevenue > 0 ? '#FFF' : 'var(--text-secondary)' }}>
                      {client.nexusRevenue > 0 ? `$${client.nexusRevenue.toLocaleString()}` : '$0'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {client.latestSnapshot ? client.latestSnapshot.period_label : (
                        <span style={{ color: 'var(--accent-teal)', fontStyle: 'italic', fontWeight: 500 }}>
                          ⚠️ No snapshot uploaded
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Client Modal */}
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
