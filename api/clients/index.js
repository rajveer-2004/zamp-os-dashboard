// api/clients/index.js
import db from '../../lib/db.js';
import { getAccountantFromRequest } from '../../lib/auth.js';

export default async function handler(req, res) {
  const accountant = getAccountantFromRequest(req);
  if (!accountant) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const accountantId = accountant.id;

  if (req.method === 'GET') {
    try {
      // Get all clients for this accountant
      const clients = db.prepare(`
        SELECT * FROM clients 
        WHERE accountant_id = ? 
        ORDER BY created_at DESC
      `).all(accountantId);

      const clientList = [];

      for (const client of clients) {
        // Get the latest snapshot for this client
        const latestSnapshot = db.prepare(`
          SELECT * FROM client_snapshots 
          WHERE client_id = ? 
          ORDER BY uploaded_at DESC, id DESC 
          LIMIT 1
        `).get(client.id);

        let nexusCount = 0;
        let approachingCount = 0;
        let nexusRevenue = 0;
        let overallRisk = 'LOW';
        let periodLabel = null;
        let lastUpdated = client.updated_at;

        if (latestSnapshot) {
          periodLabel = latestSnapshot.period_label;
          lastUpdated = latestSnapshot.uploaded_at;
          
          const results = db.prepare(`
            SELECT * FROM nexus_results 
            WHERE snapshot_id = ?
          `).all(latestSnapshot.id);

          for (const row of results) {
            const revenue = Number(row.revenue) || 0;
            const isNexus = row.nexus_triggered === 1;
            const maxPct = Math.max(row.rev_pct, row.txn_pct);

            if (isNexus) {
              nexusCount++;
              nexusRevenue += revenue;
            } else if (maxPct >= 40) {
              approachingCount++;
            }
          }

          // Calculate overall risk
          if (nexusCount >= 3) {
            overallRisk = 'CRITICAL';
          } else if (nexusCount >= 1 || approachingCount >= 3) {
            overallRisk = 'HIGH';
          } else if (approachingCount >= 1) {
            overallRisk = 'MEDIUM';
          } else {
            overallRisk = 'LOW';
          }
        }

        clientList.push({
          ...client,
          latestSnapshot: latestSnapshot ? {
            id: latestSnapshot.id,
            period_label: periodLabel,
            uploaded_at: latestSnapshot.uploaded_at
          } : null,
          nexusCount,
          approachingCount,
          nexusRevenue,
          overallRisk,
          lastUpdated
        });
      }

      return res.status(200).json(clientList);
    } catch (error) {
      console.error('Fetch clients error:', error);
      return res.status(500).json({ error: 'Failed to retrieve clients' });
    }
  }

  if (req.method === 'POST') {
    const { name, industry, notes } = req.body || {};

    if (!name || !industry) {
      return res.status(400).json({ error: 'Client name and industry are required' });
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO clients (accountant_id, name, industry, notes)
        VALUES (?, ?, ?, ?)
      `);
      const result = stmt.run(accountantId, name, industry, notes || '');
      
      const newClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
      
      return res.status(201).json({
        ...newClient,
        latestSnapshot: null,
        nexusCount: 0,
        approachingCount: 0,
        nexusRevenue: 0,
        overallRisk: 'LOW',
        lastUpdated: newClient.created_at
      });
    } catch (error) {
      console.error('Create client error:', error);
      return res.status(500).json({ error: 'Failed to create client' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
