const fs = require('fs');

const overrides = [
  'veg-loaded-french-fries',
  'paneer-loaded-french-fries',
  'chicken-loaded-french-fries',
  'bring-your-own-chips-veg',
  'bring-your-own-chips-paneer',
  'bring-your-own-chips-chicken',
  'ice-cream-scoop',
  'brownie-with-ice-cream',
  'chocolava-with-ice-cream',
  'blue-curacao-mojito',
  'grape-mojito',
  'mango-mojito',
  'guava-mojito',
  'pineapple-mojito',
  'pomegranate-mojito',
  'orange-mojito',
  'blue-berry-mojito'
];

let content = fs.readFileSync('src/utils/imageMap.ts', 'utf8');

for (const slug of overrides) {
  const url = `/images/menu/generated/${slug}.png`;
  const regex = new RegExp(`'${slug}':\\s*'.*?'`, 'g');
  if (content.match(regex)) {
    content = content.replace(regex, `'${slug}': '${url}'`);
  } else {
    // If it's not in the file, add it to the auto-mapped section
    content = content.replace('// ── Auto-Mapped Placeholders ─────────────────────────────────────────────', `// ── Auto-Mapped Placeholders ─────────────────────────────────────────────\n  '${slug}': '${url}',`);
  }
}

fs.writeFileSync('src/utils/imageMap.ts', content);
console.log('Applied 17 distinct local-style AI image mappings to imageMap.ts');
