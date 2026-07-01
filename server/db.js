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
        'accepted', 'processing', 'preparing', 'ready', 'in_transit', 'completed'
      )),
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      delivery_type TEXT NOT NULL DEFAULT 'store_pickup' CHECK (delivery_type IN ('home_delivery', 'store_pickup')),
      delivery_address TEXT,
      coupon_code TEXT,
      discount_amount REAL NOT NULL DEFAULT 0,
      gst_amount REAL NOT NULL DEFAULT 0,
      packing_charge REAL NOT NULL DEFAULT 0,
      notes TEXT,
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

  // NOTE: a previous version backfilled image_url from menu.json local paths here.
  // That was removed because those paths (/images/menu/…) don't exist in public/
  // and caused 404s. image_url is now only set when an admin uploads a real URL.
  // The semantic image engine (menuImages.ts) handles display without needing image_url.

  const historyColumns = db.prepare('PRAGMA table_info(order_status_history)').all().map((col) => col.name);
  if (!historyColumns.includes('previous_status')) {
    db.exec('ALTER TABLE order_status_history ADD COLUMN previous_status TEXT');
  }
  if (!historyColumns.includes('admin_id')) {
    db.exec('ALTER TABLE order_status_history ADD COLUMN admin_id INTEGER');
  }
  if (!historyColumns.includes('remarks')) {
    db.exec('ALTER TABLE order_status_history ADD COLUMN remarks TEXT');
  }

  migrateOrdersTable();

  // ── New tables ────────────────────────────────────────────────────────────

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      menu_item_id INTEGER,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT,
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id, menu_item_id)
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS testimonial_videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      entity_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate distinct categories from menu_items into the categories table if not already present
  const existingCategories = db.prepare('SELECT DISTINCT category FROM menu_items WHERE category IS NOT NULL').all();
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  existingCategories.forEach((cat) => insertCategory.run(cat.category));

  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      address TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      city TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      google_maps_url TEXT,
      swiggy_url TEXT,
      zomato_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupon_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL UNIQUE,
      user_id INTEGER,
      discount_applied REAL NOT NULL,
      used_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      label TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'text',
      section TEXT NOT NULL DEFAULT 'general',
      updated_at TEXT
    );
  `);

  // ── Indexes ───────────────────────────────────────────────────────────────
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at   ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id      ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_delivery_type ON orders(delivery_type);
    CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_name    ON order_items(name);
    CREATE INDEX IF NOT EXISTS idx_reviews_is_hidden   ON reviews(is_hidden);
    CREATE INDEX IF NOT EXISTS idx_reviews_rating      ON reviews(rating);
    CREATE INDEX IF NOT EXISTS idx_coupons_code        ON coupons(code);
    CREATE INDEX IF NOT EXISTS idx_coupons_is_active   ON coupons(is_active);
    CREATE INDEX IF NOT EXISTS idx_saved_addresses_user_id ON saved_addresses(user_id);
    CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_franchise_leads_created_at ON franchise_leads(created_at);
    CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
    CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
  `);
}

