// lib/db.js
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { analyzeState } from './nexusEngine.js';

// Ensure the lib directory exists locally
const libDir = path.join(process.cwd(), 'lib');
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

const dbPath = process.env.NODE_ENV === 'production'
  ? '/tmp/zamp-os.db'
  : path.join(process.cwd(), 'lib', 'data.db');

const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS accountants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    firm_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    accountant_id INTEGER NOT NULL REFERENCES accountants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT DEFAULT 'Other',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS client_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    period_label TEXT NOT NULL,
    raw_csv TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS nexus_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    snapshot_id INTEGER NOT NULL REFERENCES client_snapshots(id) ON DELETE CASCADE,
    state TEXT NOT NULL,
    revenue REAL NOT NULL,
    transactions INTEGER NOT NULL,
    nexus_triggered INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    rev_pct INTEGER NOT NULL,
    txn_pct INTEGER NOT NULL
  );
`);

// Helper to parse CSV simply
function parseSimpleCsv(rawCsv) {
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

// Seeder function
function seedDemoData(database) {
  const row = database.prepare('SELECT id FROM accountants WHERE email = ?').get('demo@smithtax.com');
  if (row) {
    // Already seeded
    return;
  }

  // Create demo accountant
  const passwordHash = bcrypt.hashSync('zamp2026', 10);
  const accountantStmt = database.prepare(`
    INSERT INTO accountants (email, password_hash, firm_name)
    VALUES (?, ?, ?)
  `);
  const accountantResult = accountantStmt.run('demo@smithtax.com', passwordHash, 'Smith & Associates Tax Advisory');
  const accountantId = accountantResult.lastInsertRowid;

  // Demo CSVs
  const csvAcme = `California,142000,310
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

  const csvBrightline = `New York,67000,140
Massachusetts,56000,99
Florida,54000,88
Oregon,61000,130
Illinois,45000,75
Texas,44000,85
New Jersey,38000,70
Michigan,23000,42
Ohio,21000,35
Georgia,19000,38`;

  const csvHarbor = `Washington,112000,220
California,78000,160
Colorado,82000,155
Texas,76000,145
Pennsylvania,71000,138
Arizona,65000,120
New York,58000,105
Massachusetts,48000,88
Florida,45000,75
Illinois,38000,65`;

  const csvVertex = `California,75000,140
Texas,68000,130
Ohio,55000,95
Illinois,48000,88
Georgia,42000,75
Michigan,38000,68
Virginia,35000,62
North Carolina,32000,55
Tennessee,28000,48
Arizona,25000,42`;

  const csvSummit = `California,28000,45
Texas,22000,38
New York,18000,30
Florida,15000,25
Illinois,12000,20
Ohio,9000,15
Georgia,7000,12
Michigan,6000,10
Virginia,5000,8
Colorado,4000,6`;

  const demoClients = [
    { name: 'Acme Commerce', industry: 'E-commerce', notes: 'Major electronics and clothing drop-shipper. High transaction counts nationwide.', csv: csvAcme },
    { name: 'Brightline SaaS', industry: 'SaaS', notes: 'Subscription analytics workflow application. Moderate growth, scaling in Northeast.', csv: csvBrightline },
    { name: 'Harbor Retail', industry: 'Retail', notes: 'Boutique apparel distributor. High physical footprint and digital storefront presence.', csv: csvHarbor },
    { name: 'Vertex Manufacturing', industry: 'Manufacturing', notes: 'Automotive and precision hardware parts manufacturing. High order value, low transaction quantity.', csv: csvVertex },
    { name: 'Summit Services', industry: 'Services', notes: 'B2B operational consulting agency. High ticket invoices, very localized exposure.', csv: csvSummit }
  ];

  const clientInsert = database.prepare(`
    INSERT INTO clients (accountant_id, name, industry, notes)
    VALUES (?, ?, ?, ?)
  `);

  const snapshotInsert = database.prepare(`
    INSERT INTO client_snapshots (client_id, period_label, raw_csv)
    VALUES (?, ?, ?)
  `);

  const resultInsert = database.prepare(`
    INSERT INTO nexus_results (snapshot_id, state, revenue, transactions, nexus_triggered, risk_level, rev_pct, txn_pct)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Run as transaction for speed and safety
  const transaction = database.transaction(() => {
    for (const client of demoClients) {
      const clientRes = clientInsert.run(accountantId, client.name, client.industry, client.notes);
      const clientId = clientRes.lastInsertRowid;

      // Create initial snapshot
      const snapshotRes = snapshotInsert.run(clientId, 'Q1 2026', client.csv);
      const snapshotId = snapshotRes.lastInsertRowid;

      // Analyze and save results
      const parsedRows = parseSimpleCsv(client.csv);
      for (const row of parsedRows) {
        const analysis = analyzeState(row);
        resultInsert.run(
          snapshotId,
          row.state,
          row.revenue,
          row.transactions,
          analysis.nexus,
          analysis.risk,
          analysis.revPct,
          analysis.txnPct
        );
      }
    }
  });

  transaction();
}

// Seed on initialization
seedDemoData(db);

export default db;
