// lib/seedData.js
import { analyzeState } from './nexusEngine.js';

export const DEMO_USER = {
  email: 'demo@smithtax.com',
  password: 'zamp2026',
  firm: 'Smith & Associates Tax Advisory',
  id: 1
};

export const csvAcme = `California,142000,310
Washington,112000,220
Colorado,104000,205
Texas,98000,195
Pennsylvania,88000,178
Arizona,72000,150
New York,67000,140
Massachusetts,56000,99
Florida,54000,88
Oregon,61000,130
Illinois,45000,75
Minnesota,44000,85
New Jersey,38000,70
Michigan,23000,42
Ohio,31000,55
Georgia,19000,38
Virginia,15000,27
Tennessee,12000,22
North Carolina,8000,16
Nevada,9000,14`;

export const csvBrightline = `New York,167000,240
Massachusetts,156000,210
Florida,54000,88
Oregon,61000,130
Illinois,45000,75
Texas,44000,85
New Jersey,38000,70
Michigan,23000,42
Ohio,21000,35
Georgia,19000,38`;

export const csvHarbor = `Washington,112000,220
California,178000,260
Colorado,82000,155
Texas,76000,145
Pennsylvania,71000,138
Arizona,65000,120
New York,58000,105
Massachusetts,48000,88
Florida,45000,75
Illinois,38000,65`;

export const csvVertex = `California,175000,240
Texas,168000,230
Ohio,55000,95
Illinois,48000,88
Georgia,42000,75
Michigan,38000,68
Virginia,35000,62
North Carolina,32000,55
Tennessee,28000,48
Arizona,25000,42`;

export const csvSummit = `California,128000,215
Texas,22000,38
New York,18000,30
Florida,15000,25
Illinois,12000,20
Ohio,9000,15
Georgia,7000,12
Michigan,6000,10
Virginia,5000,8
Colorado,4000,6`;

export const INITIAL_CLIENTS = [
  { id: 1, accountant_id: 1, name: 'Acme Commerce', industry: 'E-commerce', notes: 'Major electronics and clothing drop-shipper. High transaction counts nationwide.', csv: csvAcme },
  { id: 2, accountant_id: 1, name: 'Brightline SaaS', industry: 'SaaS', notes: 'Subscription analytics workflow application. Moderate growth, scaling in Northeast.', csv: csvBrightline },
  { id: 3, accountant_id: 1, name: 'Harbor Retail', industry: 'Retail', notes: 'Boutique apparel distributor. High physical footprint and digital storefront presence.', csv: csvHarbor },
  { id: 4, accountant_id: 1, name: 'Vertex Manufacturing', industry: 'Manufacturing', notes: 'Automotive and precision hardware parts manufacturing. High order value, low transaction quantity.', csv: csvVertex },
  { id: 5, accountant_id: 1, name: 'Summit Services', industry: 'Services', notes: 'B2B operational consulting agency. High ticket invoices, very localized exposure.', csv: csvSummit }
];

// Helper to parse CSV simply
export function parseSimpleCsv(rawCsv) {
  return rawCsv
    .trim()
    .split(/\r?\n/)
    .map(line => {
      const parts = line.split(',');
      if (parts.length < 3) return null;
      return {
        state: parts[0].trim(),
        revenue: Number(parts[1]) || 0,
        transactions: Number(parts[2]) || 0
      };
    })
    .filter(Boolean);
}

// Generate the complete initial set of database rows in memory
export function getInitialInMemoryData() {
  const clients = INITIAL_CLIENTS.map(c => ({
    id: c.id,
    accountant_id: c.accountant_id,
    name: c.name,
    industry: c.industry,
    notes: c.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const clientSnapshots = [];
  const nexusResults = [];

  let snapshotIdCounter = 1;
  let resultIdCounter = 1;

  for (const client of INITIAL_CLIENTS) {
    const uploadedAt = new Date().toISOString();
    clientSnapshots.push({
      id: snapshotIdCounter,
      client_id: client.id,
      period_label: 'Q1 2026',
      raw_csv: client.csv,
      uploaded_at: uploadedAt
    });

    const parsedRows = parseSimpleCsv(client.csv);
    for (const row of parsedRows) {
      const analysis = analyzeState(row);
      nexusResults.push({
        id: resultIdCounter++,
        snapshot_id: snapshotIdCounter,
        state: row.state,
        revenue: row.revenue,
        transactions: row.transactions,
        nexus_triggered: analysis.nexus,
        risk_level: analysis.risk,
        rev_pct: analysis.revPct,
        txn_pct: analysis.txnPct
      });
    }

    snapshotIdCounter++;
  }

  return { clients, clientSnapshots, nexusResults };
}
