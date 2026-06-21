export const CATEGORY_ORDER = [
  'Shawarma',
  'Burgers',
  'Pizza',
  'Momos',
  'Toasts',
  'Starters',
  'Loaded Fries',
  'Bring Your Own Chips',
  'Mojitos',
  'Milkshakes',
  'Waffles',
  'Desserts',
  'Combo Deals',
];

export function categoryRank(category: string): number {
  const index = CATEGORY_ORDER.findIndex(
    c => c.toLowerCase() === category.toLowerCase()
  );
  return index === -1 ? CATEGORY_ORDER.length : index;
}

export function sortByCategoryOrder<T extends { category: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => categoryRank(a.category) - categoryRank(b.category));
}
