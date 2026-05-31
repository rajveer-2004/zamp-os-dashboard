// api/auth/logout.js
import { clearCookieHeader } from '../../lib/auth.js';

export default async function handler(req, res) {
  // Clear the secure cookie
  clearCookieHeader(res);
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}
