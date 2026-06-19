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
      is_active INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number INTEGER NOT NULL UNIQUE,
      user_id INTEGER,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'paid', 'cancelled', 'pending', 'unpaid')),
      customer_name TEXT,
      customer_phone TEXT,
      delivery_address TEXT,
      source TEXT NOT NULL DEFAULT 'checkout',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

export function initializeDatabase() {
  runMigrations();
  seedAdmin();
  seedMenuItems();
  seedInventory();
}

initializeDatabase();

export { dbPath };
