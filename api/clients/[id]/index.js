// api/clients/[id]/index.js
import db from '../../../lib/db.js';
import { getAccountantFromRequest } from '../../../lib/auth.js';

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

  // Ensure client belongs to accountant
  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND accountant_id = ?').get(clientId, accountant.id);
  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }

  if (req.method === 'GET') {
    try {
      // Get all snapshots for this client to build history
      const snapshots = db.prepare(`
        SELECT id, period_label, uploaded_at 
        FROM client_snapshots 
        WHERE client_id = ? 
        ORDER BY uploaded_at DESC, id DESC
      `).all(clientId);

      // We will augment snapshots with their stats to compute diffs
      const snapshotsWithStats = [];
      for (let i = 0; i < snapshots.length; i++) {
        const snap = snapshots[i];
        
        const results = db.prepare(`
          SELECT revenue, nexus_triggered, rev_pct, txn_pct 
          FROM nexus_results 
          WHERE snapshot_id = ?
        `).all(snap.id);

        let nexusCount = 0;
        let approachingCount = 0;
        
        for (const row of results) {
          if (row.nexus_triggered === 1) {
            nexusCount++;
          } else if (Math.max(row.rev_pct, row.txn_pct) >= 40) {
            approachingCount++;
          }
        }
        
        snapshotsWithStats.push({
          ...snap,
          nexusCount,
          approachingCount
        });
      }

      // Compute diff indicators (compare snapshot[i] to snapshot[i+1] which is chronologically previous)
      for (let i = 0; i < snapshotsWithStats.length; i++) {
        const current = snapshotsWithStats[i];
        const previous = snapshotsWithStats[i + 1]; // next in list is older

        if (previous) {
          const diff = current.nexusCount - previous.nexusCount;
          if (diff > 0) {
            current.diffIndicator = { type: 'increase', count: diff };
          } else if (diff < 0) {
            current.diffIndicator = { type: 'decrease', count: Math.abs(diff) };
          } else {
            current.diffIndicator = { type: 'same' };
          }
        } else {
          current.diffIndicator = { type: 'same' }; // First ever snapshot has no change
        }
      }

      // Determine active snapshot: if dynamic query has ?snapshotId=X use that, else use latest
      const activeSnapshotIdStr = req.query.snapshotId;
      let activeSnapshotId = activeSnapshotIdStr ? Number(activeSnapshotIdStr) : null;

      if (activeSnapshotId && isNaN(activeSnapshotId)) {
        return res.status(400).json({ error: 'Invalid snapshot ID parameter' });
      }

      let activeSnapshot = null;
      if (activeSnapshotId) {
        activeSnapshot = db.prepare(`
          SELECT * FROM client_snapshots 
          WHERE id = ? AND client_id = ?
        `).get(activeSnapshotId, clientId);
      }

      if (!activeSnapshot && snapshotsWithStats.length > 0) {
        // Fallback to latest
        activeSnapshot = db.prepare(`
          SELECT * FROM client_snapshots 
          WHERE client_id = ? 
          ORDER BY uploaded_at DESC, id DESC 
          LIMIT 1
        `).get(clientId);
      }

      let nexusResults = [];
      let summary = {
        nexusCount: 0,
        approachingCount: 0,
        nexusRevenue: 0,
        overallRisk: 'LOW'
      };

      if (activeSnapshot) {
        nexusResults = db.prepare(`
          SELECT * FROM nexus_results 
          WHERE snapshot_id = ?
        `).all(activeSnapshot.id);

        for (const row of nexusResults) {
          const revenue = Number(row.revenue) || 0;
          const isNexus = row.nexus_triggered === 1;
          const maxPct = Math.max(row.rev_pct, row.txn_pct);

          if (isNexus) {
            summary.nexusCount++;
            summary.nexusRevenue += revenue;
          } else if (maxPct >= 40) {
            summary.approachingCount++;
          }
        }

        // Calculate overall risk
        if (summary.nexusCount >= 3) {
          summary.overallRisk = 'CRITICAL';
        } else if (summary.nexusCount >= 1 || summary.approachingCount >= 3) {
          summary.overallRisk = 'HIGH';
        } else if (summary.approachingCount >= 1) {
          summary.overallRisk = 'MEDIUM';
        } else {
          summary.overallRisk = 'LOW';
        }
      }

      return res.status(200).json({
        client: {
          ...client,
          overallRisk: summary.overallRisk,
          nexusCount: summary.nexusCount,
          approachingCount: summary.approachingCount,
          nexusRevenue: summary.nexusRevenue
        },
        activeSnapshot,
        nexusResults,
        snapshotHistory: snapshotsWithStats
      });
    } catch (error) {
      console.error('Fetch client details error:', error);
      return res.status(500).json({ error: 'Failed to retrieve client details' });
    }
  }

  if (req.method === 'PUT') {
    const { name, industry, notes } = req.body || {};

    if (!name || !industry) {
      return res.status(400).json({ error: 'Client name and industry are required' });
    }

    try {
      db.prepare(`
        UPDATE clients 
        SET name = ?, industry = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(name, industry, notes || '', clientId);

      const updatedClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
      return res.status(200).json(updatedClient);
    } catch (error) {
      console.error('Update client error:', error);
      return res.status(500).json({ error: 'Failed to update client' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // better-sqlite3 supports cascades if defined in FOREIGN KEY triggers, but let's delete explicitly to ensure compatibility
      db.prepare('DELETE FROM clients WHERE id = ?').run(clientId);
      return res.status(200).json({ success: true, message: 'Client successfully deleted' });
    } catch (error) {
      console.error('Delete client error:', error);
      return res.status(500).json({ error: 'Failed to delete client' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
