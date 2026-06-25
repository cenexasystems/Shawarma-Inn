import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = process.env.VERCEL ? path.join('/tmp', 'shawarma-inn-data') : path.join(rootDir, 'data');
const dbPath = path.join(dataDir, 'billing.sqlite');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const nowIso = () => new Date().toISOString();

export function mapUserRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name,
    phone: row.phone,
    avatar_url: row.avatar_url,
    status: row.status,
    provider: row.provider,
    is_profile_complete: Boolean(row.is_profile_complete),
  };
}

export function getNextOrderNumber() {
  const result = db
    .prepare('SELECT COALESCE(MAX(order_number), 100) + 1 AS nextOrderNumber FROM orders')
    .get();

  return Number(result.nextOrderNumber);
}

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      name TEXT,
      phone TEXT,
      avatar_url TEXT,
      status TEXT,
      provider TEXT NOT NULL DEFAULT 'local',
      is_profile_complete INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT,
      is_bestseller INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
      discount_value REAL NOT NULL,
      min_order_value REAL NOT NULL DEFAULT 0,
      max_discount REAL,
      expiry_date TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      usage_limit INTEGER,
      usage_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      changed_by INTEGER,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notification_outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      channel TEXT NOT NULL DEFAULT 'customer_dashboard',
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
      payload TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      sent_at TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number INTEGER NOT NULL UNIQUE,
      user_id INTEGER,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN (
        'generated', 'paid', 'cancelled', 'pending', 'unpaid',
        'processing', 'in_transit', 'completed'
      )),
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      delivery_type TEXT NOT NULL DEFAULT 'store_pickup' CHECK (delivery_type IN ('home_delivery', 'store_pickup')),
      delivery_address TEXT,
      coupon_code TEXT,
      discount_amount REAL NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'checkout',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      paid_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      unit TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ingredient_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ingredient_id INTEGER NOT NULL,
      movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
      quantity REAL NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS franchise_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      city TEXT,
      message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      avatar_url TEXT,
      phone TEXT,
      review_text TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const reviewColumns = db.prepare('PRAGMA table_info(reviews)').all().map((col) => col.name);
  if (!reviewColumns.includes('phone')) {
    db.exec('ALTER TABLE reviews ADD COLUMN phone TEXT');
  }
  if (!reviewColumns.includes('is_hidden')) {
    db.exec('ALTER TABLE reviews ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0');
  }

  const franchiseColumns = db.prepare('PRAGMA table_info(franchise_leads)').all().map((col) => col.name);
  if (!franchiseColumns.includes('city')) {
    db.exec('ALTER TABLE franchise_leads ADD COLUMN city TEXT');
  }

  const menuColumns = db.prepare('PRAGMA table_info(menu_items)').all().map((col) => col.name);
  if (!menuColumns.includes('image_url')) {
    db.exec('ALTER TABLE menu_items ADD COLUMN image_url TEXT');
  }
  if (!menuColumns.includes('is_bestseller')) {
    db.exec("ALTER TABLE menu_items ADD COLUMN is_bestseller INTEGER NOT NULL DEFAULT 0");
  }

  migrateOrdersTable();
}