// Pre-existing databases were created with a narrower `status` CHECK and are
// missing the order-management columns below. SQLite can't ALTER a CHECK
// constraint in place, so when an old schema is detected we rebuild the
// table (rename -> create -> copy -> drop) inside a single transaction.
function migrateOrdersTable() {
  const tableSql = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'orders'")
    .get();

  // Rebuild if the status check doesn't include the new statuses or missing columns
  const needsRebuild = !tableSql ||
    !tableSql.sql.includes('completed') ||
    !tableSql.sql.includes('accepted') ||
    !tableSql.sql.includes('ready');

  const orderColumns = db.prepare('PRAGMA table_info(orders)').all().map((col) => col.name);
  const requiredColumns = [
    'customer_email', 'delivery_type', 'coupon_code', 'discount_amount',
    'updated_at', 'gst_amount', 'packing_charge', 'notes',
  ];
  const hasAllColumns = requiredColumns.every((col) => orderColumns.includes(col));

  if (!needsRebuild && hasAllColumns) {
    return;
  }

  // If only new columns are missing (no CHECK change needed), add them directly
  if (!needsRebuild && !hasAllColumns) {
    if (!orderColumns.includes('gst_amount')) {
      db.exec('ALTER TABLE orders ADD COLUMN gst_amount REAL NOT NULL DEFAULT 0');
    }
    if (!orderColumns.includes('packing_charge')) {
      db.exec('ALTER TABLE orders ADD COLUMN packing_charge REAL NOT NULL DEFAULT 0');
    }
    if (!orderColumns.includes('notes')) {
      db.exec('ALTER TABLE orders ADD COLUMN notes TEXT');
    }
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
          'accepted', 'processing', 'preparing', 'ready', 'in_transit', 'completed'
        )),
        customer_name TEXT,
        customer_phone TEXT,
        customer_email TEXT,
        delivery_type TEXT NOT NULL DEFAULT 'store_pickup' CHECK (delivery_type IN ('home_delivery', 'store_pickup')),
        delivery_address TEXT,
        coupon_code TEXT,
        discount_amount REAL NOT NULL DEFAULT 0,
        gst_amount REAL NOT NULL DEFAULT 0,
        packing_charge REAL NOT NULL DEFAULT 0,
        notes TEXT,
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
    const gstSelect = legacyColumns.includes('gst_amount') ? 'gst_amount' : '0';
    const packingSelect = legacyColumns.includes('packing_charge') ? 'packing_charge' : '0';
    const notesSelect = legacyColumns.includes('notes') ? 'notes' : 'NULL';

    // Sanitize status values to fit new CHECK constraint
    const safeStatus = `CASE
      WHEN status IN ('generated','paid','cancelled','pending','unpaid','accepted','processing','preparing','ready','in_transit','completed')
        THEN status
      ELSE 'pending'
    END`;

    db.exec(`
      INSERT INTO orders (
        id, order_number, user_id, total, status, customer_name, customer_phone,
        customer_email, delivery_type, delivery_address, coupon_code, discount_amount,
        gst_amount, packing_charge, notes, source, created_at, updated_at, paid_at
      )
      SELECT
        id, order_number, user_id, total, ${safeStatus}, customer_name, customer_phone,
        ${emailSelect}, ${deliveryTypeSelect}, delivery_address, ${couponSelect}, ${discountSelect},
        ${gstSelect}, ${packingSelect}, ${notesSelect},
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
    `INSERT INTO menu_items (name, price, category, image_url, is_bestseller, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const now = nowIso();
  const tx = db.transaction(() => {
    for (const item of menuData) {
      insertItem.run(
        item.name,
        Number(item.price),
        item.category,
        null,                    // local /images/menu/… paths don't exist in public/; semantic engine handles display
        item.bestseller ? 1 : 0,
        1,
        now,
        now,
      );
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
// admin_id and remarks map to the new columns added in migration.
export function recordOrderStatusChange(orderId, status, changedBy, note, previousStatus = null, remarks = null) {
  const createdAt = nowIso();

  db.prepare(
    `INSERT INTO order_status_history
       (order_id, previous_status, status, changed_by, note, admin_id, remarks, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    orderId,
    previousStatus ?? null,
    status,
    changedBy ?? null,
    note ?? null,
    changedBy ?? null,   // admin_id mirrors changed_by for now
    remarks ?? null,
    createdAt,
  );

  db.prepare(
    `INSERT INTO notification_outbox (order_id, channel, status, payload, created_at)
     VALUES (?, 'customer_dashboard', 'pending', ?, ?)`
  ).run(orderId, JSON.stringify({ status, previousStatus }), createdAt);
}

function migrateSavedAddresses() {
  const cols = db.prepare('PRAGMA table_info(saved_addresses)').all().map((c) => c.name);
  // Rename 'address' → 'address_line' if the old column name still exists
  if (cols.includes('address') && !cols.includes('address_line')) {
    db.exec('ALTER TABLE saved_addresses RENAME COLUMN address TO address_line');
  }
  if (!cols.includes('city')) {
    db.exec('ALTER TABLE saved_addresses ADD COLUMN city TEXT');
  }
  if (!cols.includes('pincode')) {
    db.exec('ALTER TABLE saved_addresses ADD COLUMN pincode TEXT');
  }
}

function migrateCouponUsage() {
  const cols = db.prepare('PRAGMA table_info(coupon_usage)').all().map((c) => c.name);
  // Old schema used 'created_at'; new schema uses 'used_at' — add if missing
  if (!cols.includes('used_at')) {
    db.exec('ALTER TABLE coupon_usage ADD COLUMN used_at TEXT');
    db.exec('UPDATE coupon_usage SET used_at = created_at WHERE used_at IS NULL');
  }
}

function seedSettings() {
  const count = db.prepare('SELECT COUNT(*) AS total FROM settings').get();
  if (count.total > 0) return;

  const defaults = [
    { key: 'restaurant_name', value: 'Shawarma Inn', label: 'Restaurant Name', type: 'text', section: 'general' },
    { key: 'tagline', value: 'Authentic Flavors, Every Bite', label: 'Tagline', type: 'text', section: 'general' },
    { key: 'whatsapp_number', value: String(process.env.VITE_OWNER_WHATSAPP || ''), label: 'WhatsApp Number', type: 'text', section: 'contact' },
    { key: 'support_phone', value: String(process.env.VITE_OWNER_WHATSAPP || ''), label: 'Support Phone', type: 'text', section: 'contact' },
    { key: 'opening_hours', value: '11:00 AM – 11:00 PM', label: 'Opening Hours', type: 'text', section: 'hours' },
    { key: 'days_open', value: 'Monday – Sunday', label: 'Days Open', type: 'text', section: 'hours' },
    { key: 'gst_enabled', value: 'true', label: 'GST Enabled', type: 'boolean', section: 'pricing' },
    { key: 'gst_percentage', value: '5', label: 'GST Percentage (%)', type: 'number', section: 'pricing' },
    { key: 'prices_include_gst', value: 'false', label: 'Prices Include GST', type: 'boolean', section: 'pricing' },
    { key: 'delivery_charge', value: '0', label: 'Delivery Charge (₹)', type: 'number', section: 'pricing' },
    { key: 'packing_charge', value: '0', label: 'Packing Charge (₹)', type: 'number', section: 'pricing' },
    { key: 'min_order_value', value: '0', label: 'Minimum Order Value (₹)', type: 'number', section: 'ordering' },
    { key: 'order_acceptance_mode', value: 'whatsapp', label: 'Order Acceptance Mode', type: 'text', section: 'ordering' },
    { key: 'instagram_url', value: '', label: 'Instagram URL', type: 'url', section: 'social' },
    { key: 'youtube_url', value: '', label: 'YouTube URL', type: 'url', section: 'social' },
    { key: 'google_maps_url', value: '', label: 'Google Maps URL', type: 'url', section: 'social' },
    { key: 'swiggy_url', value: String(process.env.VITE_SWIGGY_URL || ''), label: 'Swiggy URL', type: 'url', section: 'social' },
    { key: 'zomato_url', value: String(process.env.VITE_ZOMATO_URL || ''), label: 'Zomato URL', type: 'url', section: 'social' },
  ];

  const stmt = db.prepare(
    'INSERT INTO settings (key, value, label, type, section, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const now = nowIso();
  const tx = db.transaction(() => {
    for (const s of defaults) {
      stmt.run(s.key, s.value, s.label, s.type, s.section, now);
    }
  });
  tx();
}

function seedBranches() {
  const count = db.prepare('SELECT COUNT(*) AS total FROM branches').get();
  if (count.total > 0) return;

  const now = nowIso();
  db.prepare(
    `INSERT INTO branches (name, address, phone, city, is_active, google_maps_url, swiggy_url, zomato_url, created_at)
     VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)`
  ).run(
    'Shawarma Inn — Mathur',
    'Mathur, Chennai, Tamil Nadu',
    String(process.env.VITE_OWNER_WHATSAPP || '918610632662'),
    'Chennai',
    null,
    String(process.env.VITE_SWIGGY_URL || ''),
    String(process.env.VITE_ZOMATO_URL || ''),
    now,
  );
}

function seedCategories() {
  const count = db.prepare('SELECT COUNT(*) AS total FROM categories').get();
  if (count.total > 0) return;

  const categoryOrder = [
    'Shawarma', 'Burgers', 'Pizza', 'Momos', 'Toasts', 'Starters',
    'Loaded Fries', 'Bring Your Own Chips', 'Mojitos', 'Milkshakes',
    'Waffles', 'Desserts', 'Combo Deals',
  ];

  const stmt = db.prepare(
    'INSERT INTO categories (name, display_order, is_active, created_at) VALUES (?, ?, 1, ?)'
  );
  const now = nowIso();
  const tx = db.transaction(() => {
    categoryOrder.forEach((name, i) => stmt.run(name, i, now));
  });
  tx();
}

export function initializeDatabase() {
  runMigrations();
  migrateSavedAddresses();
  migrateCouponUsage();
  seedAdmin();
  seedMenuItems();
  seedInventory();
  seedCoupons();
  seedBranches();
  seedCategories();
  seedSettings();
}

initializeDatabase();

export { dbPath };
