import React, { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';

export default function Dashboard({ onSelectClient, accountant, clients, isLoadingClients, fetchClients, onOpenAddClient }) {
  const [portfolioBrief, setPortfolioBrief] = useState('');
  const [isLoadingBrief, setIsLoadingBrief] = useState(true);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Fetch portfolio compliance brief on mount
  useEffect(() => {
    fetchClients();
    fetchBrief();
  }, []);

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

  // Sort filtered clients: CRITICAL at the TOP
  const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sortedClientsList = [...filteredClients].sort((a, b) => {
    const aRisk = a.risk || a.overallRisk || 'LOW';
    const bRisk = b.risk || b.overallRisk || 'LOW';
    return (riskOrder[aRisk] ?? 99) - (riskOrder[bRisk] ?? 99);
  });

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: '6px' }}>
            Firm Portfolio Dashboard
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '15px', margin: 0 }}>
            Welcome back. Review sales tax nexus exposure for all accounts at <span style={{ color: '#FF6B35', fontWeight: 600 }}>{accountant?.firm_name || accountant?.firm}</span>.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenAddClient}>
          + Onboard New Client
        </button>
      </div>

      {/* Aggregate Metric Cards Grid (Zamp White Style) */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Active Clients</div>
          <div className="metric-value">{isLoadingClients ? '...' : totalClients}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Active Nexus States</div>
          <div className="metric-value" style={{ color: activeNexusStates > 0 ? '#ff3b30' : '#000000' }}>
            {isLoadingClients ? '...' : activeNexusStates}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Portfolio Revenue at Risk</div>
          <div className="metric-value">
            ${isLoadingClients ? '...' : totalRevenueAtRisk.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Est. Tax Liability (7% avg)</div>
          <div className="metric-value">
            ${isLoadingClients ? '...' : estimatedTaxLiability.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* AI Brief Panel (Pure Black Zamp Style) */}
      <div className="ai-brief-panel">
        <div className="brief-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="ai-brief-label" style={{ margin: 0 }}>
            Firm Portfolio Analyst Memo
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)', fontWeight: 600, letterSpacing: '0.05em' }}>
            POWERED BY GEMINI
          </div>
        </div>
        
        {isLoadingBrief ? (
          <div className="spinner-container" style={{ padding: '10px 0', color: 'rgba(255, 255, 255, 0.6)' }}>
            <div className="spinner" style={{ borderTopColor: '#ffffff' }}></div>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Analyzing portfolio transactions and generating briefing memo...</p>
          </div>
        ) : (
          <p className="ai-brief-text">
            {portfolioBrief}
          </p>
        )}
      </div>

      {/* Interactive Table Title and Action Filters */}
      <div style={{ marginBottom: '20px', marginTop: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', letterSpacing: '-0.02em' }}>Client Accounts Overview</h2>
        
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
            <Filter size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
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

      {/* Clients Listing Table (Light Clean Style) */}
      {isLoadingClients ? (
        <div className="table-container spinner-container" style={{ minHeight: '200px' }}>
          <div className="spinner"></div>
          <p>Retrieving client portfolio data...</p>
        </div>
      ) : sortedClientsList.length === 0 ? (
        <div className="table-container" style={{ padding: '48px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 600 }}>No client accounts found matching the criteria.</p>
          <p style={{ fontSize: '14px', margin: 0 }}>Click "+ Onboard New Client" to expand your firm portfolio.</p>
        </div>
      ) : (
        <div className="table-container">
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
              {sortedClientsList.map(client => {
                let riskClass = 'badge-low';
                if (client.overallRisk === 'CRITICAL') riskClass = 'badge-critical';
                else if (client.overallRisk === 'HIGH') riskClass = 'badge-high';
                else if (client.overallRisk === 'MEDIUM') riskClass = 'badge-medium';

                return (
                  <tr key={client.id} onClick={() => onSelectClient(client.id)}>
                    <td style={{ fontWeight: 600, color: '#ffffff' }}>{client.name}</td>
                    <td style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{client.industry}</td>
                    <td>
                      <span className={`badge ${riskClass}`}>{client.overallRisk}</span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: client.nexusCount > 0 ? '#ff3b30' : '#ffffff' }}>
                      {client.nexusCount}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 500, color: client.approachingCount > 0 ? '#b79500' : 'rgba(255, 255, 255, 0.4)' }}>
                      {client.approachingCount}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#ffffff' }}>
                      {client.nexusRevenue > 0 ? `$${client.nexusRevenue.toLocaleString()}` : '$0'}
                    </td>
                    <td style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>
                      {client.latestSnapshot ? client.latestSnapshot.period_label : (
                        <span style={{ color: '#FF6B35', fontWeight: 500 }}>
                          No snapshot uploaded
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
    </div>
  );
}
