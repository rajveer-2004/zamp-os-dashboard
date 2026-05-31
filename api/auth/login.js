// api/auth/login.js
import db from '../../lib/db.js';
import bcrypt from 'bcryptjs';
import { signToken, setCookieHeader } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Look up accountant
    const accountant = db.prepare('SELECT * FROM accountants WHERE email = ?').get(email);
    if (!accountant) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isValid = bcrypt.compareSync(password, accountant.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = signToken({
      id: accountant.id,
      email: accountant.email,
      firm_name: accountant.firm_name
    });

    // Set secure cookie
    setCookieHeader(res, token);

    return res.status(200).json({
      id: accountant.id,
      email: accountant.email,
      firm_name: accountant.firm_name
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
}