// Pre-existing databases were created with a narrower `status` CHECK and are
// missing the order-management columns below. SQLite can't ALTER a CHECK
// constraint in place, so when an old schema is detected we rebuild the
// table (rename -> create -> copy -> drop) inside a single transaction.
function migrateOrdersTable() {
  const tableSql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'orders'")
    .get();
  const needsRebuild = !tableSql || !tableSql.sql.includes('completed');

  const orderColumns = db.prepare('PRAGMA table_info(orders)').all().map((col) => col.name);
  const hasAllColumns = ['customer_email', 'delivery_type', 'coupon_code', 'discount_amount', 'updated_at']
    .every((col) => orderColumns.includes(col));

  if (!needsRebuild && hasAllColumns) {
    return;
  }

  const rebuild = db.transaction(() => {
    db.exec('ALTER TABLE orders RENAME TO orders_legacy');

    db.exec(`
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number INTEGER NOT NULL UNIQUE,
        user_id INTEGER,
        total REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN (
          'generated', 'paid', 'cancelled', 'pending', 'unpaid',
          'processing', 'in_transit', 'completed'
        )),
        customer_name TEXT,
        customer_phone TEXT,
        customer_email TEXT,
        delivery_type TEXT NOT NULL DEFAULT 'store_pickup' CHECK (delivery_type IN ('home_delivery', 'store_pickup')),
        delivery_address TEXT,
        coupon_code TEXT,
        discount_amount REAL NOT NULL DEFAULT 0,
        source TEXT NOT NULL DEFAULT 'checkout',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        paid_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    const legacyColumns = db.prepare('PRAGMA table_info(orders_legacy)').all().map((col) => col.name);
    const deliveryTypeSelect = legacyColumns.includes('delivery_type')
      ? `CASE WHEN delivery_type IN ('home_delivery','store_pickup') THEN delivery_type ELSE 'store_pickup' END`
      : `'store_pickup'`;
    const emailSelect = legacyColumns.includes('customer_email') ? 'customer_email' : 'NULL';
    const couponSelect = legacyColumns.includes('coupon_code') ? 'coupon_code' : 'NULL';
    const discountSelect = legacyColumns.includes('discount_amount') ? 'discount_amount' : '0';
    const updatedAtSelect = legacyColumns.includes('updated_at') ? 'updated_at' : 'created_at';

    db.exec(`
      INSERT INTO orders (
        id, order_number, user_id, total, status, customer_name, customer_phone,
        customer_email, delivery_type, delivery_address, coupon_code, discount_amount,
        source, created_at, updated_at, paid_at
      )
      SELECT
        id, order_number, user_id, total, status, customer_name, customer_phone,
        ${emailSelect}, ${deliveryTypeSelect}, delivery_address, ${couponSelect}, ${discountSelect},
        source, created_at, ${updatedAtSelect}, paid_at
      FROM orders_legacy;
    `);

    db.exec('DROP TABLE orders_legacy');
  });

  rebuild();
}

function seedAdmin() {
  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || '').trim();

  // Do not create a default admin account without explicit credentials.
  if (!adminEmail || !adminPassword) {
    return;
  }

  const existingAdmin = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(adminEmail.toLowerCase());

  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync(adminPassword, 10);
    db.prepare(
      `INSERT INTO users (
        email,
        password_hash,
        role,
        name,
        phone,
        status,
        provider,
        is_profile_complete,
        created_at,
        updated_at
      ) VALUES (?, ?, 'admin', ?, ?, ?, 'local', 1, ?, ?)`
    ).run(
      adminEmail.toLowerCase(),
      passwordHash,
      'Admin',
      '0000000000',
      'Administrator',
      nowIso(),
      nowIso(),
    );
  }
}

function seedMenuItems() {
  const count = db.prepare('SELECT COUNT(*) AS total FROM menu_items').get();
  if (count.total > 0) {
    return;
  }

  const menuFilePath = path.join(rootDir, 'src', 'data', 'menu.json');
  if (!fs.existsSync(menuFilePath)) {
    return;
  }

  const raw = fs.readFileSync(menuFilePath, 'utf8');
  const menuData = JSON.parse(raw);

  const insertItem = db.prepare(
    `INSERT INTO menu_items (name, price, category, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const now = nowIso();
  const tx = db.transaction(() => {
    for (const item of menuData) {
      insertItem.run(item.name, Number(item.price), item.category, 1, now, now);
    }
  });

  tx();
}

function seedInventory() {
  const ingredientCount = db.prepare('SELECT COUNT(*) AS total FROM ingredients').get();
  if (ingredientCount.total > 0) {
    return;
  }

  const ingredients = [
    { name: 'Chicken', unit: 'kg', stock: 20 },
    { name: 'Pita Bread', unit: 'pcs', stock: 150 },
    { name: 'Garlic Sauce', unit: 'liters', stock: 10 },
    { name: 'Fries', unit: 'kg', stock: 12 },
    { name: 'Pepsi', unit: 'bottles', stock: 80 },
  ];

  const insertIngredient = db.prepare(
    'INSERT INTO ingredients (name, unit, created_at) VALUES (?, ?, ?)'
  );
  const insertStock = db.prepare(
    `INSERT INTO ingredient_stock (ingredient_id, movement_type, quantity, note, created_at)
     VALUES (?, 'in', ?, 'Initial seed stock', ?)`
  );

  const tx = db.transaction(() => {
    for (const ingredient of ingredients) {
      const createdAt = nowIso();
      const result = insertIngredient.run(ingredient.name, ingredient.unit, createdAt);
      insertStock.run(Number(result.lastInsertRowid), ingredient.stock, createdAt);
    }
  });

  tx();
}

function seedCoupons() {
  const count = db.prepare('SELECT COUNT(*) AS total FROM coupons').get();
  if (count.total > 0) {
    return;
  }

  const now = nowIso();
  db.prepare(
    `INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
  ).run('WELCOME10', 'percentage', 10, 0, 100, now, now);

  db.prepare(
    `INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_discount, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
  ).run('FLAT50', 'fixed', 50, 300, null, now, now);
}

// Records a status transition for audit history and queues a row that a
// future notification worker (SMS/WhatsApp/push) can poll and deliver.
export function recordOrderStatusChange(orderId, status, changedBy, note) {
  const createdAt = nowIso();

  db.prepare(
    `INSERT INTO order_status_history (order_id, status, changed_by, note, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(orderId, status, changedBy ?? null, note ?? null, createdAt);

  db.prepare(
    `INSERT INTO notification_outbox (order_id, channel, status, payload, created_at)
     VALUES (?, 'customer_dashboard', 'pending', ?, ?)`
  ).run(orderId, JSON.stringify({ status }), createdAt);
}

export function initializeDatabase() {
  runMigrations();
  seedAdmin();
  seedMenuItems();
  seedInventory();
  seedCoupons();
}

initializeDatabase();

export { dbPath };
