import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, dbPath, mapUserRow, getNextOrderNumber } from './db.js';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || 'shawarma-inn-local-dev-secret';

app.use(
  cors({
    origin: true,
  }),
);
app.use(express.json({ limit: '1mb' }));

function sanitizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function sanitizeReviewText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
}

function getUserById(userId) {
  const row = db
    .prepare(
      `SELECT
        id,
        email,
        role,
        name,
        phone,
        avatar_url,
        status,
        provider,
        is_profile_complete
      FROM users
      WHERE id = ?`,
    )
    .get(Number(userId));

  return mapUserRow(row);
}

function authRequired(req, res, next) {
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

function optionalAuth(req, _res, next) {
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

function adminRequired(req, res, next) {
  return authRequired(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    return next();
  });
}

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
  deliveryAddress,
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
      delivery_address,
      source,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
    const total = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const createdAt = new Date().toISOString();
    const orderNumber = getNextOrderNumber();

    const orderResult = insertOrder.run(
      orderNumber,
      payload.userId ?? null,
      total,
      payload.status,
      payload.customerName || null,
      payload.customerPhone || null,
      payload.deliveryAddress || null,
      payload.source,
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

    const orderRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    return orderRow;
  });

  return runTx({ userId, customerName, customerPhone, deliveryAddress, source, status, items });
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, dbPath });
});

app.post('/api/auth/signup', (req, res) => {
  const email = sanitizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const name = String(req.body.name || '').trim();

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already exists.' });
  }

  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 10);
  const profileComplete = Number(Boolean(name));

  const result = db
    .prepare(
      `INSERT INTO users (
        email,
        password_hash,
        role,
        name,
        provider,
        status,
        is_profile_complete,
        created_at,
        updated_at
      ) VALUES (?, ?, 'user', ?, 'local', ?, ?, ?, ?)`
    )
    .run(email, passwordHash, name || null, 'Customer', profileComplete, now, now);

  const user = getUserById(result.lastInsertRowid);
  const token = createToken(user);

  return res.status(201).json({ token, user });
});

app.post('/api/auth/login', (req, res) => {
  const email = sanitizeEmail(req.body.email);
  const password = String(req.body.password || '');

  const row = db
    .prepare('SELECT id, email, role, password_hash FROM users WHERE email = ?')
    .get(email);

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  if (row.role !== 'user') {
    return res.status(403).json({ error: 'Use admin login for administrator accounts.' });
  }

  const user = getUserById(row.id);
  const token = createToken(user);

  return res.json({ token, user });
});

app.post('/api/admin/login', (req, res) => {
  const email = sanitizeEmail(req.body.email);
  const password = String(req.body.password || '');

  const row = db
    .prepare('SELECT id, email, role, password_hash FROM users WHERE email = ?')
    .get(email);

  if (!row || row.role !== 'admin' || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  const user = getUserById(row.id);
  const token = createToken(user);

  return res.json({ token, user });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/users/profile', authRequired, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ error: 'Profile endpoint is for customer accounts only.' });
  }

  return res.json({ profile: req.user });
});

app.put('/api/users/profile', authRequired, (req, res) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ error: 'Profile endpoint is for customer accounts only.' });
  }

  const name = req.body.name === undefined ? req.user.name : String(req.body.name || '').trim();
  const phone = req.body.phone === undefined ? req.user.phone : String(req.body.phone || '').trim();
  const avatarUrl = req.body.avatar_url === undefined
    ? req.user.avatar_url
    : String(req.body.avatar_url || '').trim();
  const status = req.body.status === undefined ? req.user.status : String(req.body.status || '').trim();

  const profileComplete = Number(Boolean(name && phone));

  db.prepare(
    `UPDATE users
     SET name = ?,
         phone = ?,
         avatar_url = ?,
         status = ?,
         is_profile_complete = ?,
         updated_at = ?
     WHERE id = ?`
  ).run(name || null, phone || null, avatarUrl || null, status || null, profileComplete, new Date().toISOString(), req.user.id);

  const user = getUserById(req.user.id);
  return res.json({ profile: user, user });
});

app.get('/api/menu-items', (_req, res) => {
  const rows = db.prepare(
    `SELECT id, name, price, category, is_active
     FROM menu_items
     WHERE deleted_at IS NULL
       AND is_active = 1
     ORDER BY category ASC, name ASC`
  ).all();

  return res.json({ items: rows });
});

app.get('/api/admin/menu-items', adminRequired, (_req, res) => {
  const rows = db.prepare(
    `SELECT id, name, price, category, is_active, created_at, updated_at
     FROM menu_items
     WHERE deleted_at IS NULL
     ORDER BY category ASC, name ASC`
  ).all();

  return res.json({ items: rows });
});

