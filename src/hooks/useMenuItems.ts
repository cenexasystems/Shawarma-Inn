import { useState, useEffect } from 'react';
import type { MenuItem } from '../types';
import localMenuData from '../data/menu.json';

export const useMenuItems = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const response = await fetch('/api/menu-items');
        if (!response.ok) {
          throw new Error('Could not load menu from local API');
        }

        const payload = await response.json();
        const menuItems = (payload.items || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          desc: '',
          description: '',
          price: Number(row.price),
          category: row.category,
          rating: 4.8,
        })) as MenuItem[];

        if (!menuItems.length) {
          setItems(localMenuData as MenuItem[]);
        } else {
          setItems(menuItems);
        }
      } catch (err) {
        setItems(localMenuData as MenuItem[]);
        setError(err instanceof Error ? err.message : 'Failed to load menu');
      }

      setLoading(false);
    };

    load();
  }, []);

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];

  return { items, loading, error, categories };
};
