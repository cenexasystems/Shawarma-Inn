const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = process.env.VERCEL ? path.join('/tmp', 'shawarma-inn-data') : path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'billing.sqlite');

const menuPath = path.join(__dirname, '..', 'src', 'data', 'menu.json');

const db = new Database(dbPath);

const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

db.exec('BEGIN TRANSACTION;');

try {
  const menuColumns = db.prepare('PRAGMA table_info(menu_items)').all().map(c => c.name);
  if (!menuColumns.includes('slug')) db.exec("ALTER TABLE menu_items ADD COLUMN slug TEXT");
  if (!menuColumns.includes('description')) db.exec("ALTER TABLE menu_items ADD COLUMN description TEXT");
  if (!menuColumns.includes('large_price')) db.exec("ALTER TABLE menu_items ADD COLUMN large_price REAL");
  if (!menuColumns.includes('is_veg')) db.exec("ALTER TABLE menu_items ADD COLUMN is_veg INTEGER NOT NULL DEFAULT 0");
  if (!menuColumns.includes('is_trending')) db.exec("ALTER TABLE menu_items ADD COLUMN is_trending INTEGER NOT NULL DEFAULT 0");
  if (!menuColumns.includes('display_order')) db.exec("ALTER TABLE menu_items ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0");

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      is_visible INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      banner_image TEXT,
      category_image TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const insertMenu = db.prepare(`
    INSERT INTO menu_items (slug, name, description, price, category, is_veg, is_bestseller, display_order)
    VALUES (@slug, @name, @desc, @price, @category, @isVeg, @bestseller, @display_order)
  `);
  
  const updateMenu = db.prepare(`
    UPDATE menu_items SET 
      slug = @slug,
      description = @desc,
      price = @price,
      category = @category,
      is_veg = @isVeg,
      is_bestseller = @bestseller,
      display_order = @display_order
    WHERE name = @name
  `);

  const checkMenu = db.prepare(`SELECT id FROM menu_items WHERE name = ?`);

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, display_order)
    VALUES (?, ?)
  `);

  const categories = new Set();
  
  let order = 0;
  for (const item of menuData) {
    categories.add(item.category);
    
    const params = {
      slug: item.slug || '',
      name: item.name || '',
      desc: item.desc || item.description || '',
      price: item.price || 0,
      category: item.category || 'Uncategorized',
      isVeg: item.isVeg ? 1 : 0,
      bestseller: item.bestseller ? 1 : 0,
      display_order: order++
    };

    const exists = checkMenu.get(params.name);
    if (exists) {
      updateMenu.run(params);
    } else {
      insertMenu.run(params);
    }
  }

  let catOrder = 0;
  for (const cat of categories) {
    if (cat) {
      insertCategory.run(cat, catOrder++);
    }
  }

  db.exec('COMMIT;');
  console.log('Seeded menu_items and categories successfully.');
} catch (err) {
  db.exec('ROLLBACK;');
  console.error('Failed to seed:', err);
}
