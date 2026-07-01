import { db } from '../db.js';
import { NotFoundError } from '../utils/errors.js';

export function getAdminUsers() {
  const users = db.prepare(
    `SELECT id, name, email, phone, role, created_at 
     FROM users 
     ORDER BY role ASC, created_at DESC`
  ).all();
  return users;
}

export function updateUserRole(userId, role) {
  if (role !== 'admin' && role !== 'user') {
    throw new Error('Invalid role');
  }
  
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
  return db.prepare('SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?').get(userId);
}
