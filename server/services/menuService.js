import { db } from '../db.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { broadcastSSE } from '../events/sse.js';

const CATEGORY_ORDER = [
  'Shawarma',
  'Burgers',
  'Pizza',
  'Momos',
  'Toasts',
  'Starters',
  'Loaded Fries',
  'Bring Your Own Chips',
  'Mojitos',
  'Milkshakes',
  'Waffles',
  'Desserts',
  'Combo Deals',
];

function categoryRank(category) {
  const index = CATEGORY_ORDER.findIndex(
    (c) => c.toLowerCase() === String(category || '').toLowerCase()
  );
  return index === -1 ? CATEGORY_ORDER.length : index;
}

function sortByCategoryOrder(rows) {
  return [...rows].sort((a, b) => categoryRank(a.category) - categoryRank(b.category));
}

// ── Activity Logging (Helper) ──
function logActivity(adminId, action, entityType, entityId, details) {
  try {
    db.prepare(
      `INSERT INTO admin_activity_log (admin_id, action, entity_type, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      adminId ?? null,
      String(action),
      String(entityType),
      entityId !== undefined && entityId !== null ? String(entityId) : null,
      details ? JSON.stringify(details) : null,
      new Date().toISOString(),
    );
  } catch {
    // non-fatal
  }
}

export function getPublicMenuItems() {
  const rows = db.prepare(
    `SELECT id, name, price, category, image_url, is_bestseller, is_active
     FROM menu_items
     WHERE deleted_at IS NULL
       AND is_active = 1
     ORDER BY name ASC`
  ).all();

  return sortByCategoryOrder(rows);
}

export function getAdminMenuItems({ category, availability, bestseller }) {
  const where = ['deleted_at IS NULL'];
  const params = [];
  if (category) { where.push('category = ?'); params.push(category); }
  if (availability === 'available') where.push('is_active = 1');
  if (availability === 'unavailable') where.push('is_active = 0');
  if (bestseller === 'true') where.push('is_bestseller = 1');

  const rows = db.prepare(
    `SELECT id, name, price, category, image_url, is_bestseller, is_active, created_at, updated_at
     FROM menu_items
     WHERE ${where.join(' AND ')}
     ORDER BY category ASC, name ASC`
  ).all(...params);

  return rows;
}

export function createMenuItem(data, adminId) {
  const now = new Date().toISOString();
  const result = db.prepare(
    `INSERT INTO menu_items (name, price, category, image_url, is_bestseller, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(data.name, data.price, data.category, data.image_url, data.is_bestseller ? 1 : 0, data.is_active ? 1 : 0, now, now);

  const item = db
    .prepare('SELECT id, name, price, category, image_url, is_bestseller, is_active FROM menu_items WHERE id = ?')
    .get(result.lastInsertRowid);

  logActivity(adminId, 'create_menu_item', 'menu_item', item.id, { name: item.name });
  broadcastSSE('menu_updated', { action: 'create', itemId: item.id });
  
  return item;
}

export function updateMenuItem(id, data, adminId) {
  const existing = db.prepare('SELECT id FROM menu_items WHERE id = ? AND deleted_at IS NULL').get(id);
  if (!existing) {
    throw new NotFoundError('Menu item not found.');
  }

  db.prepare(
    `UPDATE menu_items
     SET name = ?, price = ?, category = ?, image_url = ?, is_bestseller = ?, is_active = ?, updated_at = ?
     WHERE id = ?`
  ).run(data.name, data.price, data.category, data.image_url, data.is_bestseller ? 1 : 0, data.is_active ? 1 : 0, new Date().toISOString(), id);

  const item = db
    .prepare('SELECT id, name, price, category, image_url, is_bestseller, is_active FROM menu_items WHERE id = ?')
    .get(id);

  logActivity(adminId, 'update_menu_item', 'menu_item', id, { name: item.name });
  broadcastSSE('menu_updated', { action: 'update', itemId: id });
  
  return item;
}

export function deleteMenuItem(id, adminId) {
  const existing = db.prepare('SELECT id FROM menu_items WHERE id = ? AND deleted_at IS NULL').get(id);
  if (!existing) {
    throw new NotFoundError('Menu item not found.');
  }

  db.prepare(
    `UPDATE menu_items
     SET is_active = 0,
         deleted_at = ?,
         updated_at = ?
     WHERE id = ?`
  ).run(new Date().toISOString(), new Date().toISOString(), id);

  logActivity(adminId, 'delete_menu_item', 'menu_item', id, {});
  broadcastSSE('menu_updated', { action: 'delete', itemId: id });
}

export function duplicateMenuItem(id, adminId) {
  const existing = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  if (!existing) throw new NotFoundError('Menu item not found');
  
  const result = db.prepare(
    `INSERT INTO menu_items (name, price, category, image_url, is_bestseller, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(`${existing.name} (Copy)`, existing.price, existing.category, existing.image_url, existing.is_bestseller, existing.is_active, new Date().toISOString(), new Date().toISOString());
  
  broadcastSSE('menu_updated', { action: 'create', itemId: result.lastInsertRowid });
  return result.lastInsertRowid;
}

export function getCategories() {
  return db.prepare('SELECT * FROM categories ORDER BY display_order ASC, name ASC').all();
}

export function createCategory(data) {
  try {
    const result = db.prepare('INSERT INTO categories (name, display_order, is_active) VALUES (?, ?, ?)').run(data.name, data.display_order, data.is_active ? 1 : 0);
    return { id: result.lastInsertRowid, ...data };
  } catch (err) {
    throw new ConflictError('Category already exists or invalid data.');
  }
}

export function updateCategory(id, data) {
  try {
    db.prepare('UPDATE categories SET name = ?, display_order = ?, is_active = ? WHERE id = ?').run(data.name, data.display_order, data.is_active ? 1 : 0, id);
    return { id, ...data };
  } catch (err) {
    throw new ConflictError('Failed to update category.');
  }
}

export function deleteCategory(id) {
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
}