app.post('/api/admin/menu-items', adminRequired, (req, res) => {
  const name = String(req.body.name || '').trim();
  const price = Number(req.body.price);
  const category = String(req.body.category || '').trim();
  const isActive = req.body.is_active === undefined ? 1 : Number(Boolean(req.body.is_active));

  if (!name) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: 'Price must be a valid number.' });
  }

  if (!category) {
    return res.status(400).json({ error: 'Category is required.' });
  }

  const now = new Date().toISOString();
  const result = db.prepare(
    `INSERT INTO menu_items (name, price, category, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(name, price, category, isActive, now, now);

  const item = db
    .prepare('SELECT id, name, price, category, is_active FROM menu_items WHERE id = ?')
    .get(result.lastInsertRowid);

  return res.status(201).json({ item });
});

app.put('/api/admin/menu-items/:id', adminRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid item id.' });
  }

  const existing = db.prepare('SELECT id FROM menu_items WHERE id = ? AND deleted_at IS NULL').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Menu item not found.' });
  }

  const name = String(req.body.name || '').trim();
  const price = Number(req.body.price);
  const category = String(req.body.category || '').trim();
  const isActive = Number(Boolean(req.body.is_active));

  if (!name) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: 'Price must be a valid number.' });
  }

  if (!category) {
    return res.status(400).json({ error: 'Category is required.' });
  }

  db.prepare(
    `UPDATE menu_items
     SET name = ?, price = ?, category = ?, is_active = ?, updated_at = ?
     WHERE id = ?`
  ).run(name, price, category, isActive, new Date().toISOString(), id);

  const item = db
    .prepare('SELECT id, name, price, category, is_active FROM menu_items WHERE id = ?')
    .get(id);

  return res.json({ item });
});

app.delete('/api/admin/menu-items/:id', adminRequired, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid item id.' });
  }

  const existing = db.prepare('SELECT id FROM menu_items WHERE id = ? AND deleted_at IS NULL').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Menu item not found.' });
  }

  db.prepare(
    `UPDATE menu_items
     SET is_active = 0,
         deleted_at = ?,
         updated_at = ?
     WHERE id = ?`
  ).run(new Date().toISOString(), new Date().toISOString(), id);

  return res.json({ success: true });
});

app.post('/api/orders/checkout', optionalAuth, (req, res) => {
  const cartItems = Array.isArray(req.body.cartItems) ? req.body.cartItems : [];
  const items = normalizeCheckoutItems(cartItems);

  if (items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty.' });
  }

  const customerName = String(req.body.customerName || '').trim();
  const customerPhone = String(req.body.customerPhone || '').trim();
  const deliveryAddress = String(req.body.deliveryAddress || '').trim();

  const order = createOrderWithItems({
    userId: req.user?.id ?? null,
    customerName,
    customerPhone,
    deliveryAddress,
    source: 'checkout',
    status: 'pending',
    items,
  });

  return res.status(201).json({ order });
});

app.post('/api/franchise-leads', (req, res) => {
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();
  const email = sanitizeEmail(req.body.email);
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
    `INSERT INTO franchise_leads (name, phone, email, message, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(name, phone, email, message || null, createdAt);

  return res.status(201).json({
    lead: {
      id: Number(result.lastInsertRowid),
      name,
      phone,
      email,
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
    `SELECT id, name, location, avatar_url, review_text, rating, created_at
     FROM reviews
     ORDER BY rating DESC, created_at DESC
     LIMIT ? OFFSET ?`
  ).all(limit, offset);

  return res.json({ reviews: rows });
});

app.post('/api/reviews', (req, res) => {
  const name = String(req.body.name || '').trim();
  const reviewText = sanitizeReviewText(req.body.review_text);
  const rating = Number(req.body.rating);
  const location = String(req.body.location || '').trim();
  const avatarUrl = String(req.body.avatar_url || '').trim();

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
    `INSERT INTO reviews (name, location, avatar_url, review_text, rating, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    name,
    location || null,
    avatarUrl || null,
    reviewText,
    rating,
    createdAt,
  );

  return res.status(201).json({
    review: {
      id: Number(result.lastInsertRowid),
      name,
      location: location || null,
      avatar_url: avatarUrl || null,
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
      o.created_at,
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
        created_at: row.created_at,
        order_items: [],
      });
    }

    if (row.order_item_id) {
      orderMap.get(row.id).order_items.push({
        id: String(row.order_item_id),
        name: row.item_name,
        quantity: Number(row.item_quantity),
        subtotal: Number(row.item_price) * Number(row.item_quantity),
      });
    }
  }

  return res.json({ orders: Array.from(orderMap.values()) });
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
     WHERE date(created_at, 'localtime') = date('now', 'localtime')`
  ).get();

  const topItem = db.prepare(
    `SELECT
      oi.name,
      SUM(oi.quantity) AS qty
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     WHERE date(o.created_at, 'localtime') = date('now', 'localtime')
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

const distPath = path.join(rootDir, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Shawarma Inn API running on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`SQLite database file: ${dbPath}`);
  });
}

export default app;
