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
  'mix-veg-momos': '/images/menu/generated/veg_momos.png',
  'cheese-corn-momos': '/images/menu/generated/veg_momos.png',
  'paneer-tikka-momos': '/images/menu/generated/veg_momos.png',
  'chicken-momos': '/images/menu/generated/chicken_momos.png',
  'peri-peri-chicken-momos': '/images/menu/generated/chicken_momos.png',
  'schezwan-chicken-momos': '/images/menu/generated/chicken_momos.png',
  'chicken-tikka-momos': '/images/menu/generated/chicken_momos.png',
  'chocolate-toast': '/images/menu/generated/chocolate_toast.png',
  'white-chocolate-toast': '/images/menu/generated/chocolate_toast.png',
  'veg-cheese-toast': '/images/menu/generated/cheese_toast.png',
  'sweet-corn-cheese-toast': '/images/menu/generated/cheese_toast.png',
  'paneer-cheese-toast': '/images/menu/generated/cheese_toast.png',
  'bbq-paneer-cheese-toast': '/images/menu/generated/cheese_toast.png',
  'veg-club-cheese-toast': '/images/menu/generated/cheese_toast.png',
  'sweet-corn-cheese-club-toast': '/images/menu/generated/cheese_toast.png',
  'paneer-cheese-club-toast': '/images/menu/generated/cheese_toast.png',
  'bbq-paneer-club-cheese-toast': '/images/menu/generated/cheese_toast.png',
  'toast-veg-add-on-flavour': '/images/menu/generated/cheese_toast.png',
  'grill-chicken-cheese-toast': '/images/menu/generated/chicken_toast.png',
  'fried-chicken-cheese-toast': '/images/menu/generated/chicken_toast.png',
  'bbq-chicken-cheese-toast': '/images/menu/generated/chicken_toast.png',
  'bbq-sausage-chicken-cheese-toast': '/images/menu/generated/chicken_toast.png',
  'grill-chicken-club-cheese-toast': '/images/menu/generated/chicken_toast.png',
  'bbq-chicken-club-cheese-toast': '/images/menu/generated/chicken_toast.png',
  'fried-chicken-club-cheese-toast': '/images/menu/generated/chicken_toast.png',
  'toast-chicken-add-on-flavour': '/images/menu/generated/chicken_toast.png',
  'toast-chicken-add-on-cheese': '/images/menu/generated/chicken_toast.png',
  'masala-fries': '/images/menu/generated/french_fries.png',
  'cheese-corn-nuggets-8pc': '/images/menu/generated/chicken_popcorn.png',
  'veg-roll': '/images/menu/generated/chicken_roll.png',
  'paneer-roll': '/images/menu/generated/chicken_roll.png',
  'chicken-popcorn-130gms': '/images/menu/generated/chicken_popcorn.png',
  'masala-chicken-popcorn-130gms': '/images/menu/generated/chicken_popcorn.png',
  'sweet-chilli-chicken-popcorn-130gms': '/images/menu/generated/chicken_popcorn.png',
  'chicken-nuggets-6pc': '/images/menu/generated/chicken_popcorn.png',
  'chicken-wings-4pc': '/images/menu/generated/chicken_popcorn.png',
  'chicken-cheese-balls-8pc': '/images/menu/generated/chicken_popcorn.png',
  'chicken-fingers-8pc': '/images/menu/generated/chicken_popcorn.png',
  'chicken-roll': '/images/menu/generated/chicken_roll.png',
  'veg-loaded-french-fries': '/images/menu/generated/loaded_fries.png',
  'paneer-loaded-french-fries': '/images/menu/generated/loaded_fries.png',
  'chicken-loaded-french-fries': '/images/menu/generated/loaded_fries.png',
  'bring-your-own-chips-veg': '/images/menu/generated/french_fries.png',
  'bring-your-own-chips-paneer': '/images/menu/generated/french_fries.png',
  'bring-your-own-chips-chicken': '/images/menu/generated/french_fries.png',
  'ice-cream-scoop': '/images/menu/generated/brownie_icecream.png',
  'brownie-with-ice-cream': '/images/menu/generated/brownie_icecream.png',
  'chocolava-with-ice-cream': '/images/menu/generated/brownie_icecream.png',
  'blue-curacao-mojito': '/images/menu/generated/blue_mojito.png',
  'grape-mojito': '/images/menu/generated/red_mojito.png',
  'mango-mojito': '/images/menu/generated/yellow_mojito.png',
  'guava-mojito': '/images/menu/generated/yellow_mojito.png',
  'pineapple-mojito': '/images/menu/generated/yellow_mojito.png',
  'pomegranate-mojito': '/images/menu/generated/red_mojito.png',
  'orange-mojito': '/images/menu/generated/yellow_mojito.png',
  'blue-berry-mojito': '/images/menu/generated/blue_mojito.png',
  'vanilla-milkshake': '/images/menu/generated/vanilla_milkshake.png',
  'strawberry-milkshake': '/images/menu/generated/vanilla_milkshake.png',
  'butterscotch-milkshake': '/images/menu/generated/vanilla_milkshake.png',
  'chocolate-milkshake': '/images/menu/generated/chocolate_milkshake.png',
  'black-currant-milkshake': '/images/menu/generated/vanilla_milkshake.png',
  'oreo-milkshake': '/images/menu/generated/vanilla_milkshake.png',
  'kitkat-milkshake': '/images/menu/generated/vanilla_milkshake.png',
  'brownie-milkshake': '/images/menu/generated/vanilla_milkshake.png',
  'nutella-waffle': '/images/menu/generated/nutella_waffle.png',
  'milk-chocolate-waffle': '/images/menu/generated/chocolate_waffle.png',
  'dark-chocolate-waffle': '/images/menu/generated/chocolate_waffle.png',
  'white-chocolate-waffle': '/images/menu/generated/chocolate_waffle.png',
  'kit-kat-chocolate-waffle': '/images/menu/generated/chocolate_waffle.png',
  'oreo-chocolate-waffle': '/images/menu/generated/chocolate_waffle.png',
  'white-dark-chocolate-waffle': '/images/menu/generated/chocolate_waffle.png',
  'triple-chocolate-waffle': '/images/menu/generated/chocolate_waffle.png',
};

