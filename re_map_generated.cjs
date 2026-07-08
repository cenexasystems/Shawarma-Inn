const fs = require('fs');
const report = JSON.parse(fs.readFileSync('missing-images-report.json'));

const getMapping = (slug, category) => {
  const s = slug.toLowerCase();
  
  if (category === 'Momos') {
    if (s.includes('veg') || s.includes('cheese') || s.includes('paneer')) return '/images/menu/generated/veg_momos.png';
    return '/images/menu/generated/chicken_momos.png';
  }
  if (category === 'Toasts') {
    if (s.includes('chocolate')) return '/images/menu/generated/chocolate_toast.png';
    if (s.includes('chicken') || s.includes('meat')) return '/images/menu/generated/chicken_toast.png';
    return '/images/menu/generated/cheese_toast.png';
  }
  if (category === 'Starters') {
    if (s.includes('popcorn') || s.includes('nuggets') || s.includes('wings') || s.includes('fingers') || s.includes('balls')) return '/images/menu/generated/chicken_popcorn.png';
    if (s.includes('roll')) return '/images/menu/generated/chicken_roll.png';
    if (s.includes('fries')) return '/images/menu/generated/french_fries.png';
    return '/images/menu/generated/french_fries.png';
  }
  if (category === 'Loaded Fries') return '/images/menu/generated/loaded_fries.png';
  if (category === 'Bring Your Own Chips') return '/images/menu/generated/french_fries.png';
  if (category === 'Desserts') return '/images/menu/generated/brownie_icecream.png';
  if (category === 'Mojitos') {
    if (s.includes('blue')) return '/images/menu/generated/blue_mojito.png';
    if (s.includes('mango') || s.includes('pineapple') || s.includes('guava') || s.includes('orange')) return '/images/menu/generated/yellow_mojito.png';
    return '/images/menu/generated/red_mojito.png';
  }
  if (category === 'Milkshakes') {
    if (s.includes('chocolate')) return '/images/menu/generated/chocolate_milkshake.png';
    return '/images/menu/generated/vanilla_milkshake.png';
  }
  if (category === 'Waffles') return '/images/menu/generated/chocolate_waffle.png';
  
  return null;
};

let newMappings = '\n  // ── Auto-Mapped Placeholders ─────────────────────────────────────────────\n';
const targets = ['Momos', 'Toasts', 'Starters', 'Loaded Fries', 'Bring Your Own Chips', 'Desserts', 'Mojitos', 'Milkshakes', 'Waffles'];
const items = report.filter(r => targets.includes(r.category));

for (const item of items) {
  const mapped = getMapping(item.slug, item.category);
  if (mapped) {
    newMappings += `  '${item.slug}': '${mapped}',\n`;
  }
}

let content = fs.readFileSync('src/utils/imageMap.ts', 'utf8');

// Replace the previous auto-mapped section
const parts = content.split('// ── Auto-Mapped Placeholders ─────────────────────────────────────────────');
if (parts.length === 2) {
  content = parts[0] + newMappings.trimEnd() + '\n};\n';
}

fs.writeFileSync('src/utils/imageMap.ts', content);
console.log('Successfully remapped ' + items.length + ' items to generated images.');
