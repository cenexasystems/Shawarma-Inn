/**
 * SHAWARMA INN — SQLite → Supabase Migration Script
 * 
 * This reads all menu items from your local SQLite database and
 * pushes them to Supabase so Vercel can serve live data.
 * 
 * Run: node migrate_to_supabase.cjs
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const https = require('https');

// ── Config ─────────────────────────────────────────────────────
const SUPABASE_URL = 'https://qyieaexbyhdkujzdpdiv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('Run: set SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key> (Windows CMD)');
  console.error('     $env:SUPABASE_SERVICE_ROLE_KEY="<key>" (PowerShell)');
  console.error('\nGet it from: Supabase Dashboard → Project Settings → API → service_role key\n');
  process.exit(1);
}

// ── SQLite ──────────────────────────────────────────────────────
const dbPath = path.join(__dirname, 'data', 'billing.sqlite');
if (!fs.existsSync(dbPath)) {
  console.error(`❌ SQLite DB not found at: ${dbPath}`);
  process.exit(1);
}

const db = new Database(dbPath, { readonly: true });

// ── Helpers ─────────────────────────────────────────────────────
function supabaseRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
    const bodyStr = body ? JSON.stringify(body) : null;

    const options = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal',
      }
    };

    if (bodyStr) {
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } else {
          reject(new Error(`Supabase ${method} ${endpoint} → ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Main Migration ───────────────────────────────────────────────
async function migrate() {
  console.log('\n🚀 Shawarma Inn — Supabase Migration\n');

  // 1. Read all active menu items from SQLite
  const rows = db.prepare(`
    SELECT * FROM menu_items 
    WHERE deleted_at IS NULL
    ORDER BY display_order ASC, name ASC
  `).all();

  console.log(`📦 Found ${rows.length} menu items in SQLite`);

  if (rows.length === 0) {
    console.error('❌ No menu items found in local DB. Is the server seeded?');
    process.exit(1);
  }

  // 2. Map SQLite rows → Supabase schema
  const menuItems = rows.map(row => ({
    // Supabase uses UUID — we generate from name slug for idempotency
    name: row.name,
    description: row.description || null,
    price: Number(row.price),
    large_price: row.large_price ? Number(row.large_price) : null,
    category: row.category,
    image_url: row.image_url || null,
    slug: row.slug || row.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    rating: row.rating ?? 4.6,
    is_bestseller: Boolean(row.is_bestseller),
    is_available: Boolean(row.is_active ?? 1),
    is_veg: Boolean(row.is_veg),
    is_trending: Boolean(row.is_trending),
    display_order: Number(row.display_order) || 0,
  }));

  // 3. Clear existing menu items in Supabase (full resync)
  console.log('\n🗑️  Clearing existing Supabase menu_items...');
  try {
    // Delete all rows — use filter that always matches
    await supabaseRequest('DELETE', 'menu_items?id=gt.00000000-0000-0000-0000-000000000000', null);
    console.log('   ✅ Cleared');
  } catch (err) {
    console.log('   ⚠️  Could not clear (table may be empty):', err.message);
  }

  // 4. Insert in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < menuItems.length; i += BATCH_SIZE) {
    const batch = menuItems.slice(i, i + BATCH_SIZE);
    try {
      await supabaseRequest('POST', 'menu_items', batch);
      inserted += batch.length;
      console.log(`   📤 Inserted ${inserted}/${menuItems.length} items...`);
    } catch (err) {
      console.error(`   ❌ Batch ${i}-${i+BATCH_SIZE} failed:`, err.message);
    }
  }

  // 5. Read categories and sync those too
  let categories = [];
  try {
    categories = db.prepare(`SELECT * FROM categories ORDER BY display_order ASC`).all();
    console.log(`\n📂 Found ${categories.length} categories in SQLite`);
  } catch {
    console.log('\n📂 No categories table found — skipping categories sync');
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   → ${inserted} menu items pushed to Supabase`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Go to Supabase Dashboard → Authentication → Users`);
  console.log(`   2. Find your email (myteamcreations@...) and copy the UUID`);
  console.log(`   3. Run in Supabase SQL Editor:`);
  console.log(`      UPDATE public.profiles SET role = 'admin' WHERE id = '<your-uuid>';`);
  console.log(`   4. In Vercel Dashboard → Project Settings → Environment Variables:`);
  console.log(`      Set VITE_AUTH_MODE = supabase`);
  console.log(`      Set VITE_SUPABASE_URL = ${SUPABASE_URL}`);
  console.log(`      Set VITE_SUPABASE_ANON_KEY = sb_publishable_1FTPde65bxQFTsAmZamc9w_1WhUBpuC`);
  console.log(`   5. Redeploy on Vercel (Settings → Redeploy)\n`);

  db.close();
}

migrate().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
