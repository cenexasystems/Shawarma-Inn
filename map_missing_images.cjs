const fs = require('fs');
const report = JSON.parse(fs.readFileSync('missing-images-report.json'));

let newMappings = '\n  // ── Auto-Mapped Placeholders ─────────────────────────────────────────────\n';
const targets = ['Toasts', 'Starters', 'Loaded Fries', 'Bring Your Own Chips', 'Desserts', 'Mojitos', 'Milkshakes'];
const items = report.filter(r => targets.includes(r.category));

for (const item of items) {
  let catFolder = item.category.toLowerCase().replace(/ /g, '-');
  if (catFolder === 'bring-your-own-chips') catFolder = 'chips';
  newMappings += `  '${item.slug}': '/images/menu/${catFolder}/${item.slug}.png',\n`;
  
  // Make dir if not exists
  const dir = 'public/images/menu/' + catFolder;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

let content = fs.readFileSync('src/utils/imageMap.ts', 'utf8');
content = content.replace('};', newMappings + '};\n');
fs.writeFileSync('src/utils/imageMap.ts', content);
console.log('Added ' + items.length + ' mappings to imageMap.ts');
