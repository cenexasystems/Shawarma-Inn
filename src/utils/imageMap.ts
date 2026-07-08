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

  // ── Auto-Mapped Placeholders ─────────────────────────────────────────────
  'chocolate-toast': '/images/menu/toasts/chocolate-toast.png',
  'white-chocolate-toast': '/images/menu/toasts/white-chocolate-toast.png',
  'veg-cheese-toast': '/images/menu/toasts/veg-cheese-toast.png',
  'sweet-corn-cheese-toast': '/images/menu/toasts/sweet-corn-cheese-toast.png',
  'paneer-cheese-toast': '/images/menu/toasts/paneer-cheese-toast.png',
  'bbq-paneer-cheese-toast': '/images/menu/toasts/bbq-paneer-cheese-toast.png',
  'veg-club-cheese-toast': '/images/menu/toasts/veg-club-cheese-toast.png',
  'sweet-corn-cheese-club-toast': '/images/menu/toasts/sweet-corn-cheese-club-toast.png',
  'paneer-cheese-club-toast': '/images/menu/toasts/paneer-cheese-club-toast.png',
  'bbq-paneer-club-cheese-toast': '/images/menu/toasts/bbq-paneer-club-cheese-toast.png',
  'toast-veg-add-on-flavour': '/images/menu/toasts/toast-veg-add-on-flavour.png',
  'grill-chicken-cheese-toast': '/images/menu/toasts/grill-chicken-cheese-toast.png',
  'fried-chicken-cheese-toast': '/images/menu/toasts/fried-chicken-cheese-toast.png',
  'bbq-chicken-cheese-toast': '/images/menu/toasts/bbq-chicken-cheese-toast.png',
  'bbq-sausage-chicken-cheese-toast': '/images/menu/toasts/bbq-sausage-chicken-cheese-toast.png',
  'grill-chicken-club-cheese-toast': '/images/menu/toasts/grill-chicken-club-cheese-toast.png',
  'bbq-chicken-club-cheese-toast': '/images/menu/toasts/bbq-chicken-club-cheese-toast.png',
  'fried-chicken-club-cheese-toast': '/images/menu/toasts/fried-chicken-club-cheese-toast.png',
  'toast-chicken-add-on-flavour': '/images/menu/toasts/toast-chicken-add-on-flavour.png',
  'toast-chicken-add-on-cheese': '/images/menu/toasts/toast-chicken-add-on-cheese.png',
  'masala-fries': '/images/menu/starters/masala-fries.png',
  'cheese-corn-nuggets-8pc': '/images/menu/starters/cheese-corn-nuggets-8pc.png',
  'veg-roll': '/images/menu/starters/veg-roll.png',
  'paneer-roll': '/images/menu/starters/paneer-roll.png',
  'chicken-popcorn-130gms': '/images/menu/starters/chicken-popcorn-130gms.png',
  'masala-chicken-popcorn-130gms': '/images/menu/starters/masala-chicken-popcorn-130gms.png',
  'sweet-chilli-chicken-popcorn-130gms': '/images/menu/starters/sweet-chilli-chicken-popcorn-130gms.png',
  'chicken-nuggets-6pc': '/images/menu/starters/chicken-nuggets-6pc.png',
  'chicken-wings-4pc': '/images/menu/starters/chicken-wings-4pc.png',
  'chicken-cheese-balls-8pc': '/images/menu/starters/chicken-cheese-balls-8pc.png',
  'chicken-fingers-8pc': '/images/menu/starters/chicken-fingers-8pc.png',
  'chicken-roll': '/images/menu/starters/chicken-roll.png',
  'veg-loaded-french-fries': '/images/menu/loaded-fries/veg-loaded-french-fries.png',
  'paneer-loaded-french-fries': '/images/menu/loaded-fries/paneer-loaded-french-fries.png',
  'chicken-loaded-french-fries': '/images/menu/loaded-fries/chicken-loaded-french-fries.png',
  'bring-your-own-chips-veg': '/images/menu/chips/bring-your-own-chips-veg.png',
  'bring-your-own-chips-paneer': '/images/menu/chips/bring-your-own-chips-paneer.png',
  'bring-your-own-chips-chicken': '/images/menu/chips/bring-your-own-chips-chicken.png',
  'ice-cream-scoop': '/images/menu/desserts/ice-cream-scoop.png',
  'brownie-with-ice-cream': '/images/menu/desserts/brownie-with-ice-cream.png',
  'chocolava-with-ice-cream': '/images/menu/desserts/chocolava-with-ice-cream.png',
  'blue-curacao-mojito': '/images/menu/mojitos/blue-curacao-mojito.png',
  'grape-mojito': '/images/menu/mojitos/grape-mojito.png',
  'mango-mojito': '/images/menu/mojitos/mango-mojito.png',
  'guava-mojito': '/images/menu/mojitos/guava-mojito.png',
  'pineapple-mojito': '/images/menu/mojitos/pineapple-mojito.png',
  'pomegranate-mojito': '/images/menu/mojitos/pomegranate-mojito.png',
  'orange-mojito': '/images/menu/mojitos/orange-mojito.png',
  'blue-berry-mojito': '/images/menu/mojitos/blue-berry-mojito.png',
  'vanilla-milkshake': '/images/menu/milkshakes/vanilla-milkshake.png',
  'strawberry-milkshake': '/images/menu/milkshakes/strawberry-milkshake.png',
  'butterscotch-milkshake': '/images/menu/milkshakes/butterscotch-milkshake.png',
  'chocolate-milkshake': '/images/menu/milkshakes/chocolate-milkshake.png',
  'black-currant-milkshake': '/images/menu/milkshakes/black-currant-milkshake.png',
  'oreo-milkshake': '/images/menu/milkshakes/oreo-milkshake.png',
  'kitkat-milkshake': '/images/menu/milkshakes/kitkat-milkshake.png',
  'brownie-milkshake': '/images/menu/milkshakes/brownie-milkshake.png',
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

  // ── Pizzas (Old Menu Compatibility) ───────────────────────────────────────
  'veg-pizza': '/images/menu/pizzas/veg-supreme-pizza.png',
  'cheese-pizza': '/images/menu/pizzas/double-cheese-pizza.png',
  'sweet-corn-pizza': '/images/menu/pizzas/farm-fresh-pizza.png',
  'paneer-pizza': '/images/menu/pizzas/paneer-tikka-pizza.png',
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
