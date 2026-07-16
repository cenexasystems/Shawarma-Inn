import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { getUserById } from '../repositories/userRepository.js';
import { createToken } from '../services/authService.js';

// If a valid token has less than this much life left, silently issue a
// fresh one via the X-Refreshed-Token response header so an active admin
// never gets logged out mid-session.
const REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function maybeSlideSession(req, res, decoded, user) {
  if (!decoded.exp) return;
  const remainingMs = decoded.exp * 1000 - Date.now();
  if (remainingMs > 0 && remainingMs < REFRESH_THRESHOLD_MS) {
    res.setHeader('X-Refreshed-Token', createToken(user));
  }
}

async function getSupabaseUser(token) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const headers = { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` };
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers });
  if (!userResponse.ok) return null;
  const user = await userResponse.json();
  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
    { headers },
  );
  if (!profileResponse.ok) return null;
  const profiles = await profileResponse.json();
  return { user, role: profiles[0]?.role || 'user' };
}

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
    maybeSlideSession(req, res, decoded, user);
    return next();
  } catch {
    // If local JWT fails, check if supabase is used
    try {
      const identity = await getSupabaseUser(token);
      if (identity) {
        req.user = { id: identity.user.id, email: identity.user.email, role: identity.role };
        return next();
      }
    } catch {
      // Fall through to error
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
    req.user = { id: 1, role: 'admin', email: process.env.ADMIN_EMAIL || 'sharath.creator2210@gmail.com' };
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
    maybeSlideSession(req, res, decoded, user);
    return next();
  } catch (err) {
    // If local JWT fails, and supabase is enabled, try supabase
    try {
      const identity = await getSupabaseUser(token);
      if (identity?.role === 'admin') {
        req.user = { id: identity.user.id, role: 'admin', email: identity.user.email };
        return next();
      }
    } catch {
      // Fall through to error
    }
    
    return res.status(401).json({ error: 'Admin session expired. Please log in again.' });
  }
}