﻿import classicRoll from '../assets/Classic chicken shawarma.png';
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
import jalapenoRoll from '../assets/Jalape├▒o Shawarma.png';
import jalapenoPlate from '../assets/Jalape├▒o Plate.png';
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

// ΓöÇΓöÇ Burger Images (served from /burger-images/ public folder) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  
  // ΓöÇΓöÇ Auto-Mapped Placeholders ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  'mix-veg-momos': '/images/menu/generated/veg_momos.png',
  'cheese-corn-momos': '/images/menu/generated/veg_momos.png',
  'paneer-tikka-momos': '/images/menu/generated/veg_momos.png',
  'chicken-momos': '/images/menu/generated/chicken_momos.png',
  'peri-peri-chicken-momos': '/images/menu/generated/chicken_momos.png',
  'schezwan-chicken-momos': '/images/menu/generated/chicken_momos.png',
  'chicken-tikka-momos': '/images/menu/generated/chicken_momos.png',
  'chocolate-toast': '/images/menu/generated/chocolate_toast.png',
  'white-chocolate-toast': '/images/menu/generated/chocolate_toast.png',
  'veg-cheese-toast': '/images/menu/generated/cheese_toast.png',
  'sweet-corn-cheese-toast': '/images/menu/generated/cheese_toast.png',
  'paneer-cheese-toast': '/images/menu/generated/cheese_toast.png',
  'bbq-paneer-cheese-toast': '/images/menu/generated/cheese_toast.png',
  'veg-club-cheese-toast': '/images/menu/generated/cheese_toast.png',
  'sweet-corn-cheese-club-toast': '/images/menu/generated/cheese_toast.png',
  'paneer-cheese-club-toast': '/images/menu/generated/cheese_toast.png',
  'bbq-paneer-club-cheese-toast': '/images/menu/generated/cheese_toast.png',
  'toast-veg-add-on-flavour': '/images/menu/generated/cheese_toast.png',
  'grill-chicken-cheese-toast': '/images/menu/generated/chicken_toast.png',
  'fried-chicken-cheese-toast': '/images/menu/generated/chicken_toast.png',
  'bbq-chicken-cheese-toast': '/images/menu/generated/chicken_toast.png',
  'bbq-sausage-chicken-cheese-toast': '/images/menu/generated/chicken_toast.png',
  'grill-chicken-club-cheese-toast': '/images/menu/generated/chicken_toast.png',
  'bbq-chicken-club-cheese-toast': '/images/menu/generated/chicken_toast.png',
  'fried-chicken-club-cheese-toast': '/images/menu/generated/chicken_toast.png',
  'toast-chicken-add-on-flavour': '/images/menu/generated/chicken_toast.png',
  'toast-chicken-add-on-cheese': '/images/menu/generated/chicken_toast.png',
  'masala-fries': '/images/menu/generated/french_fries.png',
  'cheese-corn-nuggets-8pc': '/images/menu/generated/chicken_popcorn.png',
  'veg-roll': '/images/menu/generated/chicken_roll.png',
  'paneer-roll': '/images/menu/generated/chicken_roll.png',
  'chicken-popcorn-130gms': '/images/menu/generated/chicken_popcorn.png',
  'masala-chicken-popcorn-130gms': '/images/menu/generated/chicken_popcorn.png',
  'sweet-chilli-chicken-popcorn-130gms': '/images/menu/generated/chicken_popcorn.png',
  'chicken-nuggets-6pc': '/images/menu/generated/chicken_popcorn.png',
  'chicken-wings-4pc': '/images/menu/generated/chicken_popcorn.png',
  'chicken-cheese-balls-8pc': '/images/menu/generated/chicken_popcorn.png',
  'chicken-fingers-8pc': '/images/menu/generated/chicken_popcorn.png',
  'chicken-roll': '/images/menu/generated/chicken_roll.png',
  'veg-loaded-french-fries': '/images/menu/generated/loaded_fries.png',
  'paneer-loaded-french-fries': '/images/menu/generated/loaded_fries.png',
  'chicken-loaded-french-fries': '/images/menu/generated/loaded_fries.png',
  'bring-your-own-chips-veg': '/images/menu/generated/french_fries.png',
  'bring-your-own-chips-paneer': '/images/menu/generated/french_fries.png',
  'bring-your-own-chips-chicken': '/images/menu/generated/french_fries.png',
  'ice-cream-scoop': '/images/menu/generated/brownie_icecream.png',
  'brownie-with-ice-cream': '/images/menu/generated/brownie_icecream.png',
  'chocolava-with-ice-cream': '/images/menu/generated/brownie_icecream.png',
  'blue-curacao-mojito': '/images/menu/generated/blue_mojito.png',
  'grape-mojito': '/images/menu/generated/red_mojito.png',
  'mango-mojito': '/images/menu/generated/yellow_mojito.png',
  'guava-mojito': '/images/menu/generated/yellow_mojito.png',
  'pineapple-mojito': '/images/menu/generated/yellow_mojito.png',
  'pomegranate-mojito': '/images/menu/generated/red_mojito.png',
  'orange-mojito': '/images/menu/generated/yellow_mojito.png',
  'blue-berry-mojito': '/images/menu/generated/blue_mojito.png',
  'vanilla-milkshake': '/images/menu/generated/vanilla_milkshake.png',
  'strawberry-milkshake': '/images/menu/generated/vanilla_milkshake.png',
  'butterscotch-milkshake': '/images/menu/generated/vanilla_milkshake.png',
  'chocolate-milkshake': '/images/menu/generated/chocolate_milkshake.png',
  'black-currant-milkshake': '/images/menu/generated/vanilla_milkshake.png',
  'oreo-milkshake': '/images/menu/generated/vanilla_milkshake.png',
  'kitkat-milkshake': '/images/menu/generated/vanilla_milkshake.png',
  'brownie-milkshake': '/images/menu/generated/vanilla_milkshake.png',
  'nutella-waffle': '/images/menu/generated/chocolate_waffle.png',
  'milk-chocolate-waffle': '/images/menu/generated/chocolate_waffle.png',
  'dark-chocolate-waffle': '/images/menu/generated/chocolate_waffle.png',
  'white-chocolate-waffle': '/images/menu/generated/chocolate_waffle.png',
  'kit-kat-chocolate-waffle': '/images/menu/generated/chocolate_waffle.png',
  'oreo-chocolate-waffle': '/images/menu/generated/chocolate_waffle.png',
  'white-dark-chocolate-waffle': '/images/menu/generated/chocolate_waffle.png',
  'triple-chocolate-waffle': '/images/menu/generated/chocolate_waffle.png',
};
