// lib/nexusEngine.js
const THRESHOLDS = { revenue: 100000, transactions: 200 };

export function analyzeState(row) {
  const revenue = Number(row.revenue) || 0;
  const transactions = Number(row.transactions) || 0;
  
  const nexus = revenue >= THRESHOLDS.revenue || transactions >= THRESHOLDS.transactions;
  const revPct = Math.round((revenue / THRESHOLDS.revenue) * 100);
  const txnPct = Math.round((transactions / THRESHOLDS.transactions) * 100);
  const maxPct = Math.max(revPct, txnPct);
  
  let risk = 'low';
  if (nexus) risk = 'high';
  else if (maxPct >= 80) risk = 'high';
  else if (maxPct >= 40) risk = 'medium';
  
  return { 
    nexus: nexus ? 1 : 0, // Store as 1/0 for sqlite
    risk, 
    revPct, 
    txnPct, 
    maxPct 
  };
}

export function analyzePortfolio(rows) {
  return rows.map(r => ({ ...r, ...analyzeState(r) }));
}
