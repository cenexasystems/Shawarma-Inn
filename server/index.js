import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import fs from 'node:fs';
import * as XLSX from 'xlsx';
import { db, dbPath, getNextOrderNumber, recordOrderStatusChange } from './db.js';
import app from './app.js';
import { authRequired, adminRequired, optionalAuth } from './middlewares/authMiddleware.js';
import { JWT_SECRET } from './config/env.js';
import { broadcastSSE, broadcastSSEToUser } from './events/sse.js';
import jwt from 'jsonwebtoken';
import { getDateRangeSql } from './utils/filterEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const PORT = Number(process.env.PORT || 5000);

function sanitizeEmail(value) {
  return String(value || '').trim().toLowerCase().slice(0, 254);
}

// ── Admin Activity Log ────────────────────────────────────────────────────

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
    // non-fatal — never block the main operation
  }
}

app.get('/api/admin/activity', adminRequired, (req, res) => {
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 50));
  const action = String(req.query.action || '').trim();
  const entityType = String(req.query.entityType || '').trim();
  const adminId = String(req.query.adminId || '').trim();
  const dateFrom = String(req.query.dateFrom || '').trim();
  const dateTo = String(req.query.dateTo || '').trim();

  const where = [];
  const params = [];
  if (action) { where.push('a.action = ?'); params.push(action); }
  if (entityType) { where.push('a.entity_type = ?'); params.push(entityType); }
  if (adminId) { where.push('a.admin_id = ?'); params.push(Number(adminId)); }
  if (dateFrom) { where.push("date(a.created_at, 'localtime') >= date(?)"); params.push(dateFrom); }
  if (dateTo) { where.push("date(a.created_at, 'localtime') <= date(?)"); params.push(dateTo); }
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const rows = db.prepare(
    `SELECT a.id, a.action, a.entity_type, a.entity_id, a.details, a.created_at,
            u.email AS admin_email, u.name AS admin_name
     FROM admin_activity_log a
     LEFT JOIN users u ON u.id = a.admin_id
     ${whereSql}
     ORDER BY a.created_at DESC LIMIT ?`
  ).all(...params, limit);

  return res.json({ activity: rows });
});

function normalizeCheckoutItems(cartItems) {
  return cartItems
    .map((item) => ({
      menu_item_id: Number(item.id) || null,
      name: String(item.name || '').trim(),
      quantity: Number(item.qty) || Number(item.quantity) || 1,
      price: Number(item.price) || 0,
    }))
    .filter((item) => item.name && item.quantity > 0 && item.price >= 0);
}

function createOrderWithItems({
  userId,
  customerName,
  customerPhone,
  customerEmail,
  deliveryType,
  deliveryAddress,
  couponCode,
  discountAmount,
  gstAmount,
  packingCharge,
  notes,
  source,
  status,
  items,
}) {
  const insertOrder = db.prepare(
    `INSERT INTO orders (
      order_number,
      user_id,
      total,
      status,
      customer_name,
      customer_phone,
      customer_email,
      delivery_type,
      delivery_address,
      coupon_code,
      discount_amount,
      gst_amount,
      packing_charge,
      notes,
      source,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertOrderItem = db.prepare(
    `INSERT INTO order_items (
      order_id,
      menu_item_id,
      name,
      quantity,
      price
    ) VALUES (?, ?, ?, ?, ?)`
  );

  const runTx = db.transaction((payload) => {
    const itemsTotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = Math.max(0, itemsTotal - (payload.discountAmount || 0) + (payload.gstAmount || 0) + (payload.packingCharge || 0));
    const createdAt = new Date().toISOString();
    const orderNumber = getNextOrderNumber();

    const orderResult = insertOrder.run(
      orderNumber,
      payload.userId ?? null,
      total,
      payload.status,
      payload.customerName || null,
      payload.customerPhone || null,
      payload.customerEmail || null,
      payload.deliveryType === 'home_delivery' ? 'home_delivery' : 'store_pickup',
      payload.deliveryAddress || null,
      payload.couponCode || null,
      payload.discountAmount || 0,
      payload.gstAmount || 0,
      payload.packingCharge || 0,
      payload.notes || null,
      payload.source,
      createdAt,
      createdAt,
    );

    const orderId = Number(orderResult.lastInsertRowid);

    for (const item of payload.items) {
      insertOrderItem.run(
        orderId,
        item.menu_item_id ?? null,
        item.name,
        item.quantity,
        item.price,
      );
    }

    recordOrderStatusChange(orderId, payload.status, payload.userId ?? null, 'Order created');

    const orderRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    return orderRow;
  });

  return runTx({
    userId, customerName, customerPhone, customerEmail, deliveryType,
    deliveryAddress, couponCode, discountAmount, gstAmount, packingCharge, notes, source, status, items,
  });
}

const ADMIN_ORDER_STATUSES = ['pending', 'accepted', 'processing', 'preparing', 'ready', 'in_transit', 'completed', 'cancelled'];
const REVENUE_COUNTED_STATUS = 'completed';

function validateCouponForOrder(rawCode, itemsTotal) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, error: 'Enter a coupon code.' };
  }

  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(code);
  if (!coupon) {
    return { valid: false, error: 'Invalid or inactive coupon code.' };
  }

  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
    return { valid: false, error: 'This coupon has expired.' };
  }

  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, error: 'Coupon usage limit has been reached.' };
  }

  if (coupon.min_order_value && itemsTotal < coupon.min_order_value) {
    return { valid: false, error: `Minimum order of ₹${coupon.min_order_value} required for this coupon.` };
  }

  let discount = coupon.discount_type === 'percentage'
    ? (itemsTotal * coupon.discount_value) / 100
    : coupon.discount_value;

  if (coupon.max_discount) {
    discount = Math.min(discount, coupon.max_discount);
  }
  discount = Math.round(Math.min(discount, itemsTotal) * 100) / 100;

  return {
    valid: true,
    coupon: {
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
    },
    discount,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, dbPath });
});







// ── Admin Notifications ────────────────────────────────────────────────────

app.get('/api/admin/notifications', adminRequired, (_req, res) => {
  const notifications = db.prepare('SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 50').all();
  return res.json(notifications);
});

app.put('/api/admin/notifications/:id/read', adminRequired, (req, res) => {
  db.prepare('UPDATE admin_notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  return res.json({ success: true });
});

app.post('/api/orders/checkout', optionalAuth, (req, res) => {
  const cartItems = Array.isArray(req.body.cartItems) ? req.body.cartItems : [];
  const items = normalizeCheckoutItems(cartItems);

  if (items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty.' });
  }

  if (req.body.outlet !== 'Mathur') {
    return res.status(400).json({ error: 'Direct ordering is only available for the Mathur outlet.' });
  }

  const customerName = String(req.body.customerName || '').trim();
  const customerPhone = String(req.body.customerPhone || '').trim();
  const customerEmail = sanitizeEmail(req.body.customerEmail || '');
  const deliveryAddress = String(req.body.deliveryAddress || '').trim();
  const deliveryType = req.body.deliveryType === 'home_delivery' ? 'home_delivery' : 'store_pickup';
  const rawCouponCode = String(req.body.couponCode || '').trim();
  const notes = String(req.body.notes || '').trim();
  const gstAmount = Number(req.body.gstAmount || 0);
  // Direct orders never add packing or delivery fees, regardless of stale
  // client settings or a manipulated request payload.
  const packingCharge = 0;

  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let couponCode = null;
  let discountAmount = 0;
  if (rawCouponCode) {
    const couponResult = validateCouponForOrder(rawCouponCode, itemsTotal);
    if (!couponResult.valid) {
      return res.status(400).json({ error: couponResult.error });
    }
    couponCode = couponResult.coupon.code;
    discountAmount = couponResult.discount;
  }

  if (deliveryType === 'home_delivery' && !deliveryAddress) {
    return res.status(400).json({ error: 'Delivery address is required for home delivery.' });
  }

  const order = createOrderWithItems({
    userId: req.user?.id ?? null,
    customerName,
    customerPhone,
    customerEmail,
    deliveryType,
    deliveryAddress,
    couponCode,
    discountAmount,
    gstAmount: Number.isFinite(gstAmount) ? gstAmount : 0,
    packingCharge: Number.isFinite(packingCharge) ? packingCharge : 0,
    notes: notes || null,
    source: 'checkout',
    status: 'pending',
    items,
  });

  if (couponCode) {
    db.prepare('UPDATE coupons SET usage_count = usage_count + 1 WHERE code = ?').run(couponCode);
    const couponRow = db.prepare('SELECT id FROM coupons WHERE code = ?').get(couponCode);
    if (couponRow) {
      db.prepare(
        `INSERT INTO coupon_usage (coupon_id, order_id, user_id, discount_applied, used_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(couponRow.id, order.id, req.user?.id ?? null, discountAmount, new Date().toISOString());
    }
  }

  broadcastSSE('new_order', {
    orderId: order.id,
    orderNumber: order.order_number,
    status: order.status,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    total: order.total,
  });

  return res.status(201).json({ order });
});

