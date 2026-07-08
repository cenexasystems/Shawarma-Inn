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
import vegShawarma from '../assets/veg_shawarma.png';
import paneerShawarma from '../assets/paneer_shawarma.png';
import vegPlatter from '../assets/veg_platter.png';
import paneerPlatter from '../assets/paneer_platter.png';
import comingSoonPlaceholder from '../assets/coming_soon_placeholder.png';

const PIZZA_BASE = '/images/menu/pizzas';
const MOMO_BASE = '/images/menu/generated';
const STARTER_BASE = '/images/menu/generated';
const TOAST_BASE = '/images/menu/generated';
const FRIES_BASE = '/images/menu/generated';

export const imageMap: Record<string, string> = {
  // Shawarma
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
  'bbq-shawarma-roll': bbqPlate,
  'bbq-shawarma-roll-large': bbqPlate,
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
  'veg-shawarma': vegShawarma,
  'veg-platter': vegPlatter,
  'paneer-shawarma': paneerShawarma,
  'paneer-platter': paneerPlatter,

  // Pizzas
  'veg-pizza': `${PIZZA_BASE}/veg-supreme-pizza.png`,
  'cheese-pizza': `${PIZZA_BASE}/double-cheese-pizza.png`,
  'sweet-corn-pizza': `${PIZZA_BASE}/farm-fresh-pizza.png`,
  'paneer-pizza': `${PIZZA_BASE}/paneer-tikka-pizza.png`,
  'chicken-pizza': `${PIZZA_BASE}/chicken-pizza.png`,
  'bbq-chicken-pizza': `${PIZZA_BASE}/bbq-chicken-pizza.png`,
  'naked-chicken-pizza': `${PIZZA_BASE}/chicken-supreme-pizza.png`,
  'peri-peri-chicken-pizza': `${PIZZA_BASE}/peri-peri-chicken-pizza.png`,
  'tandoori-chicken-pizza': `${PIZZA_BASE}/tandoori-chicken-pizza.png`,
  'mexican-pizza': `${PIZZA_BASE}/mexican-pizza.png`,
  'margherita-pizza': `${PIZZA_BASE}/margherita-pizza.png`,

  // Momos
  'mix-veg-momos': `${MOMO_BASE}/veg_momos.png`,
  'cheese-corn-momos': `${MOMO_BASE}/veg_momos.png`,
  'paneer-tikka-momos': `${MOMO_BASE}/paneer-momos.png`,
  'chicken-momos': `${MOMO_BASE}/chicken_momos.png`,
  'peri-peri-chicken-momos': `${MOMO_BASE}/peri-peri-momos.png`,
  'schezwan-chicken-momos': `${MOMO_BASE}/chicken_momos.png`,
  'chicken-tikka-momos': `${MOMO_BASE}/chicken_momos.png`,

  // Toasts
  'chocolate-toast': `${TOAST_BASE}/chocolate_toast.png`,
  'white-chocolate-toast': `${TOAST_BASE}/chocolate_toast.png`,
  'veg-cheese-toast': `${TOAST_BASE}/cheese_toast.png`,
  'sweet-corn-cheese-toast': `${TOAST_BASE}/cheese_toast.png`,
  'paneer-cheese-toast': `${TOAST_BASE}/cheese_toast.png`,
  'bbq-paneer-cheese-toast': `${TOAST_BASE}/cheese_toast.png`,
  'veg-club-cheese-toast': `${TOAST_BASE}/cheese_toast.png`,
  'sweet-corn-cheese-club-toast': `${TOAST_BASE}/cheese_toast.png`,
  'paneer-cheese-club-toast': `${TOAST_BASE}/cheese_toast.png`,
  'bbq-paneer-club-cheese-toast': `${TOAST_BASE}/cheese_toast.png`,
  'toast-veg-add-on-flavour': `${TOAST_BASE}/cheese_toast.png`,
  'grill-chicken-cheese-toast': `${TOAST_BASE}/chicken_toast.png`,
  'fried-chicken-cheese-toast': `${TOAST_BASE}/chicken_toast.png`,
  'bbq-chicken-cheese-toast': `${TOAST_BASE}/chicken_toast.png`,
  'bbq-sausage-chicken-cheese-toast': `${TOAST_BASE}/chicken_toast.png`,
  'grill-chicken-club-cheese-toast': `${TOAST_BASE}/chicken_toast.png`,
  'bbq-chicken-club-cheese-toast': `${TOAST_BASE}/chicken_toast.png`,
  'fried-chicken-club-cheese-toast': `${TOAST_BASE}/chicken_toast.png`,
  'toast-chicken-add-on-flavour': `${TOAST_BASE}/chicken_toast.png`,
  'toast-chicken-add-on-cheese': `${TOAST_BASE}/chicken_toast.png`,

  // Starters and fries
  'french-fries': `${FRIES_BASE}/french_fries.png`,
  'masala-fries': `${FRIES_BASE}/french_fries.png`,
  'veg-loaded-french-fries': `${FRIES_BASE}/loaded_fries.png`,
  'paneer-loaded-french-fries': `${FRIES_BASE}/loaded_fries.png`,
  'chicken-loaded-french-fries': `${FRIES_BASE}/loaded_fries.png`,
  'cheese-corn-nuggets-8pc': `${STARTER_BASE}/chicken_popcorn.png`,
  'veg-roll': `${STARTER_BASE}/chicken_roll.png`,
  'paneer-roll': `${STARTER_BASE}/chicken_roll.png`,
  'chicken-popcorn-130gms': `${STARTER_BASE}/chicken_popcorn.png`,
  'masala-chicken-popcorn-130gms': `${STARTER_BASE}/chicken_popcorn.png`,
  'sweet-chilli-chicken-popcorn-130gms': `${STARTER_BASE}/chicken_popcorn.png`,
  'chicken-nuggets-6pc': `${STARTER_BASE}/chicken_popcorn.png`,
  'chicken-wings-4pc': `${STARTER_BASE}/chicken_popcorn.png`,
  'chicken-cheese-balls-8pc': `${STARTER_BASE}/chicken_popcorn.png`,
  'chicken-fingers-8pc': `${STARTER_BASE}/chicken_popcorn.png`,
  'chicken-roll': `${STARTER_BASE}/chicken_roll.png`,

  // Chips
  'bring-your-own-chips-veg': `${FRIES_BASE}/french_fries.png`,
  'bring-your-own-chips-paneer': `${FRIES_BASE}/french_fries.png`,
  'bring-your-own-chips-chicken': `${FRIES_BASE}/french_fries.png`,

  // Desserts and drinks
  'ice-cream-scoop': `${FRIES_BASE}/brownie_icecream.png`,
  'brownie-with-ice-cream': `${FRIES_BASE}/brownie_icecream.png`,
  'chocolava-with-ice-cream': `${FRIES_BASE}/brownie_icecream.png`,
  'blue-curacao-mojito': `${FRIES_BASE}/blue_mojito.png`,
  'grape-mojito': `${FRIES_BASE}/red_mojito.png`,
  'mango-mojito': `${FRIES_BASE}/yellow_mojito.png`,
  'guava-mojito': `${FRIES_BASE}/yellow_mojito.png`,
  'pineapple-mojito': `${FRIES_BASE}/yellow_mojito.png`,
  'pomegranate-mojito': `${FRIES_BASE}/red_mojito.png`,
  'orange-mojito': `${FRIES_BASE}/yellow_mojito.png`,
  'blue-berry-mojito': `${FRIES_BASE}/blue_mojito.png`,
  'vanilla-milkshake': `${FRIES_BASE}/vanilla_milkshake.png`,
  'strawberry-milkshake': `${FRIES_BASE}/vanilla_milkshake.png`,
  'butterscotch-milkshake': `${FRIES_BASE}/vanilla_milkshake.png`,
  'chocolate-milkshake': `${FRIES_BASE}/chocolate_milkshake.png`,
  'black-currant-milkshake': `${FRIES_BASE}/vanilla_milkshake.png`,
  'oreo-milkshake': `${FRIES_BASE}/vanilla_milkshake.png`,
  'kitkat-milkshake': `${FRIES_BASE}/vanilla_milkshake.png`,
  'brownie-milkshake': `${FRIES_BASE}/vanilla_milkshake.png`,
  'nutella-waffle': `${FRIES_BASE}/nutella_waffle.png`,
  'milk-chocolate-waffle': `${FRIES_BASE}/chocolate_waffle.png`,
  'dark-chocolate-waffle': `${FRIES_BASE}/chocolate_waffle.png`,
  'white-chocolate-waffle': `${FRIES_BASE}/chocolate_waffle.png`,
  'kit-kat-chocolate-waffle': `${FRIES_BASE}/chocolate_waffle.png`,
  'oreo-chocolate-waffle': `${FRIES_BASE}/chocolate_waffle.png`,
  'white-dark-chocolate-waffle': `${FRIES_BASE}/chocolate_waffle.png`,
  'triple-chocolate-waffle': `${FRIES_BASE}/chocolate_waffle.png`,
};

export const categoryFallbackMap: Record<string, string> = {
  Shawarma: classicRoll,
  Burgers: '/burger-images/burger_1_classic_chicken.png',
  Pizza: `${PIZZA_BASE}/veg-supreme-pizza.png`,
  Momos: `${MOMO_BASE}/veg_momos.png`,
  Toasts: `${TOAST_BASE}/cheese_toast.png`,
  Starters: `${STARTER_BASE}/chicken_popcorn.png`,
  'Loaded Fries': `${FRIES_BASE}/loaded_fries.png`,
  'Bring Your Own Chips': `${FRIES_BASE}/french_fries.png`,
  Desserts: `${FRIES_BASE}/brownie_icecream.png`,
  Mojitos: `${FRIES_BASE}/blue_mojito.png`,
  Milkshakes: `${FRIES_BASE}/vanilla_milkshake.png`,
  Waffles: `${FRIES_BASE}/chocolate_waffle.png`,
  'Combo Deals': classicPlate,
};

export const fallbackPlaceholder = comingSoonPlaceholder;
