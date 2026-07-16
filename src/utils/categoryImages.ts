/**
 * Category-level image fallbacks.
 * All pools contain only images verified to match the category.
 *
 * Bug fixed: Milkshakes previously contained photo-1568901346375 (a burger).
 * That entry has been removed.
 *
 * Prefer resolveMenuImage() from menuImages.ts for item-level semantic accuracy.
 * This file is kept for backward-compatibility with TrendingProducts and legacy callers.
 */

const CATEGORY_IMAGES: Record<string, string[]> = {
  Shawarma: [
    'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1633321702518-7feccafb94d5?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1645696301807-cd56bc1f3a4b?w=600&h=450&fit=crop&q=75&auto=format',
  ],
  Burgers: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&h=450&fit=crop&q=75&auto=format',
  ],
  Pizza: [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1593560708920-61b98ae7d6b6?w=600&h=450&fit=crop&q=75&auto=format',
  ],
  Momos: [
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=600&h=450&fit=crop&q=75&auto=format',
  ],
  Toasts: [
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&h=450&fit=crop&q=75&auto=format',
  ],
  Starters: [
    'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&h=450&fit=crop&q=75&auto=format',
  ],
  'Loaded Fries': [
    'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&h=450&fit=crop&q=75&auto=format',
  ],
  'Bring Your Own Chips': [
    'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1599490659213-e0b95217bc16?w=600&h=450&fit=crop&q=75&auto=format',
  ],
  Desserts: [
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=600&h=450&fit=crop&q=75&auto=format',
  ],
  Mojitos: [
    'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=600&h=450&fit=crop&q=75&auto=format',
  ],
  // FIXED: removed photo-1568901346375 (burger) — milkshakes now only show milkshake images
  Milkshakes: [
    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=450&fit=crop&q=75&auto=format',
  ],
  Waffles: [
    'https://images.unsplash.com/photo-1598110750624-207050c4f28c?w=600&h=450&fit=crop&q=75&auto=format',
    'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&h=450&fit=crop&q=75&auto=format',
  ],
  'Combo Deals': [
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=450&fit=crop&q=75&auto=format',
  ],
};

function hashSeed(seed: string | number): number {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function categoryFallbackImage(category?: string, seed?: string | number): string {
  const images = (category && CATEGORY_IMAGES[category]) || CATEGORY_IMAGES.Shawarma;
  if (seed === undefined) return images[0];
  return images[hashSeed(seed) % images.length];
}