app.post('/api/coupons/validate', (req, res) => {
  const code = String(req.body.code || '').trim();
  const subtotal = Number(req.body.subtotal || 0);

  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return res.status(400).json({ error: 'Invalid order subtotal.' });
  }

  const result = validateCouponForOrder(code, subtotal);
  if (!result.valid) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({ coupon: result.coupon, discount: result.discount });
});

app.post('/api/franchise-leads', (req, res) => {
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();
  const email = sanitizeEmail(req.body.email);
  const city = String(req.body.city || '').trim();
  const message = String(req.body.message || '').trim();

  if (!name) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  if (!phone || phone.length < 7) {
    return res.status(400).json({ error: 'Please enter a valid phone number.' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const createdAt = new Date().toISOString();
  const result = db.prepare(
    `INSERT INTO franchise_leads (name, phone, email, city, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(name, phone, email, city || null, message || null, createdAt);

  broadcastSSE('franchise_lead_created', { name, email, city });

  return res.status(201).json({
    lead: {
      id: Number(result.lastInsertRowid),
      name,
      phone,
      email,
      city: city || null,
      message: message || null,
      created_at: createdAt,
    },
  });
});

app.get('/api/reviews', (_req, res) => {
  const rawLimit = Number(_req.query.limit);
  const rawOffset = Number(_req.query.offset);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 30) : 12;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

  const rows = db.prepare(
    `SELECT id, name, location, avatar_url, phone, review_text, rating, created_at
     FROM reviews
     WHERE is_hidden = 0 OR is_hidden IS NULL
     ORDER BY rating DESC, created_at DESC
     LIMIT ? OFFSET ?`
  ).all(limit, offset);

  return res.json({ reviews: rows });
});

app.get('/api/admin/reviews', adminRequired, (_req, res) => {
  const rows = db.prepare(
    `SELECT id, name, location, avatar_url, phone, review_text, rating, is_hidden, created_at
     FROM reviews
     ORDER BY created_at DESC`
  ).all();
  return res.json({ reviews: rows });
});

app.post('/api/reviews', (req, res) => {
  const name = String(req.body.name || '').trim();
  const reviewText = sanitizeReviewText(req.body.review_text);
  const rating = Number(req.body.rating);
  const location = String(req.body.location || '').trim();
  const avatarUrl = String(req.body.avatar_url || '').trim();
  const phone = String(req.body.phone || '').trim();

  if (!name) {
    return res.status(400).json({ error: 'Customer name is required.' });
  }

  if (!reviewText) {
    return res.status(400).json({ error: 'Review message is required.' });
  }

  if (reviewText.length > 300) {
    return res.status(400).json({ error: 'Review message must be 300 characters or less.' });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
  }

  const tenMinutesAgoIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const duplicate = db.prepare(
    `SELECT id
     FROM reviews
     WHERE lower(name) = lower(?)
       AND review_text = ?
       AND created_at >= ?
     LIMIT 1`
  ).get(name, reviewText, tenMinutesAgoIso);

  if (duplicate) {
    return res.status(429).json({ error: 'Duplicate review detected. Please try again later.' });
  }

  const createdAt = new Date().toISOString();
  const result = db.prepare(
    `INSERT INTO reviews (name, location, avatar_url, phone, review_text, rating, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    name,
    location || null,
    avatarUrl || null,
    phone || null,
    reviewText,
    rating,
    createdAt,
  );

  broadcastSSE('review_submitted', { name, rating });

  return res.status(201).json({
    review: {
      id: Number(result.lastInsertRowid),
      name,
      location: location || null,
      avatar_url: avatarUrl || null,
      phone: phone || null,
      review_text: reviewText,
      rating,
      created_at: createdAt,
    },
  });
});

app.get('/api/orders/mine', authRequired, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ error: 'Only customer accounts can access this endpoint.' });
  }

  const rows = db.prepare(
    `SELECT
      o.id,
      o.order_number,
      o.total,
      o.status,
      o.delivery_type,
      o.delivery_address,
      o.coupon_code,
      o.discount_amount,
      o.gst_amount,
      o.packing_charge,
      o.notes,
      o.created_at,
      o.updated_at,
      oi.id AS order_item_id,
      oi.name AS item_name,
      oi.quantity AS item_quantity,
      oi.price AS item_price
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC, oi.id ASC`
  ).all(req.user.id);

  const orderMap = new Map();
  for (const row of rows) {
    if (!orderMap.has(row.id)) {
      orderMap.set(row.id, {
        id: String(row.id),
        order_number: row.order_number,
        total: Number(row.total),
        status: row.status,
        delivery_type: row.delivery_type,
        delivery_address: row.delivery_address,
        coupon_code: row.coupon_code,
        discount_amount: Number(row.discount_amount),
        gst_amount: Number(row.gst_amount || 0),
        packing_charge: Number(row.packing_charge || 0),
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
        order_items: [],
      });
    }

    if (row.order_item_id) {
      orderMap.get(row.id).order_items.push({
        id: String(row.order_item_id),
        name: row.item_name,
        quantity: Number(row.item_quantity),
        price: Number(row.item_price),
        subtotal: Number(row.item_price) * Number(row.item_quantity),
      });
    }
  }

  return res.json({ orders: Array.from(orderMap.values()) });
});

// Customer: status history for one of their orders
app.get('/api/orders/mine/:id/history', authRequired, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ error: 'Only customer accounts can access this endpoint.' });
  }

  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId)) return res.status(400).json({ error: 'Invalid order id.' });

  const order = db.prepare('SELECT id FROM orders WHERE id = ? AND user_id = ?').get(orderId, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const history = db.prepare(
    `SELECT previous_status, status, note, remarks, created_at
     FROM order_status_history
     WHERE order_id = ?
     ORDER BY created_at ASC`
  ).all(orderId);

  return res.json({ history });
});

// Customer: coupon usage history
app.get('/api/users/coupons', authRequired, (req, res) => {
  if (req.user.role !== 'user') return res.status(403).json({ error: 'Customer accounts only.' });

  const rows = db.prepare(
    `SELECT cu.id, c.code, c.discount_type, c.discount_value, cu.discount_applied, cu.used_at,
            o.order_number, o.total
     FROM coupon_usage cu
     LEFT JOIN coupons c ON c.id = cu.coupon_id
     LEFT JOIN orders o ON o.id = cu.order_id
     WHERE cu.user_id = ?
     ORDER BY cu.used_at DESC`
  ).all(req.user.id);

  return res.json({ coupons: rows });
});

// ── User Favorites API ────────────────────────────────────────────────────

