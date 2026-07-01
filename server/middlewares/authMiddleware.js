import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { getUserById } from '../repositories/userRepository.js';

export function authRequired(req, res, next) {
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

export function adminRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.sub);
    if (!user) return res.status(401).json({ error: 'Admin account not found.' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Admin session expired. Please log in again.' });
  }
}
