import React from 'react';

export default function Sidebar({ 
  clients = [], 
  selectedClientId, 
  onSelectClient, 
  onOpenAddClient, 
  accountant, 
  onLogout 
}) {
  // Define risk ordering to sort CRITICAL at the TOP
  const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  
  const sortedClientsList = [...clients].sort((a, b) => {
    const aRisk = a.risk || a.overallRisk || 'LOW';
    const bRisk = b.risk || b.overallRisk || 'LOW';
    return (riskOrder[aRisk] ?? 99) - (riskOrder[bRisk] ?? 99);
  });

  return (
    <aside className="sidebar">
      <div>
        {/* Logo with Z Parallelogram SVG Mark */}
        <div className="sidebar-logo" onClick={() => onSelectClient(null)} style={{ cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '10px' }}>
            <polygon points="25,80 45,20 75,20 55,80" fill="#005EFF" />
          </svg>
          <span style={{ fontSize: '18px', fontWeight: 800 }}>Zamp Nexus OS</span>
        </div>

        <div className="sidebar-nav">
          {/* Dashboard Nav Item (Simple Nav Link) */}
          <div 
            className={`sidebar-item ${selectedClientId === null ? 'active' : ''}`}
            onClick={() => onSelectClient(null)}
          >
            <span>Dashboard</span>
          </div>

          {/* List of all clients with Risk Dots */}
          {sortedClientsList.map(c => {
            const risk = c.risk || c.overallRisk || 'LOW';
            return (
              <div
                key={c.id}
                className={`sidebar-client-item ${selectedClientId === c.id ? 'active' : ''}`}
                onClick={() => onSelectClient(c.id)}
              >
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: risk === 'CRITICAL' ? '#ff3b30' : risk === 'HIGH' ? '#ff9500' : risk === 'MEDIUM' ? '#b79500' : '#34c759',
                  marginRight: '10px',
                  display: 'inline-block'
                }} />
                <span>{c.name}</span>
              </div>
            );
          })}

          {/* + Add client link */}
          <div className="sidebar-add-client" onClick={onOpenAddClient}>
            <span>+ Add client</span>
          </div>
        </div>
      </div>

      {/* User email & Custom Text Sign Out Link at bottom */}
      <div className="sidebar-user">
        <div className="sidebar-user-email" title={accountant?.email}>
          {accountant?.email}
        </div>
        <button 
          className="sign-out"
          onClick={onLogout}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
