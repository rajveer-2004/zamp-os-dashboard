// lib/deadlines.js

const THRESHOLDS = { revenue: 100000, transactions: 200 };

/**
 * Calculates deadlines and gaps for state sales tax filings.
 * @param {Array} snapshotResults - The list of analyzed states
 * @param {string|Date} uploadedAt - The date when the snapshot was uploaded
 */
export function getFilingDeadlines(snapshotResults, uploadedAt) {
  const baseDate = uploadedAt ? new Date(uploadedAt) : new Date();
  
  const nexusStates = [];
  const approachingStates = [];
  
  for (const stateData of snapshotResults) {
    const revenue = Number(stateData.revenue) || 0;
    const transactions = Number(stateData.transactions) || 0;
    
    // Check if nexus is triggered from the row
    const isNexus = 
      stateData.nexus_triggered === 1 || 
      stateData.nexus_triggered === true || 
      stateData.nexus === true || 
      stateData.nexus === 1;
    
    const revPct = Math.round((revenue / THRESHOLDS.revenue) * 100);
    const txnPct = Math.round((transactions / THRESHOLDS.transactions) * 100);
    const maxPct = Math.max(revPct, txnPct);
    
    if (isNexus) {
      // Determine filing frequency based on annual volume
      let frequency = 'Quarterly';
      if (revenue >= 150000) {
        frequency = 'Monthly';
      } else if (revenue < 25000) {
        frequency = 'Annually';
      }
      
      // Deadline dates: 30 days to register
      const regDate = new Date(baseDate);
      regDate.setDate(regDate.getDate() + 30);
      
      // First filing deadline: typically the 20th of the month following registration
      const fileDate = new Date(regDate);
      fileDate.setMonth(fileDate.getMonth() + 1);
      fileDate.setDate(20);
      
      nexusStates.push({
        state: stateData.state,
        revenue,
        transactions,
        frequency,
        registerBy: regDate.toISOString().split('T')[0],
        firstFiling: fileDate.toISOString().split('T')[0]
      });
    } else if (maxPct >= 40) {
      // State is approaching nexus
      const revenueGap = Math.max(0, THRESHOLDS.revenue - revenue);
      const transactionGap = Math.max(0, THRESHOLDS.transactions - transactions);
      
      approachingStates.push({
        state: stateData.state,
        revenue,
        transactions,
        maxPct,
        revenueGap,
        transactionGap
      });
    }
  }
  
  // Sort: Nexus states by nearest registration deadline first
  nexusStates.sort((a, b) => new Date(a.registerBy) - new Date(b.registerBy));
  // Sort: Approaching states by highest percentage to threshold first
  approachingStates.sort((a, b) => b.maxPct - a.maxPct);
  
  return { nexusStates, approachingStates };
}
