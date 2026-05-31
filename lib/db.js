// lib/db.js
import { getInitialInMemoryData } from './seedData.js';

// Store in global scope to ensure it survives serverless hot-reloads inside Vercel containers
if (!global.__inMemoryDb) {
  global.__inMemoryDb = getInitialInMemoryData();
}

const getDbState = () => global.__inMemoryDb;

class MockStatement {
  constructor(sql) {
    this.sql = sql.trim().replace(/\s+/g, ' ');
  }

  run(...params) {
    const state = getDbState();

    // 1. INSERT INTO clients
    if (this.sql.includes('INSERT INTO clients')) {
      const [accountant_id, name, industry, notes] = params;
      const newId = state.clients.length > 0 ? Math.max(...state.clients.map(c => c.id)) + 1 : 1;
      const newClient = {
        id: newId,
        accountant_id: Number(accountant_id),
        name,
        industry,
        notes: notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      state.clients.push(newClient);
      return { lastInsertRowid: newId, changes: 1 };
    }

    // 2. INSERT INTO client_snapshots
    if (this.sql.includes('INSERT INTO client_snapshots')) {
      const [client_id, period_label, raw_csv] = params;
      const newId = state.clientSnapshots.length > 0 ? Math.max(...state.clientSnapshots.map(s => s.id)) + 1 : 1;
      const newSnapshot = {
        id: newId,
        client_id: Number(client_id),
        period_label,
        raw_csv,
        uploaded_at: new Date().toISOString()
      };
      state.clientSnapshots.push(newSnapshot);
      return { lastInsertRowid: newId, changes: 1 };
    }

    // 3. INSERT INTO nexus_results
    if (this.sql.includes('INSERT INTO nexus_results')) {
      const [snapshot_id, stateName, revenue, transactions, nexus_triggered, risk_level, rev_pct, txn_pct] = params;
      const newId = state.nexusResults.length > 0 ? Math.max(...state.nexusResults.map(r => r.id)) + 1 : 1;
      const newResult = {
        id: newId,
        snapshot_id: Number(snapshot_id),
        state: stateName,
        revenue: Number(revenue),
        transactions: Number(transactions),
        nexus_triggered: Number(nexus_triggered),
        risk_level,
        rev_pct: Number(rev_pct),
        txn_pct: Number(txn_pct)
      };
      state.nexusResults.push(newResult);
      return { lastInsertRowid: newId, changes: 1 };
    }

    // 4. UPDATE clients (with set name, industry, notes)
    if (this.sql.includes('UPDATE clients SET name = ?') || this.sql.includes('UPDATE clients SET name =?')) {
      const [name, industry, notes, id] = params;
      const client = state.clients.find(c => c.id === Number(id));
      if (client) {
        client.name = name;
        client.industry = industry;
        client.notes = notes || '';
        client.updated_at = new Date().toISOString();
      }
      return { changes: 1 };
    }

    // 5. UPDATE clients SET updated_at = CURRENT_TIMESTAMP
    if (this.sql.includes('UPDATE clients SET updated_at')) {
      const [id] = params;
      const client = state.clients.find(c => c.id === Number(id));
      if (client) {
        client.updated_at = new Date().toISOString();
      }
      return { changes: 1 };
    }

    // 6. DELETE FROM clients
    if (this.sql.includes('DELETE FROM clients')) {
      const [id] = params;
      const clientId = Number(id);
      
      // Clean up snapshots and results first to maintain relational integrity
      const snapshotIds = state.clientSnapshots.filter(s => s.client_id === clientId).map(s => s.id);
      state.nexusResults = state.nexusResults.filter(r => !snapshotIds.includes(r.snapshot_id));
      state.clientSnapshots = state.clientSnapshots.filter(s => s.client_id !== clientId);
      state.clients = state.clients.filter(c => c.id !== clientId);
      
      return { changes: 1 };
    }

    return { changes: 0 };
  }

  get(...params) {
    const state = getDbState();

    // 1. SELECT * FROM accountants WHERE email = ?
    if (this.sql.includes('FROM accountants WHERE email = ?')) {
      const [email] = params;
      if (email === 'demo@smithtax.com') {
        return {
          id: 1,
          email: 'demo@smithtax.com',
          password_hash: '$2a$10$6DryjM5nXsAmkm5f.Ffkoe9QdI.zYX3nxgHL4HeNorkRWTHb/MCNW',
          firm_name: 'Smith & Associates Tax Advisory'
        };
      }
      return null;
    }

    // 2. SELECT * FROM client_snapshots WHERE client_id = ? ORDER BY uploaded_at DESC, id DESC LIMIT 1
    if (this.sql.includes('FROM client_snapshots WHERE client_id = ?') && this.sql.includes('LIMIT 1')) {
      const [client_id] = params;
      const snaps = state.clientSnapshots
        .filter(s => s.client_id === Number(client_id))
        .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at) || b.id - a.id);
      return snaps[0] || null;
    }

    // 3. SELECT * FROM client_snapshots WHERE id = ? AND client_id = ?
    if (this.sql.includes('FROM client_snapshots WHERE id = ? AND client_id = ?')) {
      const [id, client_id] = params;
      return state.clientSnapshots.find(s => s.id === Number(id) && s.client_id === Number(client_id)) || null;
    }

    // 4. SELECT * FROM clients WHERE id = ? AND accountant_id = ?
    if (this.sql.includes('FROM clients WHERE id = ? AND accountant_id = ?')) {
      const [id, accountant_id] = params;
      return state.clients.find(c => c.id === Number(id) && c.accountant_id === Number(accountant_id)) || null;
    }

    // 5. SELECT * FROM clients WHERE id = ?
    if (this.sql.includes('FROM clients WHERE id = ?')) {
      const [id] = params;
      return state.clients.find(c => c.id === Number(id)) || null;
    }

    return null;
  }

  all(...params) {
    const state = getDbState();

    // 1. SELECT * FROM accountants
    if (this.sql.includes('FROM accountants')) {
      return [{
        id: 1,
        email: 'demo@smithtax.com',
        password_hash: '$2a$10$6DryjM5nXsAmkm5f.Ffkoe9QdI.zYX3nxgHL4HeNorkRWTHb/MCNW',
        firm_name: 'Smith & Associates Tax Advisory'
      }];
    }

    // 2. SELECT * FROM clients WHERE accountant_id = ?
    if (this.sql.includes('FROM clients WHERE accountant_id = ?')) {
      const [accountant_id] = params;
      return state.clients
        .filter(c => c.accountant_id === Number(accountant_id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // 3. SELECT * FROM client_snapshots WHERE client_id = ?
    if (this.sql.includes('FROM client_snapshots WHERE client_id = ?')) {
      const [client_id] = params;
      return state.clientSnapshots
        .filter(s => s.client_id === Number(client_id))
        .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at) || b.id - a.id);
    }

    // 4. SELECT * FROM nexus_results WHERE snapshot_id = ?
    if (this.sql.includes('FROM nexus_results WHERE snapshot_id = ?')) {
      const [snapshot_id] = params;
      return state.nexusResults.filter(r => r.snapshot_id === Number(snapshot_id));
    }

    return [];
  }
}

// In-Memory SQLite Mock Database Interface
const db = {
  prepare(sql) {
    return new MockStatement(sql);
  },
  transaction(fn) {
    return (...args) => fn(...args);
  },
  exec() {
    // Schema creation is fully ignored since database runs in memory
    return { changes: 0 };
  }
};

export default db;
