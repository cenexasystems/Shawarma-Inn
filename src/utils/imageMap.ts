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

// Premium accurate Lebanese vegetarian items
import vegShawarma from '../assets/veg_shawarma.png';
import paneerShawarma from '../assets/paneer_shawarma.png';
import vegPlatter from '../assets/veg_platter.png';
import paneerPlatter from '../assets/paneer_platter.png';
import comingSoonPlaceholder from '../assets/coming_soon_placeholder.png';

// ── Burger Images (served from /burger-images/ public folder) ──────────────
const BURGER_BASE = '/burger-images';
const B = {
  classic:       `${BURGER_BASE}/burger_1_classic_chicken.png`,
  crispy:        `${BURGER_BASE}/burger_2_crispy_chicken.png`,
  grilled:       `${BURGER_BASE}/burger_3_grilled_chicken.png`,
  bbq:           `${BURGER_BASE}/burger_4_bbq_chicken.png`,
  mexican:       `${BURGER_BASE}/burger_5_mexican.png`,
  periPeri:      `${BURGER_BASE}/burger_6_peri_peri.png`,
  cheese:        `${BURGER_BASE}/burger_7_cheese.png`,
  doubleCheese:  `${BURGER_BASE}/burger_8_double_cheese.png`,
  doubleChicken: `${BURGER_BASE}/burger_9_double_chicken.png`,
  monster:       `${BURGER_BASE}/burger_10_monster.png`,
  zinger:        `${BURGER_BASE}/burger_11_zinger.png`,
  shawarma:      `${BURGER_BASE}/burger_12_shawarma_burger.png`,
};

export const fallbackPlaceholder = comingSoonPlaceholder;

export const imageMap: Record<string, string> = {
  // ── Shawarma ─────────────────────────────────────────────────────────────
  'classic-shawarma-roll': classicRoll,
  'classic-shawarma-roll-large': classicRoll,
  'classic-shawarma-plate': classicPlate,
  'classic-shawarma-plate-large': classicPlate,
  'peri-peri-shawarma-roll': periPeriRoll,
  'peri-peri-shawarma-roll-large': periPeriRoll,
  'peri-peri-shawarma-plate': periPeriPlate,
  'peri-peri-shawarma-plate-large': periPeriPlate,
  'schezwan-shawarma-roll': schezwanRoll,
  'schezwan-shawarma-roll-large': schezwanRoll,
  'bbq-shawarma-plate': bbqPlate,
  'bbq-shawarma-plate-large': bbqPlate,
  'tandoori-shawarma-roll': tandooriRoll,
  'tandoori-shawarma-roll-large': tandooriRoll,
  'tandoori-shawarma-plate': tandooriPlate,
  'tandoori-shawarma-plate-large': tandooriPlate,
  'chilli-garlic-shawarma-roll': chilliGarlicRoll,
  'chilli-garlic-shawarma-roll-large': chilliGarlicRoll,
  'chilli-garlic-shawarma-plate': chilliGarlicPlate,
  'chilli-garlic-shawarma-plate-large': chilliGarlicPlate,
  'mexican-shawarma-roll': mexicanRoll,
  'mexican-shawarma-roll-large': mexicanRoll,
  'mexican-shawarma-plate': mexicanPlate,
  'mexican-shawarma-plate-large': mexicanPlate,
  'cheesy-shawarma-roll': cheesyRoll,
  'cheesy-shawarma-roll-large': cheesyRoll,
  'cheesy-shawarma-plate': cheesyPlate,
  'cheesy-shawarma-plate-large': cheesyPlate,
  'jalapeno-shawarma-roll': jalapenoRoll,
  'jalapeno-shawarma-roll-large': jalapenoRoll,
  'jalapeno-shawarma-plate': jalapenoPlate,
  'jalapeno-shawarma-plate-large': jalapenoPlate,
  'thousand-island-shawarma-plate': thousandIslandPlate,
  'thousand-island-shawarma-plate-large': thousandIslandPlate,
  'chipotle-shawarma-roll': chipotleRoll,
  'chipotle-shawarma-roll-large': chipotleRoll,
  'chipotle-shawarma-plate': chipotlePlate,
  'chipotle-shawarma-plate-large': chipotlePlate,
  'sweet-chilli-shawarma-roll': sweetChilliRoll,
  'sweet-chilli-shawarma-roll-large': sweetChilliRoll,
  'sweet-chilli-shawarma-plate': sweetChilliPlate,
  'sweet-chilli-shawarma-plate-large': sweetChilliPlate,
  'roll-shawarma-add-on-cheese-reg': cheesyRoll,
  'roll-shawarma-add-on-cheese-spl': cheesyRoll,
  'plate-shawarma-add-on-cheese-reg': cheesyPlate,
  'plate-shawarma-add-on-cheese-spl': cheesyPlate,
  'plate-shawarma-add-on-kuboos-reg': classicPlate,
  'plate-shawarma-add-on-kuboos-spl': classicPlate,
  'paneer-shawarma': paneerShawarma,
  'paneer-platter': paneerPlatter,
  'veg-shawarma': vegShawarma,
  'veg-platter': vegPlatter,

  // ── Burgers ───────────────────────────────────────────────────────────────
  'chicken-burger': B.classic,
  'chinna-chicken-burger': B.classic,
  'classic-chicken-burger': B.classic,
  'hot-glaze-chicken-burger': B.crispy,
  'bbq-chicken-burger': B.bbq,
  'chipotle-chicken-burger': B.mexican,
  'jalapeno-chicken-burger': B.periPeri,
  'thousand-island-chicken-burger': B.grilled,
  'sweet-chilli-chicken-burger': B.cheese,
  'popcorn-chicken-burger': B.crispy,
  'zinger-chicken-burger': B.zinger,
  'double-chicken-burger': B.doubleChicken,
  'veg-burger': B.mexican,
  'hot-glaze-veg-burger': B.crispy,
  'chipotle-veg-burger': B.mexican,
  'jalapeno-veg-burger': B.periPeri,
  'thousand-island-veg-burger': B.grilled,
  'sweet-chilli-veg-burger': B.cheese,
  'paneer-burger': B.grilled,
  'double-veg-burger': B.doubleChicken,
  'double-paneer-burger': B.doubleCheese,
  'burger-add-on-cheese': B.cheese,
  'shawarma-burger': B.shawarma,
  'monster-burger': B.monster,
};

// Category-level fallbacks (used when no slug match exists)
export const categoryFallbackMap: Record<string, string> = {
  'Shawarma':              classicRoll,
  'Burgers':               B.classic,
  'Pizza':                 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=450&fit=crop&q=75&auto=format',
  'Momos':                 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=600&h=450&fit=crop&q=75&auto=format',
  'Toasts':                'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=450&fit=crop&q=75&auto=format',
  'Starters':              'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&h=450&fit=crop&q=75&auto=format',
  'Loaded Fries':          'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&h=450&fit=crop&q=75&auto=format',
  'Bring Your Own Chips':  'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&h=450&fit=crop&q=75&auto=format',
  'Desserts':              'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=450&fit=crop&q=75&auto=format',
  'Mojitos':               'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=450&fit=crop&q=75&auto=format',
  'Milkshakes':            'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=450&fit=crop&q=75&auto=format',
  'Waffles':               'https://images.unsplash.com/photo-1598110750624-207050c4f28c?w=600&h=450&fit=crop&q=75&auto=format',
  'Combo Deals':           'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=450&fit=crop&q=75&auto=format',
};
