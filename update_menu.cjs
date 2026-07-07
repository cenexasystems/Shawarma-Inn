const fs = require('fs');
const path = require('path');

const menuPath = path.join(__dirname, 'src', 'data', 'menu.json');
let menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

// Helper to update or add an item
function upsertItem(slug, name, category, price, desc, image, isVeg) {
  const existingIndex = menu.findIndex(i => i.slug === slug || (i.name === name && i.category === category));
  
  if (existingIndex !== -1) {
    menu[existingIndex].name = name;
    menu[existingIndex].slug = slug;
    menu[existingIndex].category = category;
    menu[existingIndex].price = price;
    menu[existingIndex].desc = desc;
    menu[existingIndex].image = image;
    menu[existingIndex].isVeg = isVeg;
  } else {
    // Generate a new ID (max id + 1)
    const maxId = Math.max(...menu.map(i => i.id));
    menu.push({
      id: maxId + 1,
      slug,
      name,
      category,
      price,
      desc,
      image,
      isVeg,
      bestseller: false,
      rating: 4.5
    });
  }
}

// 12 Pizzas
const pizzas = [
  ['margherita-pizza', 'Margherita Pizza', 'Pizza', 149, 'Thin crust, melted cheese dominant, minimal toppings with basil.', '/images/menu/pizzas/margherita-pizza.png', true],
  ['farm-fresh-pizza', 'Farm Fresh Pizza', 'Pizza', 199, 'Very colorful, topped with visible onion, capsicum, tomato, corn, mushrooms.', '/images/menu/pizzas/farm-fresh-pizza.png', true],
  ['veg-supreme-pizza', 'Veg Supreme Pizza', 'Pizza', 229, 'Loaded but not excessive. Paneer cubes, olives, capsicum, onion, tomato, corn.', '/images/menu/pizzas/veg-supreme-pizza.png', true],
  ['paneer-tikka-pizza', 'Paneer Tikka Pizza', 'Pizza', 249, 'Indian style, paneer dominant. Grilled paneer with tikka masala coating.', '/images/menu/pizzas/paneer-tikka-pizza.png', true],
  ['chicken-pizza', 'Chicken Pizza', 'Pizza', 199, 'Simple. Shredded chicken, cheese, oregano.', '/images/menu/pizzas/chicken-pizza.png', false],
  ['bbq-chicken-pizza', 'BBQ Chicken Pizza', 'Pizza', 249, 'Smokier appearance. Dark BBQ glaze, grilled chicken chunks, onions.', '/images/menu/pizzas/bbq-chicken-pizza.png', false],
  ['peri-peri-chicken-pizza', 'Peri Peri Chicken Pizza', 'Pizza', 249, 'Orange peri peri coating, spicy seasoning, grilled chicken.', '/images/menu/pizzas/peri-peri-chicken-pizza.png', false],
  ['tandoori-chicken-pizza', 'Tandoori Chicken Pizza', 'Pizza', 259, 'Indian style. Red tandoori chicken chunks, onion, capsicum.', '/images/menu/pizzas/tandoori-chicken-pizza.png', false],
  ['chicken-supreme-pizza', 'Chicken Supreme Pizza', 'Pizza', 289, 'Loaded. Chicken chunks, olives, jalapenos, onion, corn.', '/images/menu/pizzas/chicken-supreme-pizza.png', false],
  ['cheese-burst-pizza', 'Cheese Burst Pizza', 'Pizza', 299, 'Large amount of melted cheese, minimal toppings.', '/images/menu/pizzas/cheese-burst-pizza.png', true],
  ['double-cheese-pizza', 'Double Cheese Pizza', 'Pizza', 249, 'Thick cheese layer, no unnecessary toppings.', '/images/menu/pizzas/double-cheese-pizza.png', true],
  ['mexican-pizza', 'Mexican Pizza', 'Pizza', 219, 'Slight spicy appearance. Jalapenos, corn, beans, capsicum.', '/images/menu/pizzas/mexican-pizza.png', true],
];

pizzas.forEach(p => upsertItem(...p));

// 5 Momos
const momos = [
  ['veg-momos', 'Veg Momos', 'Momos', 99, 'Light steamed filling, green vegetables.', '/images/menu/momos/veg-momos.png', true],
  ['paneer-momos', 'Paneer Momos', 'Momos', 129, 'Slight yellow/white paneer stuffing.', '/images/menu/momos/paneer-momos.png', true],
  ['chicken-momos', 'Chicken Momos', 'Momos', 139, 'Juicier, slight brown chicken filling.', '/images/menu/momos/chicken-momos.png', false],
  ['peri-peri-momos', 'Peri Peri Momos', 'Momos', 149, 'Dumplings coated with orange spicy peri peri seasoning.', '/images/menu/momos/peri-peri-momos.png', false],
  ['fried-momos', 'Fried Momos', 'Momos', 129, 'Golden brown and crispy dumplings.', '/images/menu/momos/fried-momos.png', false],
];

momos.forEach(m => upsertItem(...m));

fs.writeFileSync(menuPath, JSON.stringify(menu, null, 2));
console.log('Successfully updated menu.json with 17 new items!');
