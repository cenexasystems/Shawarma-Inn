import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { getUserById } from '../repositories/userRepository.js';

export async function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.sub);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = user;
    return next();
  } catch {
    // If local JWT fails, check if supabase is used
    const authMode = (process.env.VITE_AUTH_MODE || '').trim();
    if (authMode === 'supabase') {
      const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${token}`
            }
          });
          if (!response.ok) throw new Error('Invalid Supabase token');
          const user = await response.json();
          req.user = { id: user.id, email: user.email, role: 'user' }; // fallback role
          return next();
        } catch {
          // Fall through to error
        }
      }
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = getUserById(decoded.sub);
  } catch {
    req.user = null;
  }

  return next();
}

export async function adminRequired(req, res, next) {
  if (process.env.ADMIN_AUTH_BYPASS === 'true') {
    req.user = { id: 1, role: 'admin', email: process.env.ADMIN_EMAIL || 'admin@shawarmainn.local' };
    return next();
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }

  // First try to verify as local JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.sub);
    if (!user) return res.status(401).json({ error: 'Admin account not found.' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
    req.user = user;
    return next();
  } catch (err) {
    // If local JWT fails, and supabase is enabled, try supabase
    const authMode = (process.env.VITE_AUTH_MODE || '').trim();
    if (authMode === 'supabase') {
      const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${token}`
            }
          });
          if (!response.ok) throw new Error('Invalid Supabase token');
          const user = await response.json();
          req.user = { id: user.id, role: 'admin', email: user.email };
          return next();
        } catch {
          // Fall through to error
        }
      }
    }
    
    return res.status(401).json({ error: 'Admin session expired. Please log in again.' });
  }
}
