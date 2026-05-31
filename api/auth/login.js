// api/auth/login.js
import { signToken } from '../../lib/auth.js';
import cookie from 'cookie';

const DEMO_USER = {
  email: 'demo@smithtax.com',
  password: 'zamp2026',
  firm: 'Smith & Associates Tax Advisory',
  id: 1
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (email !== DEMO_USER.email || password !== DEMO_USER.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT token with demo credentials
  const token = signToken({
    id: DEMO_USER.id,
    email: DEMO_USER.email,
    firm_name: DEMO_USER.firm,
    firm: DEMO_USER.firm
  });

  // Set secure cookie as requested
  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict; Secure`);

  // Return flat properties for dashboard UI binding compatibility AND nested accountant schema
  return res.status(200).json({
    id: DEMO_USER.id,
    email: DEMO_USER.email,
    firm_name: DEMO_USER.firm,
    accountant: {
      email: DEMO_USER.email,
      firm: DEMO_USER.firm
    }
  });
}
