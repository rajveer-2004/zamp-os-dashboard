// api/auth/me.js
import { getAccountantFromRequest } from '../../lib/auth.js';

export default async function handler(req, res) {
  const accountant = getAccountantFromRequest(req);
  if (!accountant) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Return flat properties for dashboard UI binding compatibility AND nested accountant schema
  return res.status(200).json({
    id: accountant.id,
    email: accountant.email,
    firm_name: accountant.firm_name || accountant.firm,
    accountant: {
      email: accountant.email,
      firm: accountant.firm_name || accountant.firm
    }
  });
}
