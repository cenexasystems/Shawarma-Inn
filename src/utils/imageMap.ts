import classicRoll from '../assets/Classic chicken shawarma.png';
import classicPlate from '../assets/classic shawarma plate.jpeg';
import periPeriRoll from '../assets/Peri Peri chicken shawarma.png';
import periPeriPlate from '../assets/Peri peri plate.jpeg';
import schezwanRoll from '../assets/Schezwan Chicken Shawarma..png';
import bbqPlate from '../assets/BBQ Plate.jpeg';
import tandooriRoll from '../assets/Tandoori shawarma.png';
import tandooriPlate from '../assets/Tandoori plate.jpeg';
import chilliGarlicRoll from '../assets/Chilli Garlic Shawarma.png';
import chilliGarlicPlate from '../assets/chilli garlic plate.jpeg';
import mexicanRoll from '../assets/Mexican shawarma.png';
import mexicanPlate from '../assets/mexican plate.jpeg';
import cheesyRoll from '../assets/Cheesy shawarma.png';
import cheesyPlate from '../assets/cheesy plate.jpeg';
import jalapenoRoll from '../assets/Jalapeño Shawarma.png';
import jalapenoPlate from '../assets/Jalapeño Plate.png';
import thousandIslandPlate from '../assets/Thousand island plate.png';
import chipotleRoll from '../assets/Chipotle shawarma.jpeg';
import chipotlePlate from '../assets/Chipotle Plate.png';
import sweetChilliRoll from '../assets/Sweet chilli shawarma.png';
import sweetChilliPlate from '../assets/sweet chilli shawarma.jpeg';
import shawarmaFallback from '../assets/shawarma_loader.png';

