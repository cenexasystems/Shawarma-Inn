const CATEGORY_IMAGES: Record<string, string> = {
  Shawarma: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=450&fit=crop&q=70',
  Burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=450&fit=crop&q=70',
  Pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=450&fit=crop&q=70',
  Momos: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=450&fit=crop&q=70',
  Toasts: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=450&fit=crop&q=70',
  Starters: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&h=450&fit=crop&q=70',
  'Loaded Fries': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600&h=450&fit=crop&q=70',
  'Bring Your Own Chips': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&h=450&fit=crop&q=70',
  Desserts: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=450&fit=crop&q=70',
  Mojitos: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600&h=450&fit=crop&q=70',
  Milkshakes: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=450&fit=crop&q=70',
  Waffles: 'https://images.unsplash.com/photo-1598110750624-207050c4f28c?w=600&h=450&fit=crop&q=70',
  'Combo Deals': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=450&fit=crop&q=70',
};

const DEFAULT_CATEGORY_IMAGE = CATEGORY_IMAGES.Shawarma;

export function categoryFallbackImage(category?: string): string {
  if (!category) return DEFAULT_CATEGORY_IMAGE;
  return CATEGORY_IMAGES[category] || DEFAULT_CATEGORY_IMAGE;
}
