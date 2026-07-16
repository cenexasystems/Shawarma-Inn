const db = require('better-sqlite3')('data/billing.sqlite');
const items = db.prepare(`SELECT name, price FROM menu_items WHERE (category LIKE '%shawarma%' OR name LIKE '%shawarma%') AND deleted_at IS NULL AND is_active = 1`).all();
console.log(JSON.stringify(items, null, 2));
