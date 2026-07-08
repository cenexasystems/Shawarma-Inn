const fs = require('fs');
const https = require('https');
const path = require('path');

const targetDir = 'public/images/menu/generated';

const items = [
  { slug: 'veg-loaded-french-fries', prompt: 'A realistic casual photo of veg loaded french fries topped with cheese and sauces, in a local South Indian Tamil fast food shop, served on a paper plate, natural lighting, amateur photography, not premium' },
  { slug: 'paneer-loaded-french-fries', prompt: 'A realistic casual photo of paneer loaded french fries topped with cheese and paneer cubes, in a local South Indian Tamil fast food shop, served on a paper plate, natural lighting, amateur photography, not premium' },
  { slug: 'chicken-loaded-french-fries', prompt: 'A realistic casual photo of chicken loaded french fries topped with cheese and chicken pieces, in a local South Indian Tamil fast food shop, served on a paper plate, natural lighting, amateur photography, not premium' },
  { slug: 'bring-your-own-chips-veg', prompt: 'A realistic casual photo of a crushed potato chips packet mixed with veg toppings and sauce, in a local South Indian Tamil fast food shop, amateur photography, not premium' },
  { slug: 'bring-your-own-chips-paneer', prompt: 'A realistic casual photo of a crushed potato chips packet mixed with paneer cubes and sauce, in a local South Indian Tamil fast food shop, amateur photography, not premium' },
  { slug: 'bring-your-own-chips-chicken', prompt: 'A realistic casual photo of a crushed potato chips packet mixed with fried chicken pieces and sauce, in a local South Indian Tamil fast food shop, amateur photography, not premium' },
  { slug: 'ice-cream-scoop', prompt: 'A realistic casual photo of a single scoop of vanilla ice cream in a small simple bowl, in a local South Indian Tamil fast food shop, amateur photography, not premium' },
  { slug: 'brownie-with-ice-cream', prompt: 'A realistic casual photo of a chocolate brownie topped with melting ice cream, on a simple plate, in a local South Indian Tamil fast food shop, amateur photography, not premium' },
  { slug: 'chocolava-with-ice-cream', prompt: 'A realistic casual photo of a chocolate lava cake oozing chocolate with a scoop of ice cream, in a local South Indian Tamil fast food shop, amateur photography, not premium' },
  { slug: 'blue-curacao-mojito', prompt: 'A realistic casual photo of a bright blue curacao mojito drink with ice in a clear plastic cup, in a local South Indian Tamil fast food shop, amateur photography, not premium' },
  { slug: 'grape-mojito', prompt: 'A realistic casual photo of a purple grape mojito drink with ice in a clear plastic cup, in a local South Indian Tamil fast food shop, amateur photography, not premium' },
  { slug: 'mango-mojito', prompt: 'A realistic casual photo of a yellow mango mojito drink with ice in a clear plastic cup, in a local South Indian Tamil fast food shop, amateur photography, not premium' },
  { slug: 'guava-mojito', prompt: 'A realistic casual photo of a pink guava mojito drink with ice in a clear plastic cup, in a local South Indian Tamil fast food shop, amateur photography, not premium' },
  { slug: 'pineapple-mojito', prompt: 'A realistic casual photo of a light yellow pineapple mojito drink with ice in a clear plastic cup, in a local South Indian Tamil fast food shop, amateur photography, not premium' },
  { slug: 'pomegranate-mojito', prompt: 'A realistic casual photo of a deep red pomegranate mojito drink with ice in a clear plastic cup, in a local South Indian Tamil fast food shop, amateur photography, not premium' },
  { slug: 'orange-mojito', prompt: 'A realistic casual photo of an orange mojito drink with ice in a clear plastic cup, in a local South Indian Tamil fast food shop, amateur photography, not premium' },
  { slug: 'blue-berry-mojito', prompt: 'A realistic casual photo of a dark blue berry mojito drink with ice in a clear plastic cup, in a local South Indian Tamil fast food shop, amateur photography, not premium' }
];

async function downloadImage(slug, prompt) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random()*1000)}`;
  const dest = path.join(targetDir, `${slug}.png`);
  
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(dest);
        });
      } else {
        reject(new Error(`Failed to download ${slug}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  console.log('Downloading 17 distinct local-style images...');
  for (const item of items) {
    try {
      await downloadImage(item.slug, item.prompt);
      console.log(`Downloaded ${item.slug}.png`);
    } catch (e) {
      console.error(e.message);
    }
  }
  console.log('Done!');
}

run();
