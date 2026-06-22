import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Upload, Edit, Trash2, Calendar, ShieldCheck, 
  AlertCircle, ChevronRight, Copy, Check, Info, FileText, LayoutGrid
} from 'lucide-react';
import Modal from '../components/Modal';

export default function ClientDetails({ clientId, onBackToDashboard }) {
  const [details, setDetails] = useState(null);
  const [activeSnapshotId, setActiveSnapshotId] = useState(null);
  const [clientBrief, setClientBrief] = useState('');
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isLoadingBrief, setIsLoadingBrief] = useState(true);
  
  // Clipboard copy confirmation state
  const [copied, setCopied] = useState(false);

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Upload Snapshot Form States
  const [periodLabel, setPeriodLabel] = useState('Q2 2026');
  const [rawCsv, setRawCsv] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Edit Client Form States
  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState('E-commerce');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');

  // Fetch client details (can fetch specific snapshot if activeSnapshotId is set)
  useEffect(() => {
    fetchClientDetails(activeSnapshotId);
  }, [clientId, activeSnapshotId]);

  // Fetch client AI brief when active snapshot changes
  useEffect(() => {
    if (details?.activeSnapshot) {
      fetchClientBrief(details.activeSnapshot.id);
    } else {
      setClientBrief("No transaction data uploaded yet. Paste or upload a CSV snapshot to run a compliance analysis.");
      setIsLoadingBrief(false);
    }
  }, [details?.activeSnapshot?.id]);

  async function fetchClientDetails(snapshotId = null) {
    setIsLoadingDetails(true);
    try {
      let url = `/api/clients/${clientId}`;
      if (snapshotId) {
        url += `?snapshotId=${snapshotId}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load client details');
      const data = await res.json();
      setDetails(data);
      
      // Initialize edit fields
      setEditName(data.client.name);
      setEditIndustry(data.client.industry);
      setEditNotes(data.client.notes || '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetails(false);
    }
  }

  async function fetchClientBrief(snapshotId) {
    setIsLoadingBrief(true);
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, snapshotId })
      });
      if (!res.ok) throw new Error('Failed to fetch AI brief');
      const data = await res.json();
      setClientBrief(data.brief);
    } catch (err) {
      console.error(err);
      setClientBrief("An error occurred generating the compliance advisory memo. Your raw state metrics are compiled below.");
    } finally {
      setIsLoadingBrief(false);
    }
  }

  async function handleEditProfile(e) {
    e.preventDefault();
    if (!editName || !editIndustry) {
      setEditError('Name and industry are required.');
      return;
    }

    setIsSavingProfile(true);
    setEditError('');

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          industry: editIndustry,
          notes: editNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update client profile');

      // Update local state
      setDetails(prev => ({
        ...prev,
        client: {
          ...prev.client,
          name: data.name,
          industry: data.industry,
          notes: data.notes
        }
      }));
      if (onRefreshClients) onRefreshClients();
      setIsEditOpen(false);
    } catch (err) {
      setEditError(err.message || 'Error updating profile.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleDeleteClient() {
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete client');
      if (onRefreshClients) onRefreshClients();
      onBackToDashboard();
    } catch (err) {
      console.error(err);
      alert('Could not delete client. Please try again.');
    }
  }

  async function handleUploadSnapshot(e) {
    e.preventDefault();
    if (!periodLabel || !rawCsv) {
      setUploadError('Period label and CSV contents are required.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const res = await fetch(`/api/clients/${clientId}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_label: periodLabel,
          raw_csv: rawCsv
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse CSV');

      // Clear fields and close modal
      setRawCsv('');
      setIsUploadOpen(false);

      // Reset snapshot filter to latest and reload details
      setActiveSnapshotId(data.id);
      fetchClientDetails(data.id);
    } catch (err) {
      setUploadError(err.message || 'Error processing transaction snapshot.');
    } finally {
      setIsUploading(false);
    }
  }

  // Replicate standard filling deadlines logic from lib/deadlines.js
  function calculateFilingDeadlines(results, baseDateStr) {
    if (!results || results.length === 0) return { nexus: [], approaching: [] };
    const baseDate = baseDateStr ? new Date(baseDateStr) : new Date();

    const nexus = [];
    const approaching = [];

    for (const r of results) {
      const rev = Number(r.revenue) || 0;
      const tx = Number(r.transactions) || 0;
      const isNexus = r.nexus_triggered === 1 || r.nexus_triggered === true;
      const maxPct = Math.max(r.rev_pct, r.txn_pct);

      if (isNexus) {
        // Frequency rules
        let freq = 'Quarterly';
        if (rev >= 150000) freq = 'Monthly';
        else if (rev < 25000) freq = 'Annually';

        // 30 days to register
        const regDate = new Date(baseDate);
        regDate.setDate(regDate.getDate() + 30);

        // Filing typical due date: 20th of the next month
        const fileDate = new Date(regDate);
        fileDate.setMonth(fileDate.getMonth() + 1);
        fileDate.setDate(20);

        nexus.push({
          state: r.state,
          revenue: rev,
          transactions: tx,
          frequency: freq,
          registerBy: regDate.toISOString().split('T')[0],
          firstFiling: fileDate.toISOString().split('T')[0]
        });
      } else if (maxPct >= 40) {
        // Gap calculations (Limits: Rev 100k, Tx 200)
        const revGap = Math.max(0, 100000 - rev);
        const txGap = Math.max(0, 200 - tx);

        approaching.push({
          state: r.state,
          revenue: rev,
          transactions: tx,
          maxPct,
          revGap,
          txGap
        });
      }
    }

    // Sort schedules
    nexus.sort((a, b) => new Date(a.registerBy) - new Date(b.registerBy));
    approaching.sort((a, b) => b.maxPct - a.maxPct);

    return { nexus, approaching };
  }

  // Copy sample template to clipboard helper
  const sampleCsvContent = `state,revenue,transactions
California,145000,320
Texas,95000,185
New York,82000,150
Washington,115000,210
Colorado,65000,90
Georgia,35000,45`;

  function handleCopySample() {
    navigator.clipboard.writeText(sampleCsvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoadingDetails && !details) {
    return (
      <div className="table-container spinner-container" style={{ minHeight: '300px' }}>
        <div className="spinner"></div>
        <p>Loading compliance profile details...</p>
      </div>
    );
  }

  const { client, activeSnapshot, nexusResults, snapshotHistory } = details || {};
  const { nexus: nexusSchedules, approaching: approachingSchedules } = calculateFilingDeadlines(
    nexusResults, 
    activeSnapshot?.uploaded_at
  );

  let overallRiskBadge = 'badge-low';
  if (client?.overallRisk === 'CRITICAL') overallRiskBadge = 'badge-critical';
  else if (client?.overallRisk === 'HIGH') overallRiskBadge = 'badge-high';
  else if (client?.overallRisk === 'MEDIUM') overallRiskBadge = 'badge-medium';

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={onBackToDashboard}>
          <ArrowLeft size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> 
          Back to Portfolio
        </span>
        <ChevronRight size={12} />
        <span>Client Profile</span>
      </div>

      {/* Main Header & Quick Actions */}
      <div className="client-header-area">
        <div className="client-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <h1 className="client-name-title" style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.03em' }}>{client?.name}</h1>
            <span className={`badge ${overallRiskBadge}`} style={{ fontSize: '12px', padding: '6px 14px' }}>
              {client?.overallRisk} Exposure
            </span>
          </div>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '15px', marginTop: '6px', margin: '6px 0 0 0' }}>
            Sector: <span style={{ color: '#ffffff', fontWeight: 600 }}>{client?.industry}</span> 
            {activeSnapshot && (
              <> | Evaluating Snapshot: <span style={{ color: '#FF6B35', fontWeight: 600 }}>{activeSnapshot.period_label}</span></>
            )}
          </p>
        </div>

        <div className="client-actions">
          <button className="btn btn-secondary" onClick={() => setIsEditOpen(true)}>
            <Edit size={16} /> Edit Profile
          </button>
          <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
            <Upload size={16} /> Upload New Snapshot
          </button>
          <button className="btn btn-danger" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 size={16} /> Delete Account
          </button>
        </div>
      </div>

      {/* Notes / Subheader Area */}
      {client?.notes && (
        <div className="compliance-notes-box">
          <div className="compliance-notes-title">
            <Info size={13} /> Compliance Advisor Notes
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: 1.5 }}>{client.notes}</p>
        </div>
      )}

      {/* Workspace Content Grid */}
      <div className="client-details-grid">
        
        {/* Left Column: Snapshot History Navigation */}
        <div className="sidebar-section">
          <div className="glass-panel" style={{ padding: '24px', boxSizing: 'border-box', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
              <Calendar size={15} /> Snapshot History
            </h3>

            {snapshotHistory && snapshotHistory.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                No upload history found.
              </p>
            ) : (
              <div className="snapshot-list">
                {snapshotHistory?.map(snap => {
                  const isActive = activeSnapshot?.id === snap.id;
                  
                  // Render Diff Badge Indicator
                  let diffIcon = null;
                  if (snap.diffIndicator?.type === 'increase') {
                    diffIcon = <span className="diff-indicator diff-increase">+ {snap.diffIndicator.count} Nexus</span>;
                  } else if (snap.diffIndicator?.type === 'decrease') {
                    diffIcon = <span className="diff-indicator diff-decrease">- {snap.diffIndicator.count} Nexus</span>;
                  }

                  return (
                    <div 
                      key={snap.id} 
                      className={`snapshot-item ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveSnapshotId(snap.id)}
                    >
                      <div className="snapshot-item-header">
                        <span style={{ color: isActive ? '#FF6B35' : '#ffffff' }}>{snap.period_label}</span>
                        {diffIcon}
                      </div>
                      <div className="snapshot-item-stats">
                        <span>Nexus: <strong>{snap.nexusCount}</strong></span>
                        <span>Approaching: <strong>{snap.approachingCount}</strong></span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '6px' }}>
                        Uploaded: {new Date(snap.uploaded_at).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Details, AI Memo, Deadlines, and Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* AI Advisor Memo Card (Black Zamp Style) */}
          <div className="ai-brief-panel">
            <div className="brief-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="ai-brief-label" style={{ margin: 0 }}>
                Compliance Advisory Memo
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)', fontWeight: 600, letterSpacing: '0.05em' }}>
                POWERED BY GEMINI
              </div>
            </div>
            
            {isLoadingBrief ? (
              <div className="spinner-container" style={{ padding: '8px 0', color: 'rgba(255, 255, 255, 0.6)' }}>
                <div className="spinner" style={{ borderTopColor: '#ffffff' }}></div>
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>Reviewing threshold exposure levels and writing memo...</p>
              </div>
            ) : (
              <p className="ai-brief-text">
                {clientBrief}
              </p>
            )}
          </div>

          {activeSnapshot ? (
            <>
              {/* Triggered Nexus (Filing Deadlines) Area */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.02em', margin: '0 0 16px 0' }}>
                  <ShieldCheck size={20} style={{ color: '#ff3b30' }} /> Triggered Nexus &amp; Filing Deadlines
                </h3>

                {nexusSchedules.length === 0 ? (
                  <div className="table-container" style={{ padding: '24px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                    No statutory thresholds triggered in this period. Great compliance standing!
                  </div>
                ) : (
                  <div className="exposure-card-list">
                    {nexusSchedules.map(sch => (
                      <div key={sch.state} className="exposure-card" style={{ borderLeft: '4px solid #ff3b30' }}>
                        <div className="exposure-state-name">
                          📍 {sch.state}
                        </div>
                        <div>
                          <div className="exposure-metric-val">${sch.revenue.toLocaleString()}</div>
                          <div className="exposure-metric-lbl">Revenue ({sch.transactions} Txns)</div>
                        </div>
                        <div>
                          <div className="exposure-metric-val" style={{ color: '#FF6B35', fontWeight: 600 }}>{sch.frequency}</div>
                          <div className="exposure-metric-lbl">Filing Frequency</div>
                        </div>
                        <div>
                          <div className="exposure-metric-val" style={{ color: '#ff3b30', fontWeight: 700 }}>
                            {new Date(sch.registerBy).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="exposure-metric-lbl">Register By (30 Days)</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approaching Exposure (Progress) Area */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.02em', margin: '0 0 16px 0' }}>
                  <AlertCircle size={20} style={{ color: '#ff9500' }} /> High Risk &amp; Approaching Thresholds
                </h3>

                {approachingSchedules.length === 0 ? (
                  <div className="table-container" style={{ padding: '24px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                    No evaluated states are currently approaching limits (40% - 99%).
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {approachingSchedules.map(sch => {
                      let colorClass = 'progress-fill-low';
                      if (sch.maxPct >= 80) colorClass = 'progress-fill-high';
                      else if (sch.maxPct >= 40) colorClass = 'progress-fill-medium';

                      return (
                        <div key={sch.state} className="glass-panel" style={{ padding: '20px', boxSizing: 'border-box', borderRadius: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: '#ffffff' }}>📍 {sch.state}</span>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: sch.maxPct >= 80 ? '#ff9500' : '#b79500' }}>
                              {sch.maxPct}% of Threshold
                            </span>
                          </div>
                          
                          <div className="progress-container" style={{ marginBottom: '12px' }}>
                            <div 
                              className={`progress-fill ${colorClass}`}
                              style={{ width: `${sch.maxPct}%` }}
                            />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', flexWrap: 'wrap', gap: '8px' }}>
                            <span>Current: <strong>${sch.revenue.toLocaleString()}</strong> ({sch.transactions} Txns)</span>
                            <span style={{ color: '#ff9500', fontWeight: 600 }}>
                              Required Gap: <strong>${sch.revGap.toLocaleString()}</strong> or <strong>{sch.txGap}</strong> Txns
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Complete State Breakdown Table */}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.02em', margin: '0 0 16px 0' }}>
                  <LayoutGrid size={20} /> All States Breakdown
                </h3>

                <div className="table-container">
                  <table className="client-table">
                    <thead>
                      <tr>
                        <th>State</th>
                        <th style={{ textAlign: 'right' }}>Revenue</th>
                        <th style={{ textAlign: 'center' }}>Transactions</th>
                        <th>Nexus Triggered</th>
                        <th>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nexusResults?.map(row => {
                        const isNexus = row.nexus_triggered === 1;
                        let riskBadge = 'badge-low';
                        if (row.risk_level === 'high') riskBadge = 'badge-critical';
                        else if (row.risk_level === 'medium') riskBadge = 'badge-medium';

                        return (
                          <tr key={row.state} style={{ cursor: 'default' }}>
                            <td style={{ fontWeight: 600, color: '#ffffff' }}>{row.state}</td>
                            <td style={{ textAlign: 'right', fontWeight: 500, color: '#ffffff' }}>${row.revenue.toLocaleString()}</td>
                            <td style={{ textAlign: 'center', fontWeight: 500, color: '#ffffff' }}>{row.transactions}</td>
                            <td>
                              <span className={`badge ${isNexus ? 'badge-critical' : 'badge-low'}`}>
                                {isNexus ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${riskBadge}`}>{row.risk_level}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="table-container" style={{ padding: '60px 40px', textAlign: 'center' }}>
              <Upload size={48} style={{ color: 'rgba(255, 255, 255, 0.4)', marginBottom: '16px' }} />
              <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', margin: '0 0 8px 0' }}>No Transaction Data Uploaded</h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', maxWidth: '440px', margin: '0 auto 24px' }}>
                Analyze this client's state-by-state sales tax exposure by uploading a CSV transaction report.
              </p>
              <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
                <Upload size={16} /> Upload First Snapshot
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Client Profile">
        {editError && (
          <div className="badge-critical" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textTransform: 'none', letterSpacing: 'normal' }}>
            <span>{editError}</span>
          </div>
        )}

        <form onSubmit={handleEditProfile}>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-name-input">Client Company Name</label>
            <input
              id="edit-name-input"
              type="text"
              className="form-input"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              required
              disabled={isSavingProfile}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-industry-select">Industry Sector</label>
            <select
              id="edit-industry-select"
              className="form-input form-select"
              value={editIndustry}
              onChange={e => setEditIndustry(e.target.value)}
              disabled={isSavingProfile}
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
            <label className="form-label" htmlFor="edit-notes-textarea">Compliance Notes</label>
            <textarea
              id="edit-notes-textarea"
              className="form-input form-textarea"
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              disabled={isSavingProfile}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)} disabled={isSavingProfile}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Client Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Account Deletion">
        <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '24px', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          Are you sure you want to permanently delete <strong style={{ color: '#ffffff' }}>{client?.name}</strong> and all associated upload histories? This action is irreversible.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDeleteClient}>
            Confirm Permanent Delete
          </button>
        </div>
      </Modal>

      {/* Upload Snapshot Modal */}
      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Transaction Snapshot" maxWidth="620px">
        {uploadError && (
          <div className="badge-critical" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textTransform: 'none', letterSpacing: 'normal' }}>
            <span>{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleUploadSnapshot}>
          <div className="form-group">
            <label className="form-label" htmlFor="period-label-input">Reporting Period Label</label>
            <input
              id="period-label-input"
              type="text"
              className="form-input"
              placeholder="e.g. Q2 2026, Full Year 2025"
              value={periodLabel}
              onChange={e => setPeriodLabel(e.target.value)}
              required
              disabled={isUploading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="csv-textarea">Transaction CSV Content</label>
            <textarea
              id="csv-textarea"
              className="form-input form-textarea"
              style={{ minHeight: '140px', fontFamily: 'monospace', fontSize: '13px' }}
              placeholder="state,revenue,transactions&#10;California,142000,310&#10;Washington,112000,220"
              value={rawCsv}
              onChange={e => setRawCsv(e.target.value)}
              required
              disabled={isUploading}
            />
          </div>

          {/* Template copy-paste helper card */}
          <div className="sample-csv-box" style={{ marginBottom: '24px' }}>
            <div className="sample-csv-title">
              <span>📋 Template Copy Helper</span>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', gap: '4px' }}
                onClick={handleCopySample}
              >
                {copied ? <Check size={12} style={{ color: '#34c759' }} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy Template'}
              </button>
            </div>
            <pre className="sample-csv-code">{sampleCsvContent}</pre>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isUploading}>
              {isUploading ? 'Analyzing...' : 'Parse & Analyze Exposure'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
