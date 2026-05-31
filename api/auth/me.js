// api/auth/me.js
import { getAccountantFromRequest } from '../../lib/auth.js';

export default async function handler(req, res) {
  const accountant = getAccountantFromRequest(req);
  if (!accountant) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({
    id: accountant.id,
    email: accountant.email,
    firm_name: accountant.firm_name
  });
}