export const imageMap: Record<string, string> = {
  // Classic Shawarma
  'classic-shawarma-roll': classicRoll,
  'classic-shawarma-roll-large': classicRoll,
  'classic-shawarma-plate': classicPlate,
  'classic-shawarma-plate-large': classicPlate,

  // Peri Peri Shawarma
  'peri-peri-shawarma-roll': periPeriRoll,
  'peri-peri-shawarma-roll-large': periPeriRoll,
  'peri-peri-shawarma-plate': periPeriPlate,
  'peri-peri-shawarma-plate-large': periPeriPlate,

  // Schezwan Shawarma
  'schezwan-shawarma-roll': schezwanRoll,
  'schezwan-shawarma-roll-large': schezwanRoll,
  'schezwan-shawarma-plate': schezwanRoll,
  'schezwan-shawarma-plate-large': schezwanRoll,

  // BBQ Shawarma
  'bbq-shawarma-roll': bbqPlate,
  'bbq-shawarma-roll-large': bbqPlate,
  'bbq-shawarma-plate': bbqPlate,
  'bbq-shawarma-plate-large': bbqPlate,

  // Tandoori Shawarma
  'tandoori-shawarma-roll': tandooriRoll,
  'tandoori-shawarma-roll-large': tandooriRoll,
  'tandoori-shawarma-plate': tandooriPlate,
  'tandoori-shawarma-plate-large': tandooriPlate,

  // Chilli Garlic Shawarma
  'chilli-garlic-shawarma-roll': chilliGarlicRoll,
  'chilli-garlic-shawarma-roll-large': chilliGarlicRoll,
  'chilli-garlic-shawarma-plate': chilliGarlicPlate,
  'chilli-garlic-shawarma-plate-large': chilliGarlicPlate,

  // Mexican Shawarma
  'mexican-shawarma-roll': mexicanRoll,
  'mexican-shawarma-roll-large': mexicanRoll,
  'mexican-shawarma-plate': mexicanPlate,
  'mexican-shawarma-plate-large': mexicanPlate,

  // Cheesy Shawarma
  'cheesy-shawarma-roll': cheesyRoll,
  'cheesy-shawarma-roll-large': cheesyRoll,
  'cheesy-shawarma-plate': cheesyPlate,
  'cheesy-shawarma-plate-large': cheesyPlate,

  // Jalapeno Shawarma
  'jalapeno-shawarma-roll': jalapenoRoll,
  'jalapeno-shawarma-roll-large': jalapenoRoll,
  'jalapeno-shawarma-plate': jalapenoPlate,
  'jalapeno-shawarma-plate-large': jalapenoPlate,

  // Thousand Island Shawarma
  'thousand-island-shawarma-roll': thousandIslandPlate,
  'thousand-island-shawarma-roll-large': thousandIslandPlate,
  'thousand-island-shawarma-plate': thousandIslandPlate,
  'thousand-island-shawarma-plate-large': thousandIslandPlate,

  // Chipotle Shawarma
  'chipotle-shawarma-roll': chipotleRoll,
  'chipotle-shawarma-roll-large': chipotleRoll,
  'chipotle-shawarma-plate': chipotlePlate,
  'chipotle-shawarma-plate-large': chipotlePlate,

  // Sweet Chilli Shawarma
  'sweet-chilli-shawarma-roll': sweetChilliRoll,
  'sweet-chilli-shawarma-roll-large': sweetChilliRoll,
  'sweet-chilli-shawarma-plate': sweetChilliPlate,
  'sweet-chilli-shawarma-plate-large': sweetChilliPlate,

  // Add-ons / Others
  'roll-shawarma-add-on-cheese-reg': cheesyRoll,
  'roll-shawarma-add-on-cheese-spl': cheesyRoll,
  'plate-shawarma-add-on-cheese-reg': cheesyPlate,
  'plate-shawarma-add-on-cheese-spl': cheesyPlate,
  'plate-shawarma-add-on-kuboos-reg': classicPlate,
  'plate-shawarma-add-on-kuboos-spl': classicPlate,

  // Paneer / Veg Fallbacks (if no assets provided, use classic for now, or fallback)
  'paneer-shawarma': shawarmaFallback,
  'paneer-platter': shawarmaFallback,
  'veg-shawarma': shawarmaFallback,
  'veg-platter': shawarmaFallback,

  // Burgers
  'veg-burger': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=450&fit=crop&q=75&auto=format',
  'paneer-burger': 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=450&fit=crop&q=75&auto=format',
  'double-veg-burger': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&h=450&fit=crop&q=75&auto=format',
  'double-paneer-burger': 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&h=450&fit=crop&q=75&auto=format',

  // Fries
  'french-fries': 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&h=450&fit=crop&q=75&auto=format',

  // Mojitos
  'mint-mojito': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=450&fit=crop&q=75&auto=format',
  'green-apple-mojito': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=450&fit=crop&q=75&auto=format',
  'blue-ocean-mojito': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=450&fit=crop&q=75&auto=format',
  'strawberry-mojito': 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=600&h=450&fit=crop&q=75&auto=format',
  'watermelon-mojito': 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=600&h=450&fit=crop&q=75&auto=format',
};

// If an item is missing from imageMap, it gets ONE deterministic fallback based on its category
export const categoryFallbackMap: Record<string, string> = {
  'Shawarma': shawarmaFallback,
  'Burgers': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=450&fit=crop&q=75&auto=format',
  'Pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=450&fit=crop&q=75&auto=format',
  'Momos': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=450&fit=crop&q=75&auto=format',
  'Toasts': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=450&fit=crop&q=75&auto=format',
  'Starters': 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&h=450&fit=crop&q=75&auto=format',
  'Loaded Fries': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&h=450&fit=crop&q=75&auto=format',
  'Bring Your Own Chips': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&h=450&fit=crop&q=75&auto=format',
  'Desserts': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=450&fit=crop&q=75&auto=format',
  'Mojitos': 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=450&fit=crop&q=75&auto=format',
  'Milkshakes': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=450&fit=crop&q=75&auto=format',
  'Waffles': 'https://images.unsplash.com/photo-1598110750624-207050c4f28c?w=600&h=450&fit=crop&q=75&auto=format',
  'Combo Deals': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=450&fit=crop&q=75&auto=format',
};