app.get('/api/users/favorites', authRequired, (req, res) => {
  const rows = db.prepare(
    'SELECT id, menu_item_id, name, price, category, image_url, created_at FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  return res.json({ favorites: rows });
});

app.post('/api/users/favorites', authRequired, (req, res) => {
  const menuItemId = Number(req.body.menu_item_id);
  const name = String(req.body.name || '').trim();
  const price = Number(req.body.price);
  const category = req.body.category ? String(req.body.category).trim() : null;
  const imageUrl = req.body.image_url ? String(req.body.image_url).trim() : null;

  if (!name) return res.status(400).json({ error: 'Name is required.' });

  try {
    const result = db.prepare(
      `INSERT OR IGNORE INTO user_favorites (user_id, menu_item_id, name, price, category, image_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      req.user.id,
      Number.isInteger(menuItemId) ? menuItemId : null,
      name,
      Number.isFinite(price) ? price : 0,
      category,
      imageUrl,
      new Date().toISOString(),
    );
    const fav = db.prepare('SELECT * FROM user_favorites WHERE id = ?').get(result.lastInsertRowid);
    broadcastSSE('favorite_added', { userId: req.user.id, name });
    return res.status(201).json({ favorite: fav });
  } catch (err) {
    return res.status(409).json({ error: 'Already in favorites.' });
  }
});

app.delete('/api/users/favorites/:menu_item_id', authRequired, (req, res) => {
  const menuItemId = Number(req.params.menu_item_id);
  if (!Number.isInteger(menuItemId)) return res.status(400).json({ error: 'Invalid menu item id.' });

  db.prepare('DELETE FROM user_favorites WHERE user_id = ? AND menu_item_id = ?').run(req.user.id, menuItemId);
  return res.json({ success: true });
});

app.get('/api/pos/next-order-number', adminRequired, (_req, res) => {
  return res.json({ nextOrderNumber: getNextOrderNumber() });
});

app.post('/api/orders/generate', adminRequired, (req, res) => {
  const payloadItems = Array.isArray(req.body.items) ? req.body.items : [];
  if (payloadItems.length === 0) {
    return res.status(400).json({ error: 'Select at least one item.' });
  }

  const normalized = [];
  for (const rawItem of payloadItems) {
    const menuItemId = Number(rawItem.menu_item_id ?? rawItem.menuItemId);
    const quantity = Number(rawItem.quantity || 0);

    if (!Number.isInteger(menuItemId) || quantity <= 0) {
      continue;
    }

    const menuItem = db.prepare(
      `SELECT id, name, price
       FROM menu_items
       WHERE id = ?
         AND is_active = 1
         AND deleted_at IS NULL`
    ).get(menuItemId);

    if (!menuItem) {
      continue;
    }

    normalized.push({
      menu_item_id: menuItem.id,
      name: menuItem.name,
      quantity,
      price: Number(menuItem.price),
    });
  }

  if (normalized.length === 0) {
    return res.status(400).json({ error: 'No valid active menu items selected.' });
  }

  const order = createOrderWithItems({
    userId: null,
    customerName: null,
    customerPhone: null,
    deliveryAddress: null,
    source: 'pos',
    status: 'generated',
    items: normalized,
  });

  const orderItems = db.prepare(
    `SELECT id, name, quantity, price
     FROM order_items
     WHERE order_id = ?`
  ).all(order.id);

  return res.status(201).json({
    order: {
      ...order,
      items: orderItems,
    },
  });
});

app.post('/api/orders/:id/mark-paid', adminRequired, (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ error: 'Invalid order id.' });
  }

  const existing = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId);
  if (!existing) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  db.prepare(
    `UPDATE orders
     SET status = 'paid',
         paid_at = ?
     WHERE id = ?`
  ).run(new Date().toISOString(), orderId);

  const updated = db
    .prepare('SELECT id, order_number, total, status, created_at, paid_at FROM orders WHERE id = ?')
    .get(orderId);

  return res.json({ order: updated, nextOrderNumber: getNextOrderNumber() });
});

app.get('/api/admin/reports/daily', adminRequired, (_req, res) => {
  const totals = db.prepare(
    `SELECT
      COUNT(*) AS total_orders,
      COALESCE(SUM(total), 0) AS total_revenue
     FROM orders
     WHERE date(created_at, 'localtime') = date('now', 'localtime')
       AND status = ?`
  ).get(REVENUE_COUNTED_STATUS);

  const topItem = db.prepare(
    `SELECT
      oi.name,
      SUM(oi.quantity) AS qty
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     WHERE date(o.created_at, 'localtime') = date('now', 'localtime')
       AND o.status = 'completed'
     GROUP BY oi.name
     ORDER BY qty DESC
     LIMIT 1`
  ).get();

  return res.json({
    report: {
      totalOrdersToday: Number(totals.total_orders),
      totalRevenueToday: Number(totals.total_revenue),
      topSellingItem: topItem
        ? { name: topItem.name, quantity: Number(topItem.qty) }
        : null,
    },
  });
});

function getOrderWithItems(orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return null;
  const items = db.prepare(
    'SELECT id, name, quantity, price FROM order_items WHERE order_id = ?'
  ).all(orderId);
  return { ...order, items };
}

// ── Order Management ──────────────────────────────────────────────────────

app.get('/api/admin/orders', adminRequired, (req, res) => {
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const deliveryType = String(req.query.deliveryType || '').trim();
  const dateFrom = String(req.query.dateFrom || '').trim();
  const dateTo = String(req.query.dateTo || '').trim();
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));

  const where = [];
  const params = [];

  if (search) {
    where.push('(CAST(order_number AS TEXT) LIKE ? OR CAST(id AS TEXT) LIKE ? OR customer_phone LIKE ? OR customer_name LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (status) {
    const statuses = status.split(',').map((s) => s.trim()).filter(Boolean);
    if (statuses.length > 1) {
      where.push(`status IN (${statuses.map(() => '?').join(',')})`);
      params.push(...statuses);
    } else {
      where.push('status = ?');
      params.push(statuses[0]);
    }
  }
  if (deliveryType) {
    where.push('delivery_type = ?');
    params.push(deliveryType);
  }
  if (dateFrom) {
    where.push("date(created_at, 'localtime') >= date(?)");
    params.push(dateFrom);
  }
  if (dateTo) {
    where.push("date(created_at, 'localtime') <= date(?)");
    params.push(dateTo);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) AS count FROM orders ${whereSql}`).get(...params).count;

  const rows = db.prepare(
    `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, (page - 1) * pageSize);

  const orderIds = rows.map((r) => r.id);
  const itemsByOrder = new Map();
  if (orderIds.length > 0) {
    const placeholders = orderIds.map(() => '?').join(',');
    const itemRows = db.prepare(
      `SELECT order_id, id, name, quantity, price FROM order_items WHERE order_id IN (${placeholders})`
    ).all(...orderIds);
    for (const item of itemRows) {
      if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
      itemsByOrder.get(item.order_id).push(item);
    }
  }

  const orders = rows.map((order) => ({ ...order, items: itemsByOrder.get(order.id) || [] }));

  return res.json({ orders, total, page, pageSize });
});

app.get('/api/admin/orders/:id', adminRequired, (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ error: 'Invalid order id.' });
  }

  const order = getOrderWithItems(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const history = db.prepare(
    `SELECT h.previous_status, h.status, h.note, h.remarks, h.created_at,
            u.name AS admin_name, u.email AS admin_email
     FROM order_status_history h
     LEFT JOIN users u ON u.id = h.admin_id
     WHERE h.order_id = ?
     ORDER BY h.created_at ASC`
  ).all(orderId);

  return res.json({ order, history });
});

// Duplicate an existing order (Phase 3 — Admin Quick Action)
app.post('/api/admin/orders/:id/duplicate', adminRequired, (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId)) return res.status(400).json({ error: 'Invalid order id.' });

  const source = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!source) return res.status(404).json({ error: 'Order not found.' });

  const sourceItems = db.prepare('SELECT name, price, quantity, menu_item_id FROM order_items WHERE order_id = ?').all(orderId);
  if (!sourceItems.length) return res.status(400).json({ error: 'Source order has no items.' });

  const newOrder = createOrderWithItems({
    userId: source.user_id,
    customerName: source.customer_name,
    customerPhone: source.customer_phone,
    customerEmail: source.customer_email,
    deliveryType: source.delivery_type,
    deliveryAddress: source.delivery_address,
    couponCode: null,
    discountAmount: 0,
    gstAmount: 0,
    packingCharge: 0,
    notes: source.notes,
    source: 'admin_duplicate',
    status: 'pending',
    items: sourceItems,
  });

  logActivity(req.user.id, 'duplicate_order', 'order', newOrder.id, { sourceOrderId: orderId });
  broadcastSSE('new_order', {
    orderId: newOrder.id,
    orderNumber: newOrder.order_number,
    status: newOrder.status,
    customerName: newOrder.customer_name,
    customerPhone: newOrder.customer_phone,
    total: newOrder.total,
  });

  const newOrderWithItems = getOrderWithItems(newOrder.id);
  return res.status(201).json({ order: newOrderWithItems });
});

app.patch('/api/admin/orders/:id/status', adminRequired, (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ error: 'Invalid order id.' });
  }

  const nextStatus = String(req.body.status || '').trim();
  if (!ADMIN_ORDER_STATUSES.includes(nextStatus)) {
    return res.status(400).json({ error: `Status must be one of: ${ADMIN_ORDER_STATUSES.join(', ')}` });
  }

  const existing = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(orderId);
  if (!existing) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const previousStatus = existing.status;

  const ALLOWED_TRANSITIONS = {
    pending: ['accepted', 'processing', 'preparing', 'cancelled'],
    accepted: ['processing', 'preparing', 'ready', 'cancelled'],
    processing: ['preparing', 'ready', 'in_transit', 'cancelled'],
    preparing: ['ready', 'in_transit', 'cancelled'],
    ready: ['in_transit', 'completed', 'cancelled'],
    in_transit: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  if (previousStatus !== nextStatus) {
    const validNextStatuses = ALLOWED_TRANSITIONS[previousStatus] || [];
    if (!validNextStatuses.includes(nextStatus)) {
      return res.status(400).json({ error: `Invalid status transition from ${previousStatus} to ${nextStatus}.` });
    }
  }

  const now = new Date().toISOString();
  const remarks = req.body.remarks ? String(req.body.remarks) : null;
  db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, orderId);
  recordOrderStatusChange(
    orderId, nextStatus, req.user.id,
    req.body.note ? String(req.body.note) : null,
    previousStatus,
    remarks,
  );
  logActivity(req.user.id, 'update_order_status', 'order', orderId, { from: previousStatus, to: nextStatus });

  // Broadcast to all admins
  const orderForBroadcast = db.prepare('SELECT order_number, user_id, customer_name FROM orders WHERE id = ?').get(orderId);
  broadcastSSE('order_status', {
    orderId,
    orderNumber: orderForBroadcast?.order_number,
    status: nextStatus,
    previousStatus,
    customerName: orderForBroadcast?.customer_name,
  });

  // Broadcast to the specific customer if they're connected
  if (orderForBroadcast?.user_id) {
    broadcastSSEToUser(orderForBroadcast.user_id, 'order_status', {
      orderId,
      status: nextStatus,
      previousStatus,
    });
  }

  const order = getOrderWithItems(orderId);
  return res.json({ order });
});

// ── Admin Dashboard ────────────────────────────────────────────────────────

app.get('/api/admin/dashboard/summary', adminRequired, (_req, res) => {
  const countByDate = (sqlDateExpr) => db.prepare(
    `SELECT COUNT(*) AS count FROM orders WHERE date(created_at, 'localtime') = date(${sqlDateExpr}, 'localtime')`
  ).get().count;

  const todaysOrders = countByDate("'now'");
  const yesterdayOrders = countByDate("'now', '-1 day'");
  const weeklyOrders = db.prepare(
    `SELECT COUNT(*) AS count FROM orders WHERE date(created_at, 'localtime') >= date('now', '-6 days')`
  ).get().count;

  // All-time status counts (for sidebar badges and main dashboard)
  const statusCountsRaw = db.prepare(
    `SELECT status, COUNT(*) AS count FROM orders GROUP BY status`
  ).all();
  const statusCounts = { pending: 0, processing: 0, in_transit: 0, completed: 0, cancelled: 0 };
  for (const row of statusCountsRaw) {
    statusCounts[row.status] = row.count;
  }

  // Today's status breakdown (for live operations strip)
  const todayStatusCountsRaw = db.prepare(
    `SELECT status, COUNT(*) AS count FROM orders
     WHERE date(created_at, 'localtime') = date('now', 'localtime')
     GROUP BY status`
  ).all();
  const todayStatusCounts = { pending: 0, processing: 0, in_transit: 0, completed: 0, cancelled: 0 };
  for (const row of todayStatusCountsRaw) {
    todayStatusCounts[row.status] = row.count;
  }

  const revenueSince = (sqlDateExpr) => db.prepare(
    `SELECT COALESCE(SUM(total), 0) AS revenue
     FROM orders
     WHERE status = ? AND date(created_at, 'localtime') >= date(${sqlDateExpr}, 'localtime')`
  ).get(REVENUE_COUNTED_STATUS).revenue;
  
  const revenueOnDate = (sqlDateExpr) => db.prepare(
    `SELECT COALESCE(SUM(total), 0) AS revenue
     FROM orders
     WHERE status = ? AND date(created_at, 'localtime') = date(${sqlDateExpr}, 'localtime')`
  ).get(REVENUE_COUNTED_STATUS).revenue;

  const todaysRevenue = revenueOnDate("'now'");
  const yesterdayRevenue = revenueOnDate("'now', '-1 day'");
  const weeklyRevenue = revenueSince("'now', '-6 days'");
  const monthlyRevenue = revenueSince("'now', 'start of month'");

  // Average order value for completed orders this month
  const avgRow = db.prepare(
    `SELECT AVG(total) AS avg FROM orders
     WHERE status = ? AND date(created_at, 'localtime') >= date('now', 'start of month')`
  ).get(REVENUE_COUNTED_STATUS);
  const avgOrderValue = Math.round((avgRow?.avg || 0) * 100) / 100;

  // Repeat Customers (Total all time)
  const repeatCustomersCount = db.prepare(
    `SELECT COUNT(*) as count FROM (
      SELECT customer_phone, COUNT(*) AS orders
      FROM orders
      WHERE customer_phone IS NOT NULL AND customer_phone != ''
      GROUP BY customer_phone
      HAVING COUNT(*) > 1
    )`
  ).get().count;

  // New customers today
  const newCustomersToday = db.prepare(
    `SELECT COUNT(DISTINCT o.customer_phone) AS count
     FROM orders o
     WHERE o.customer_phone IS NOT NULL
       AND date(o.created_at, 'localtime') = date('now', 'localtime')
       AND NOT EXISTS (
         SELECT 1 FROM orders o2
         WHERE o2.customer_phone = o.customer_phone
           AND date(o2.created_at, 'localtime') < date('now', 'localtime')
       )`
  ).get().count;

  // Returning customers today
  const returningCustomersToday = db.prepare(
    `SELECT COUNT(DISTINCT o.customer_phone) AS count
     FROM orders o
     WHERE o.customer_phone IS NOT NULL
       AND date(o.created_at, 'localtime') = date('now', 'localtime')
       AND EXISTS (
         SELECT 1 FROM orders o2
         WHERE o2.customer_phone = o.customer_phone
           AND date(o2.created_at, 'localtime') < date('now', 'localtime')
       )`
  ).get().count;

  const todayReviews = db.prepare(
    `SELECT COUNT(*) AS count FROM reviews 
     WHERE date(created_at, 'localtime') = date('now', 'localtime')`
  ).get().count;

  const franchiseEnquiries = db.prepare(
    `SELECT COUNT(*) AS count FROM franchise_leads 
     WHERE date(created_at, 'localtime') = date('now', 'localtime')`
  ).get().count;

  const couponUsageToday = db.prepare(
    `SELECT COUNT(*) AS count FROM orders 
     WHERE coupon_code IS NOT NULL AND coupon_code != '' 
     AND date(created_at, 'localtime') = date('now', 'localtime')`
  ).get().count;

  const bestSellingProductRow = db.prepare(
    `SELECT oi.name, SUM(oi.quantity) as qty
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE date(o.created_at, 'localtime') >= date('now', 'start of month')
     GROUP BY oi.name
     ORDER BY qty DESC LIMIT 1`
  ).get();
  const bestSellingProduct = bestSellingProductRow ? bestSellingProductRow.name : 'None';

  const peakOrderingTimeRow = db.prepare(
    `SELECT strftime('%H', created_at, 'localtime') as hour, COUNT(*) as count
     FROM orders
     WHERE date(created_at, 'localtime') >= date('now', '-30 days')
     GROUP BY hour
     ORDER BY count DESC LIMIT 1`
  ).get();
  const peakOrderingTime = peakOrderingTimeRow ? `${peakOrderingTimeRow.hour}:00` : 'N/A';

  // Recent 20 orders with their items (for live operations feed)
  const recentOrders = db.prepare(
    `SELECT o.id, o.order_number, o.customer_name, o.customer_phone, o.customer_email,
            o.delivery_type, o.delivery_address, o.status, o.total, o.discount_amount,
            o.coupon_code, o.created_at, o.updated_at,
            (SELECT json_group_array(
               json_object('name', oi.name, 'quantity', oi.quantity, 'price', oi.price)
             ) FROM order_items oi WHERE oi.order_id = o.id) AS items_json
     FROM orders o
     ORDER BY o.created_at DESC LIMIT 20`
  ).all().map((o) => {
    try { o.items = JSON.parse(o.items_json || '[]'); } catch { o.items = []; }
    delete o.items_json;
    return o;
  });

  // Recent 5 reviews for the overview feed
  const recentReviews = db.prepare(
    `SELECT id, name, rating, review_text, created_at
     FROM reviews WHERE is_hidden = 0 ORDER BY created_at DESC LIMIT 5`
  ).all();

  // Recent 5 franchise leads for the overview feed
  const recentLeads = db.prepare(
    `SELECT id, name, phone, city, created_at FROM franchise_leads ORDER BY created_at DESC LIMIT 5`
  ).all();

  return res.json({
    cards: {
      todaysOrders,
      yesterdayOrders,
      weeklyOrders,
      pendingOrders: statusCounts.pending || 0,
      processingOrders: statusCounts.processing || 0,
      inTransitOrders: statusCounts.in_transit || 0,
      completedOrders: statusCounts.completed || 0,
      cancelledOrders: statusCounts.cancelled || 0,
      todaysRevenue,
      yesterdayRevenue,
      weeklyRevenue,
      monthlyRevenue,
      avgOrderValue,
      repeatCustomersCount,
      newCustomersToday,
      returningCustomersToday,
      todayReviews,
      franchiseEnquiries,
      couponUsageToday,
      bestSellingProduct,
      peakOrderingTime,
      completedToday: todayStatusCounts.completed || 0,
      cancelledToday: todayStatusCounts.cancelled || 0,
    },
    recentOrders,
    recentReviews,
    recentLeads,
    generatedAt: new Date().toISOString(),
  });
});

// ── Customer Management ────────────────────────────────────────────────────

app.get('/api/admin/customers', adminRequired, (req, res) => {
  const search = String(req.query.search || '').trim();

  const where = [];
  const params = [];
  where.push("(customer_phone IS NOT NULL AND customer_phone != '')");
  if (search) {
    where.push('(customer_phone LIKE ? OR customer_email LIKE ? OR customer_name LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const rows = db.prepare(
    `SELECT
      customer_phone AS phone,
      MAX(customer_name) AS name,
      MAX(customer_email) AS email,
      COUNT(*) AS order_count,
      COALESCE(SUM(CASE WHEN status = '${REVENUE_COUNTED_STATUS}' THEN total ELSE 0 END), 0) AS total_spend,
      MAX(created_at) AS last_order_date
     FROM orders
     WHERE ${where.join(' AND ')}
     GROUP BY customer_phone
     ORDER BY last_order_date DESC`
  ).all(...params);

  return res.json({ customers: rows });
});

app.get('/api/admin/customers/:phone/detail', adminRequired, (req, res) => {
  const phone = String(req.params.phone || '').trim();
  if (!phone) {
    return res.status(400).json({ error: 'Phone is required.' });
  }

  const orders = db.prepare(
    `SELECT id, order_number, status, total, discount_amount, coupon_code, created_at
     FROM orders WHERE customer_phone = ? ORDER BY created_at DESC`
  ).all(phone);

  if (orders.length === 0) {
    return res.status(404).json({ error: 'Customer not found.' });
  }

  const profile = {
    phone,
    name: db.prepare('SELECT customer_name FROM orders WHERE customer_phone = ? AND customer_name IS NOT NULL ORDER BY created_at DESC LIMIT 1').get(phone)?.customer_name || null,
    email: db.prepare('SELECT customer_email FROM orders WHERE customer_phone = ? AND customer_email IS NOT NULL ORDER BY created_at DESC LIMIT 1').get(phone)?.customer_email || null,
  };

  const lifetimeSpend = orders
    .filter((o) => o.status === REVENUE_COUNTED_STATUS)
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const orderIds = orders.map((o) => o.id);
  const placeholders = orderIds.map(() => '?').join(',');

  const couponsUsed = orderIds.length > 0 ? db.prepare(
    `SELECT cu.id, cu.discount_applied, cu.used_at, c.code, c.discount_type, c.discount_value
     FROM coupon_usage cu
     JOIN coupons c ON c.id = cu.coupon_id
     WHERE cu.order_id IN (${placeholders})
     ORDER BY cu.used_at DESC`
  ).all(...orderIds) : [];

  const reviews = db.prepare(
    'SELECT id, rating, review_text, created_at FROM reviews WHERE phone = ? ORDER BY created_at DESC'
  ).all(phone);

  const user = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  const savedAddresses = user ? db.prepare(
    'SELECT id, label, address, is_default, created_at FROM saved_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC'
  ).all(user.id) : [];

  return res.json({
    profile,
    orders,
    lifetimeSpend,
    orderCount: orders.length,
    repeatCustomer: orders.length > 1,
    couponsUsed,
    reviews,
    savedAddresses,
  });
});

// ── Menu Management (visibility + bestseller) ──────────────────────────────

app.patch('/api/admin/menu-items/:id/hide', adminRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid item id.' });
  }

  const existing = db.prepare('SELECT id, is_active FROM menu_items WHERE id = ? AND deleted_at IS NULL').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Menu item not found.' });
  }

  const nextActive = existing.is_active ? 0 : 1;
  db.prepare('UPDATE menu_items SET is_active = ?, updated_at = ? WHERE id = ?')
    .run(nextActive, new Date().toISOString(), id);

  const item = db.prepare(
    'SELECT id, name, price, category, image_url, is_bestseller, is_active FROM menu_items WHERE id = ?'
  ).get(id);

  return res.json({ item });
});

// ── Coupon Management ──────────────────────────────────────────────────────

app.get('/api/admin/coupons', adminRequired, (_req, res) => {
  const coupons = db.prepare(`
    SELECT c.*,
           COUNT(o.id) as total_usage,
           COALESCE(SUM(o.total), 0) as revenue_generated,
           COALESCE(SUM(o.discount_amount), 0) as discount_given
    FROM coupons c
    LEFT JOIN orders o ON o.coupon_code = c.code AND o.status = ?
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all(REVENUE_COUNTED_STATUS);
  return res.json({ coupons });
});

function validateCouponPayload(body) {
  const code = String(body.code || '').trim().toUpperCase();
  const discountType = body.discount_type === 'fixed' ? 'fixed' : 'percentage';
  const discountValue = Number(body.discount_value);
  const minOrderValue = Number(body.min_order_value || 0);
  const maxDiscount = body.max_discount === undefined || body.max_discount === null || body.max_discount === ''
    ? null
    : Number(body.max_discount);
  const expiryDate = body.expiry_date ? String(body.expiry_date) : null;
  const usageLimit = body.usage_limit === undefined || body.usage_limit === null || body.usage_limit === ''
    ? null
    : Number(body.usage_limit);

  if (!code) return { error: 'Coupon code is required.' };
  if (!Number.isFinite(discountValue) || discountValue <= 0) return { error: 'Discount value must be greater than 0.' };
  if (discountType === 'percentage' && discountValue > 100) return { error: 'Percentage discount cannot exceed 100.' };
  if (!Number.isFinite(minOrderValue) || minOrderValue < 0) return { error: 'Minimum order value must be 0 or more.' };

  return { value: { code, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit } };
}

app.post('/api/admin/coupons', adminRequired, (req, res) => {
  const { value, error } = validateCouponPayload(req.body);
  if (error) return res.status(400).json({ error });

  const existing = db.prepare('SELECT id FROM coupons WHERE code = ?').get(value.code);
  if (existing) {
    return res.status(409).json({ error: `Coupon code "${value.code}" already exists.` });
  }

  const now = new Date().toISOString();
  const result = db.prepare(
    `INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, expiry_date, usage_limit, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(value.code, value.discountType, value.discountValue, value.minOrderValue, value.maxDiscount, value.expiryDate, value.usageLimit, now, now);

  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(result.lastInsertRowid);
  logActivity(req.user?.id, 'create_coupon', 'coupon', coupon.id, { code: coupon.code });
  
  broadcastSSE('coupon_created', { code: coupon.code });
  
  return res.status(201).json({ coupon });
});

app.put('/api/admin/coupons/:id', adminRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid coupon id.' });

  const existing = db.prepare('SELECT id FROM coupons WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Coupon not found.' });

  const { value, error } = validateCouponPayload(req.body);
  if (error) return res.status(400).json({ error });

  const duplicate = db.prepare('SELECT id FROM coupons WHERE code = ? AND id != ?').get(value.code, id);
  if (duplicate) {
    return res.status(409).json({ error: `Coupon code "${value.code}" already exists.` });
  }

  db.prepare(
    `UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?, min_order_value = ?,
      max_discount = ?, expiry_date = ?, usage_limit = ?, updated_at = ? WHERE id = ?`
  ).run(value.code, value.discountType, value.discountValue, value.minOrderValue, value.maxDiscount, value.expiryDate, value.usageLimit, new Date().toISOString(), id);

  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
  logActivity(req.user?.id, 'update_coupon', 'coupon', id, { code: coupon.code });
  return res.json({ coupon });
});

app.patch('/api/admin/coupons/:id/disable', adminRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid coupon id.' });

  const existing = db.prepare('SELECT id, is_active FROM coupons WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Coupon not found.' });

  const nextActive = existing.is_active ? 0 : 1;
  db.prepare('UPDATE coupons SET is_active = ?, updated_at = ? WHERE id = ?')
    .run(nextActive, new Date().toISOString(), id);

  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
  logActivity(req.user?.id, coupon.is_active ? 'enable_coupon' : 'disable_coupon', 'coupon', id, { code: coupon.code });
  return res.json({ coupon });
});

app.delete('/api/admin/coupons/:id', adminRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid coupon id.' });

  const existing = db.prepare('SELECT id FROM coupons WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Coupon not found.' });

  db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
  logActivity(req.user?.id, 'delete_coupon', 'coupon', id, {});
  return res.json({ success: true });
});

// ── Reviews Management (admin) ────────────────────────────────────────────────

app.patch('/api/admin/reviews/:id/hide', adminRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid review id.' });

  const existing = db.prepare('SELECT id, is_hidden FROM reviews WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Review not found.' });

  const nextHidden = existing.is_hidden ? 0 : 1;
  db.prepare('UPDATE reviews SET is_hidden = ? WHERE id = ?').run(nextHidden, id);
  logActivity(req.user?.id, nextHidden ? 'hide_review' : 'show_review', 'review', id, {});

  return res.json({ success: true, is_hidden: nextHidden });
});

app.delete('/api/admin/reviews/:id', adminRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid review id.' });

  const existing = db.prepare('SELECT id FROM reviews WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Review not found.' });

  db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  logActivity(req.user?.id, 'delete_review', 'review', id, {});
  return res.json({ success: true });
});

// ── Franchise Leads (admin) ────────────────────────────────────────────────

app.get('/api/admin/franchise-leads', adminRequired, (req, res) => {
  const search = String(req.query.search || '').trim();
  const where = [];
  const params = [];
  if (search) {
    where.push('(name LIKE ? OR phone LIKE ? OR email LIKE ? OR city LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const leads = db.prepare(
    `SELECT id, name, phone, email, city, message, created_at FROM franchise_leads ${whereSql} ORDER BY created_at DESC`
  ).all(...params);

  return res.json({ leads });
});

app.get('/api/admin/franchise-leads/export', adminRequired, (req, res) => {
  const format = req.query.format === 'excel' ? 'excel' : 'csv';
  const leads = db.prepare(
    'SELECT name, phone, email, city, message, created_at FROM franchise_leads ORDER BY created_at DESC'
  ).all();

  const rows = leads.map((lead) => ({
    Name: lead.name,
    Phone: lead.phone,
    Email: lead.email,
    City: lead.city || '',
    Message: lead.message || '',
    Date: lead.created_at,
  }));

  return sendExport(res, rows, 'franchise-leads', format);
});

// ── Analytics ───────────────────────────────────────────────────────────────

app.get('/api/admin/analytics', adminRequired, (req, res) => {
  const { sqlClause, params } = getDateRangeSql(req.query, 'created_at');
  
  const whereSql = `WHERE status = '${REVENUE_COUNTED_STATUS}' AND ${sqlClause}`;

  const revenueByDay = db.prepare(
    `SELECT date(created_at, 'localtime') AS day, SUM(total) AS revenue, COUNT(*) AS orders
     FROM orders ${whereSql} GROUP BY day ORDER BY day ASC`
  ).all(...params);

  const revenueByWeek = db.prepare(
    `SELECT strftime('%Y-W%W', created_at, 'localtime') AS week, SUM(total) AS revenue, COUNT(*) AS orders
     FROM orders ${whereSql} GROUP BY week ORDER BY week ASC`
  ).all(...params);

  const revenueByMonth = db.prepare(
    `SELECT strftime('%Y-%m', created_at, 'localtime') AS month, SUM(total) AS revenue, COUNT(*) AS orders
     FROM orders ${whereSql} GROUP BY month ORDER BY month ASC`
  ).all(...params);

  const ordersByHour = db.prepare(
    `SELECT strftime('%H', created_at, 'localtime') AS hour, COUNT(*) AS orders, SUM(total) AS revenue
     FROM orders ${whereSql} GROUP BY hour ORDER BY hour ASC`
  ).all(...params);

  const topProducts = db.prepare(
    `SELECT oi.name, SUM(oi.quantity) AS qty, SUM(oi.quantity * oi.price) AS revenue
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     ${whereSql.replace('created_at', 'o.created_at').replace('status', 'o.status')}
     GROUP BY oi.name ORDER BY qty DESC LIMIT 10`
  ).all(...params);

  const totalCustomers = db.prepare(
    `SELECT customer_phone, COUNT(*) AS orders FROM orders ${whereSql} AND customer_phone IS NOT NULL AND customer_phone != '' GROUP BY customer_phone`
  ).all(...params);
  
  const returningCustomers = totalCustomers.filter((c) => c.orders > 1).length;
  const newCustomers = totalCustomers.filter((c) => c.orders === 1).length;
  const repeatOrderRate = totalCustomers.length > 0
    ? Math.round((returningCustomers / totalCustomers.length) * 1000) / 10
    : 0;

  const couponStats = db.prepare(
    `SELECT coupon_code, COUNT(*) AS uses, SUM(discount_amount) AS total_discount, SUM(total) AS revenue_with_coupon
     FROM orders ${whereSql} AND coupon_code IS NOT NULL GROUP BY coupon_code ORDER BY uses DESC`
  ).all(...params);

  const ordersByType = db.prepare(
    `SELECT delivery_type, COUNT(*) AS orders, SUM(total) AS revenue
     FROM orders ${whereSql} GROUP BY delivery_type`
  ).all(...params);

  // KPIs calculation
  let totalRevenue = 0;
  let totalOrders = 0;
  for (const day of revenueByDay) {
    totalRevenue += Number(day.revenue || 0);
    totalOrders += Number(day.orders || 0);
  }
  const avgValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  let itemsSold = 0;
  for (const prod of topProducts) {
    itemsSold += Number(prod.qty || 0);
  }

  return res.json({
    kpis: {
      totalRevenue,
      totalOrders,
      avgValue,
      itemsSold,
      returningCustomers,
      repeatOrderRate,
    },
    revenueByDay,
    revenueByWeek,
    revenueByMonth,
    ordersByHour,
    ordersByType,
    topProducts,
    customerAnalytics: { returningCustomers, newCustomers, repeatOrderRate, totalCustomers: totalCustomers.length },
    couponAnalytics: couponStats,
  });
});

// ── Reports & Exports ───────────────────────────────────────────────────────

function sendExport(res, rows, filename, format) {
  if (rows.length === 0) {
    return res.status(404).json({ error: 'No data available to export for this range.' });
  }

  if (format === 'excel') {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    return res.send(buffer);
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(',')];
  for (const row of rows) {
    csvLines.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  return res.send('﻿' + csvLines.join('\n'));
}

app.get('/api/admin/reports/export', adminRequired, (req, res) => {
  const type = String(req.query.type || 'orders');
  const format = req.query.format === 'excel' ? 'excel' : 'csv';
  
  const { sqlClause, params: dateParams } = getDateRangeSql(req.query, 'created_at');
  const dateWhereSql = sqlClause !== '1=1' ? `WHERE ${sqlClause}` : '';
  const dateWhereSqlO = sqlClause !== '1=1' ? `WHERE ${sqlClause.replace(/created_at/g, 'o.created_at')}` : '';

  if (type === 'orders') {
    const rows = db.prepare(
      `SELECT order_number, customer_name, customer_phone, delivery_type, status, total, discount_amount, coupon_code, created_at
       FROM orders ${dateWhereSql} ORDER BY created_at DESC`
    ).all(...dateParams).map((o) => ({
      'Order #': o.order_number,
      Customer: o.customer_name,
      Phone: o.customer_phone,
      'Delivery Type': o.delivery_type,
      Status: o.status,
      Total: o.total,
      Discount: o.discount_amount,
      Coupon: o.coupon_code || '',
      Date: o.created_at,
    }));
    return sendExport(res, rows, 'orders-report', format);
  }

  if (type === 'revenue') {
    const completedWhere = dateWhereSql
      ? `${dateWhereSql} AND status = '${REVENUE_COUNTED_STATUS}'`
      : `WHERE status = '${REVENUE_COUNTED_STATUS}'`;
    const rows = db.prepare(
      `SELECT date(created_at, 'localtime') AS day, COUNT(*) AS orders, SUM(total) AS revenue
       FROM orders ${completedWhere} GROUP BY day ORDER BY day DESC`
    ).all(...dateParams).map((r) => ({ Date: r.day, Orders: r.orders, Revenue: r.revenue }));
    return sendExport(res, rows, 'revenue-report', format);
  }

  if (type === 'products') {
    const completedWhere = dateWhereSqlO
      ? `${dateWhereSqlO} AND o.status = '${REVENUE_COUNTED_STATUS}'`
      : `WHERE o.status = '${REVENUE_COUNTED_STATUS}'`;
    const rows = db.prepare(
      `SELECT oi.name, SUM(oi.quantity) AS qty, SUM(oi.quantity * oi.price) AS revenue
       FROM order_items oi INNER JOIN orders o ON o.id = oi.order_id
       ${completedWhere} GROUP BY oi.name ORDER BY revenue DESC`
    ).all(...dateParams).map((r) => ({ Product: r.name, 'Quantity Sold': r.qty, Revenue: r.revenue }));
    return sendExport(res, rows, 'products-report', format);
  }

  if (type === 'customers') {
    // For customers, the date filter typically applies to when their orders were placed.
    // We filter orders by dateWhereSql, and optionally consider only completed for spend.
    const rows = db.prepare(
      `SELECT customer_phone AS phone, MAX(customer_name) AS name, MAX(customer_email) AS email,
        COUNT(*) AS order_count, SUM(CASE WHEN status = '${REVENUE_COUNTED_STATUS}' THEN total ELSE 0 END) AS total_spend,
        MAX(created_at) AS last_order_date
       FROM orders
       ${dateWhereSql}
       ${dateWhereSql ? 'AND' : 'WHERE'} customer_phone IS NOT NULL AND customer_phone != ''
       GROUP BY customer_phone ORDER BY total_spend DESC`
    ).all(...dateParams).map((c) => ({
      Phone: c.phone, Name: c.name || '', Email: c.email || '',
      'Order Count': c.order_count, 'Total Spend': c.total_spend, 'Last Order': c.last_order_date,
    }));
    return sendExport(res, rows, 'customers-report', format);
  }

  return res.status(400).json({ error: 'type must be one of: orders, revenue, products, customers' });
});

// ── Saved Addresses ──────────────────────────────────────────────────────

app.get('/api/users/addresses', authRequired, (req, res) => {
  const rows = db.prepare(
    'SELECT id, label, address_line, city, pincode, is_default FROM saved_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC'
  ).all(req.user.id);
  return res.json({ addresses: rows });
});

app.post('/api/users/addresses', authRequired, (req, res) => {
  const label = String(req.body.label || 'Home').trim();
  const addressLine = String(req.body.address_line || '').trim();
  const city = String(req.body.city || '').trim();
  const pincode = String(req.body.pincode || '').trim();
  const isDefault = req.body.is_default ? 1 : 0;

  if (!addressLine) return res.status(400).json({ error: 'Address line is required.' });

  const now = new Date().toISOString();
  if (isDefault) {
    db.prepare('UPDATE saved_addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  }

  const result = db.prepare(
    'INSERT INTO saved_addresses (user_id, label, address_line, city, pincode, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.user.id, label, addressLine, city || null, pincode || null, isDefault, now);

  const address = db.prepare('SELECT * FROM saved_addresses WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ address });
});

app.patch('/api/users/addresses/:id/default', authRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid address id.' });

  const existing = db.prepare('SELECT id FROM saved_addresses WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Address not found.' });

  db.prepare('UPDATE saved_addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  db.prepare('UPDATE saved_addresses SET is_default = 1 WHERE id = ?').run(id);
  return res.json({ success: true });
});

app.delete('/api/users/addresses/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid address id.' });

  const existing = db.prepare('SELECT id FROM saved_addresses WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Address not found.' });

  db.prepare('DELETE FROM saved_addresses WHERE id = ?').run(id);
  return res.json({ success: true });
});

// ── Branches ─────────────────────────────────────────────────────────────

app.get('/api/branches', (_req, res) => {
  const rows = db.prepare(
    'SELECT id, name, address, phone, city, is_active, google_maps_url, swiggy_url, zomato_url FROM branches WHERE is_active = 1 ORDER BY id ASC'
  ).all();
  return res.json({ branches: rows });
});

app.get('/api/admin/branches', adminRequired, (_req, res) => {
  const rows = db.prepare('SELECT * FROM branches ORDER BY id ASC').all();
  return res.json({ branches: rows });
});

app.post('/api/admin/branches', adminRequired, (req, res) => {
  const name = String(req.body.name || '').trim();
  const address = String(req.body.address || '').trim();
  const phone = String(req.body.phone || '').trim();
  const city = String(req.body.city || '').trim();
  if (!name || !address) return res.status(400).json({ error: 'Name and address are required.' });

  const now = new Date().toISOString();
  const result = db.prepare(
    `INSERT INTO branches (name, address, phone, city, is_active, google_maps_url, swiggy_url, zomato_url, created_at)
     VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)`
  ).run(
    name, address, phone || null, city || null,
    req.body.google_maps_url || null, req.body.swiggy_url || null, req.body.zomato_url || null,
    now,
  );
  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(result.lastInsertRowid);
  logActivity(req.user?.id, 'create_branch', 'branch', branch.id, { name: branch.name });
  return res.status(201).json({ branch });
});

app.put('/api/admin/branches/:id', adminRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid branch id.' });

  const existing = db.prepare('SELECT id FROM branches WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Branch not found.' });

  const name = String(req.body.name || '').trim();
  const address = String(req.body.address || '').trim();
  if (!name || !address) return res.status(400).json({ error: 'Name and address are required.' });

  db.prepare(
    `UPDATE branches SET name = ?, address = ?, phone = ?, city = ?, is_active = ?,
     google_maps_url = ?, swiggy_url = ?, zomato_url = ?, updated_at = ? WHERE id = ?`
  ).run(
    name, address,
    String(req.body.phone || '').trim() || null,
    String(req.body.city || '').trim() || null,
    req.body.is_active !== undefined ? Number(Boolean(req.body.is_active)) : 1,
    req.body.google_maps_url || null, req.body.swiggy_url || null, req.body.zomato_url || null,
    new Date().toISOString(), id,
  );
  const branch = db.prepare('SELECT * FROM branches WHERE id = ?').get(id);
  logActivity(req.user?.id, 'update_branch', 'branch', id, { name: branch.name });
  return res.json({ branch });
});

// ── Full Analytics ────────────────────────────────────────────────────────

app.get('/api/admin/analytics/full', adminRequired, (req, res) => {
  const { sqlClause, params } = getDateRangeSql(req.query, 'created_at');
  
  const allSql = `WHERE ${sqlClause}`;
  const revSql = `WHERE status = '${REVENUE_COUNTED_STATUS}' AND ${sqlClause}`;
  const revSqlO = revSql.replace(/created_at/g, 'o.created_at').replace(/status/g, 'o.status');

  const dailyRevenue = db.prepare(
    `SELECT date(created_at, 'localtime') AS date, SUM(total) AS revenue, COUNT(*) AS orders
     FROM orders ${revSql} GROUP BY date ORDER BY date ASC`
  ).all(...params);

  const weeklyRevenue = db.prepare(
    `SELECT strftime('%Y-W%W', created_at, 'localtime') AS week, SUM(total) AS revenue, COUNT(*) AS orders
     FROM orders ${revSql} GROUP BY week ORDER BY week ASC`
  ).all(...params);

  const monthlyRevenue = db.prepare(
    `SELECT strftime('%Y-%m', created_at, 'localtime') AS month, SUM(total) AS revenue, COUNT(*) AS orders
     FROM orders ${revSql} GROUP BY month ORDER BY month ASC`
  ).all(...params);

  const ordersByStatus = db.prepare(
    `SELECT status, COUNT(*) AS orders, SUM(total) AS total_value
     FROM orders ${allSql} GROUP BY status`
  ).all(...params);

  const topProducts = db.prepare(
    `SELECT oi.name, SUM(oi.quantity) AS qty, SUM(oi.quantity * oi.price) AS revenue
     FROM order_items oi INNER JOIN orders o ON o.id = oi.order_id
     ${revSqlO} GROUP BY oi.name ORDER BY qty DESC LIMIT 10`
  ).all(...params);

  const bottomProducts = db.prepare(
    `SELECT oi.name, SUM(oi.quantity) AS qty, SUM(oi.quantity * oi.price) AS revenue
     FROM order_items oi INNER JOIN orders o ON o.id = oi.order_id
     ${revSqlO} GROUP BY oi.name ORDER BY qty ASC LIMIT 10`
  ).all(...params);

  const revenueByCategory = db.prepare(
    `SELECT mi.category, SUM(oi.quantity) AS qty, SUM(oi.quantity * oi.price) AS revenue
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     LEFT JOIN menu_items mi ON mi.id = oi.menu_item_id
     ${revSqlO} GROUP BY mi.category ORDER BY revenue DESC`
  ).all(...params);

  const peakHours = db.prepare(
    `SELECT strftime('%H', created_at, 'localtime') AS hour, COUNT(*) AS orders
     FROM orders ${allSql} GROUP BY hour ORDER BY orders DESC`
  ).all(...params);

  const avgOrderValue = db.prepare(
    `SELECT AVG(total) AS avg FROM orders ${revSql}`
  ).get(...params);

  const customerStats = db.prepare(
    `SELECT customer_phone, COUNT(*) AS order_count
     FROM orders ${allSql} AND customer_phone IS NOT NULL AND customer_phone != ''
     GROUP BY customer_phone`
  ).all(...params);
  const newCustomers = customerStats.filter((c) => c.order_count === 1).length;
  const returningCustomers = customerStats.filter((c) => c.order_count > 1).length;

  const couponUsageStats = db.prepare(
    `SELECT cu.coupon_id, c.code, COUNT(*) AS uses, SUM(cu.discount_applied) AS total_discount
     FROM coupon_usage cu
     LEFT JOIN coupons c ON c.id = cu.coupon_id
     GROUP BY cu.coupon_id ORDER BY uses DESC`
  ).all();

  const reviewDistribution = db.prepare(
    'SELECT rating, COUNT(*) AS count FROM reviews WHERE is_hidden = 0 OR is_hidden IS NULL GROUP BY rating ORDER BY rating DESC'
  ).all();

  const franchiseLeadCount = db.prepare('SELECT COUNT(*) AS count FROM franchise_leads').get().count;

  const ordersByDeliveryType = db.prepare(
    `SELECT delivery_type, COUNT(*) AS orders, SUM(total) AS revenue
     FROM orders ${revSql} GROUP BY delivery_type`
  ).all(...params);

  // Completion rate and cancelled count for analytics dashboard
  const completedCount = db.prepare(
    `SELECT COUNT(*) AS count FROM orders ${allSql} AND status = 'completed'`
  ).get(...params).count;
  const cancelledCount = db.prepare(
    `SELECT COUNT(*) AS count FROM orders ${allSql} AND status = 'cancelled'`
  ).get(...params).count;
  const totalFinalisedOrders = completedCount + cancelledCount;
  const completionRate = totalFinalisedOrders > 0
    ? Math.round((completedCount / totalFinalisedOrders) * 100)
    : null;

  return res.json({
    dailyRevenue,
    weeklyRevenue,
    monthlyRevenue,
    ordersByStatus,
    topProducts,
    bottomProducts,
    revenueByCategory,
    ordersByDeliveryType,
    peakHours,
    avgOrderValue: Math.round((avgOrderValue?.avg || 0) * 100) / 100,
    customerAnalytics: { newCustomers, returningCustomers, total: customerStats.length },
    couponUsageStats,
    reviewDistribution,
    franchiseLeadCount: Number(franchiseLeadCount),
    completionRate,
    completedCount: Number(completedCount),
    cancelledCount: Number(cancelledCount),
  });
});

// ── Settings ─────────────────────────────────────────────────────────────

const PUBLIC_SETTING_KEYS = [
  'restaurant_name', 'tagline', 'whatsapp_number', 'opening_hours', 'days_open',
  'gst_enabled', 'gst_percentage', 'prices_include_gst', 'delivery_charge',
  'packing_charge', 'instagram_url', 'youtube_url', 'swiggy_url', 'zomato_url',
  'min_order_value',
];

app.get('/api/settings', (_req, res) => {
  const placeholders = PUBLIC_SETTING_KEYS.map(() => '?').join(',');
  const rows = db.prepare(
    `SELECT key, value FROM settings WHERE key IN (${placeholders})`
  ).all(...PUBLIC_SETTING_KEYS);
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return res.json({ settings });
});

app.get('/api/admin/settings', adminRequired, (_req, res) => {
  const rows = db.prepare(
    'SELECT key, value, label, type, section FROM settings ORDER BY section, key'
  ).all();
  const sections = {};
  for (const row of rows) {
    if (!sections[row.section]) sections[row.section] = [];
    sections[row.section].push(row);
  }
  return res.json({ settings: rows, sections });
});

app.put('/api/admin/settings', adminRequired, (req, res) => {
  const updates = req.body.settings;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ error: 'Body must include a settings object { key: value }.' });
  }
  const now = new Date().toISOString();
  const stmt = db.prepare('UPDATE settings SET value = ?, updated_at = ? WHERE key = ?');
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      stmt.run(value !== null && value !== undefined ? String(value) : '', now, key);
    }
  });
  tx();
  logActivity(req.user?.id, 'update_settings', 'settings', null, { keys: Object.keys(updates) });

  // Notify all connected clients to refresh their settings cache
  broadcastSSE('settings_updated', { updatedKeys: Object.keys(updates) });

  const rows = db.prepare(
    'SELECT key, value, label, type, section FROM settings ORDER BY section, key'
  ).all();
  const sections = {};
  for (const row of rows) {
    if (!sections[row.section]) sections[row.section] = [];
    sections[row.section].push(row);
  }
  return res.json({ settings: rows, sections });
});

// Testimonial videos moved to Supabase (table + Storage bucket, see
// supabase_migrations/006_testimonial_videos.sql) — this local-disk/SQLite
// backend never persisted on Vercel's ephemeral serverless filesystem.

const distPath = path.join(rootDir, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }
  return res.status(err.status || 500).json({ error: 'Something went wrong. Please try again.' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Shawarma Inn API running on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`SQLite database file: ${dbPath}`);
  });
}

export default app;
