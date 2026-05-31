// api/clients/[id]/snapshots/index.js
import db from '../../../../lib/db.js';
import { getAccountantFromRequest } from '../../../../lib/auth.js';
import { analyzeState } from '../../../../lib/nexusEngine.js';

function parseCsvContent(rawCsv) {
  if (!rawCsv) return [];
  
  return rawCsv
    .trim()
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split(',');
      if (parts.length < 3) return null;

      const state = parts[0].replace(/['"]/g, '').trim();
      const revenueStr = parts[1].replace(/['"]/g, '').trim();
      const transactionsStr = parts[2].replace(/['"]/g, '').trim();

      // Check if this is a header row
      if (
        index === 0 &&
        state.toLowerCase() === 'state' &&
        (revenueStr.toLowerCase() === 'revenue' || transactionsStr.toLowerCase() === 'transactions')
      ) {
        return null;
      }

      return {
        state,
        revenue: Number(revenueStr) || 0,
        transactions: Number(transactionsStr) || 0
      };
    })
    .filter(Boolean);
}

export default async function handler(req, res) {
  const accountant = getAccountantFromRequest(req);
  if (!accountant) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const clientId = Number(id);

  if (isNaN(clientId)) {
    return res.status(400).json({ error: 'Invalid client ID' });
  }

  // Ensure client belongs to active accountant
  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND accountant_id = ?').get(clientId, accountant.id);
  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  if (req.method === 'GET') {
    try {
      const snapshots = db.prepare(`
        SELECT * FROM client_snapshots 
        WHERE client_id = ? 
        ORDER BY uploaded_at DESC, id DESC
      `).all(clientId);

      return res.status(200).json(snapshots);
    } catch (error) {
      console.error('Fetch snapshots error:', error);
      return res.status(500).json({ error: 'Failed to retrieve snapshot history' });
    }
  }

  if (req.method === 'POST') {
    const { period_label, raw_csv } = req.body || {};

    if (!period_label || !raw_csv) {
      return res.status(400).json({ error: 'Period label and raw CSV data are required' });
    }

    const parsedStates = parseCsvContent(raw_csv);
    if (parsedStates.length === 0) {
      return res.status(400).json({ error: "Couldn't parse that CSV. Expected columns: state, revenue, transactions" });
    }

    try {
      const snapshotInsert = db.prepare(`
        INSERT INTO client_snapshots (client_id, period_label, raw_csv)
        VALUES (?, ?, ?)
      `);

      const resultInsert = db.prepare(`
        INSERT INTO nexus_results (snapshot_id, state, revenue, transactions, nexus_triggered, risk_level, rev_pct, txn_pct)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let newSnapshotId = null;

      // Wrap in SQLite transaction
      const transaction = db.transaction(() => {
        const snapRes = snapshotInsert.run(clientId, period_label, raw_csv);
        newSnapshotId = snapRes.lastInsertRowid;

        for (const row of parsedStates) {
          const analysis = analyzeState(row);
          resultInsert.run(
            newSnapshotId,
            row.state,
            row.revenue,
            row.transactions,
            analysis.nexus,
            analysis.risk,
            analysis.revPct,
            analysis.txnPct
          );
        }

        // Touch the updated_at timestamp on the parent client
        db.prepare('UPDATE clients SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(clientId);
      });

      transaction();

      const createdSnapshot = db.prepare('SELECT * FROM client_snapshots WHERE id = ?').get(newSnapshotId);

      return res.status(201).json(createdSnapshot);
    } catch (error) {
      console.error('Snapshot upload error:', error);
      return res.status(500).json({ error: 'Failed to upload and analyze snapshot' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
