const fs = require('fs');

const overrides = {
  // Combos
  'combo-offer-1': 'https://images.unsplash.com/photo-1594212691511-2eb26fc230eb?w=800&q=80',
  'special-chicken-combo-offer': 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80',
  'mega-chicken-combo-offer': 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80',
  'super-delicious-burger-combo': 'https://images.unsplash.com/photo-1594212691511-2eb26fc230eb?w=800&q=80',
  'chicken-burger-combo': 'https://images.unsplash.com/photo-1605333315993-9d41ff17c1ec?w=800&q=80',

  // Desserts
  'ice-cream-scoop': 'https://images.unsplash.com/photo-1570197781417-0a8237580532?w=800&q=80',
  'brownie-with-ice-cream': 'https://images.unsplash.com/photo-1563805042-7684c8e9e1cb?w=800&q=80',
  'chocolava-with-ice-cream': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80',

  // Milkshakes
  'strawberry-milkshake': 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=800&q=80',
  'butterscotch-milkshake': 'https://images.unsplash.com/photo-1572490122747-3968b75bb8fc?w=800&q=80',
  'black-currant-milkshake': 'https://images.unsplash.com/photo-1553177595-4de2bb0842b9?w=800&q=80',
  'oreo-milkshake': 'https://images.unsplash.com/photo-1572490122747-3968b75bb8fc?w=800&q=80',
  'kitkat-milkshake': 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800&q=80',
  'brownie-milkshake': 'https://images.unsplash.com/photo-1553177595-4de2bb0842b9?w=800&q=80',

  // Waffles
  'milk-chocolate-waffle': 'https://images.unsplash.com/photo-1562376552-0d160a2f9fa4?w=800&q=80',
  'dark-chocolate-waffle': 'https://images.unsplash.com/photo-1562376552-0d160a2f9fa4?w=800&q=80',
  'white-chocolate-waffle': 'https://images.unsplash.com/photo-1562376552-0d160a2f9fa4?w=800&q=80',
  'kit-kat-chocolate-waffle': 'https://images.unsplash.com/photo-1562376552-0d160a2f9fa4?w=800&q=80',
  'oreo-chocolate-waffle': 'https://images.unsplash.com/photo-1562376552-0d160a2f9fa4?w=800&q=80',
  'white-dark-chocolate-waffle': 'https://images.unsplash.com/photo-1562376552-0d160a2f9fa4?w=800&q=80',
  'triple-chocolate-waffle': 'https://images.unsplash.com/photo-1562376552-0d160a2f9fa4?w=800&q=80'
};

let content = fs.readFileSync('src/utils/imageMap.ts', 'utf8');

for (const [slug, url] of Object.entries(overrides)) {
  const regex = new RegExp(`'${slug}':\\s*'.*?'`, 'g');
  if (content.match(regex)) {
    content = content.replace(regex, `'${slug}': '${url}'`);
  } else {
    // If it's not in the file, we add it to the auto-mapped section
    content = content.replace('// ── Auto-Mapped Placeholders ─────────────────────────────────────────────', `// ── Auto-Mapped Placeholders ─────────────────────────────────────────────\n  '${slug}': '${url}',`);
  }
}

fs.writeFileSync('src/utils/imageMap.ts', content);
console.log('Applied unique overrides to imageMap.ts');
