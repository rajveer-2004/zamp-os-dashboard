// lib/auth.js
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

export function signToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is missing.');
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is missing.');
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function getAccountantFromRequest(req) {
  let token = null;
  
  // Check cookies first
  if (req.headers.cookie) {
    try {
      const cookies = cookie.parse(req.headers.cookie);
      token = cookies.token;
    } catch {
      // Ignore parsing errors
    }
  }
  
  // Fallback to Authorization header
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }
  
  if (!token) return null;
  return verifyToken(token);
}

export function setCookieHeader(res, token) {
  const maxAge = 604800; // 7 days in seconds
  const isProd = process.env.NODE_ENV === 'production';
  const serialized = cookie.serialize('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge,
    path: '/',
  });
  res.setHeader('Set-Cookie', serialized);
}

export function clearCookieHeader(res) {
  const serialized = cookie.serialize('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  res.setHeader('Set-Cookie', serialized);
}
