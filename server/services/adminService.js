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

export function getCustomers() {
  const customers = db.prepare(`
    SELECT 
      u.id, 
      u.name, 
      u.phone, 
      u.email, 
      u.status,
      u.created_at as joined_date,
      COUNT(o.id) as total_orders,
      SUM(o.total) as lifetime_spend,
      MAX(o.created_at) as last_order,
      COUNT(CASE WHEN o.coupon_code IS NOT NULL THEN 1 END) as coupons_used
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.role = 'user'
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();
  return customers;
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
