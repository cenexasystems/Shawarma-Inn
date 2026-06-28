export const imageMap: Record<string, string> = {
  // Classic Shawarma Roll
  'classic-shawarma-roll': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=450&fit=crop&q=75&auto=format',
  'classic-shawarma-roll-large': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=450&fit=crop&q=75&auto=format',
  'classic-shawarma-plate': 'https://images.unsplash.com/photo-1633321702518-7feccafb94d5?w=600&h=450&fit=crop&q=75&auto=format',
  'classic-shawarma-plate-large': 'https://images.unsplash.com/photo-1633321702518-7feccafb94d5?w=600&h=450&fit=crop&q=75&auto=format',

  // Paneer Shawarma Roll
  'paneer-shawarma': 'https://images.unsplash.com/photo-1645696301807-cd56bc1f3a4b?w=600&h=450&fit=crop&q=75&auto=format',
  'paneer-platter': 'https://images.unsplash.com/photo-1645696301807-cd56bc1f3a4b?w=600&h=450&fit=crop&q=75&auto=format',

  // Veg Shawarma Roll
  'veg-shawarma': 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&h=450&fit=crop&q=75&auto=format',
  'veg-platter': 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&h=450&fit=crop&q=75&auto=format',

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
  'Shawarma': 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=450&fit=crop&q=75&auto=format',
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
