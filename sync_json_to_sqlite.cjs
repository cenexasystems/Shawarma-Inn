const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const menuPath = path.join(__dirname, 'src', 'data', 'menu.json');
const dbPath = path.join(__dirname, 'data', 'billing.sqlite');

if (!fs.existsSync(menuPath) || !fs.existsSync(dbPath)) {
  console.error("Missing menu.json or billing.sqlite");
  process.exit(1);
}

const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
const db = new Database(dbPath);

console.log(`Syncing ${menu.length} items from menu.json to SQLite...`);

const stmt = db.prepare(`
  INSERT INTO menu_items (id, slug, name, description, price, category, image_url, is_veg, is_bestseller, is_active, display_order, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    slug = excluded.slug,
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    category = excluded.category,
    image_url = excluded.image_url,
    is_veg = excluded.is_veg,
    is_bestseller = excluded.is_bestseller,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at
`);

const tx = db.transaction((items) => {
  let count = 0;
  for (const item of items) {
    // Only upsert the new items we care about (or all of them)
    // We will do all of them to make sure SQLite exactly matches the latest menu.json edits.
    stmt.run(
      item.id,
      item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      item.name,
      item.desc || '',
      item.price,
      item.category,
      item.image || null, // Map image from json to image_url in DB!
      item.isVeg ? 1 : 0,
      item.bestseller ? 1 : 0,
      1, // is_active
      0, // display_order
      new Date().toISOString(),
      new Date().toISOString()
    );
    count++;
  }
  return count;
});

const count = tx(menu);
console.log(`Successfully upserted ${count} items into SQLite!`);

db.close();
