import { useState, useEffect } from 'react';
import type { MenuItem } from '../types';
import localMenuData from '../data/menu.json';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../lib/runtime';
import { categoryFallbackImage } from '../utils/categoryImages';
import { sortByCategoryOrder } from '../utils/categoryOrder';

const localMenuByName = new Map(
  (localMenuData as MenuItem[]).map((item) => [item.name.trim().toLowerCase(), item]),
);

/**
 * The backend only stores id/name/price/category/is_active — slug, description,
 * isVeg, bestseller, and rating live in the curated local catalogue. Every
 * DB-sourced row must be enriched from there or those fields silently end up
 * undefined for the whole menu (breaking the veg filter and bestseller badge).
 */
function enrichMenuRow(row: { id: string | number; name: string; price: number; category: string }): MenuItem {
  const local = localMenuByName.get(row.name.trim().toLowerCase());
  return {
    id: row.id,
    slug: local?.slug,
    name: row.name,
    desc: local?.desc || '',
    description: local?.desc || '',
    price: Number(row.price),
    category: row.category,
    rating: local?.rating ?? 4.6,
    image: local?.image || categoryFallbackImage(row.category),
    isVeg: local?.isVeg,
    bestseller: local?.bestseller ?? false,
  };
}

export const useMenuItems = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        let menuItems: MenuItem[] = [];

        if (useSupabaseAuth) {
          const { data, error: supabaseError } = await supabase
            .from('menu_items')
            .select('id, name, price, category')
            .eq('is_available', true)
            .order('category', { ascending: true })
            .order('name', { ascending: true });

          if (supabaseError) {
            throw new Error(supabaseError.message);
          }

          menuItems = ((data || []) as Array<{
            id: string;
            name: string;
            price: number;
            category: string;
          }>).map(enrichMenuRow);
        } else {
          const response = await fetch('/api/menu-items');
          if (!response.ok) {
            throw new Error('Could not load menu from local API');
          }

          const payload = await response.json();
          menuItems = (payload.items || []).map(enrichMenuRow);
        }

        if (!menuItems.length) {
          setItems(sortByCategoryOrder(localMenuData as MenuItem[]));
        } else {
          setItems(sortByCategoryOrder(menuItems));
        }
      } catch (err) {
        setItems(sortByCategoryOrder(localMenuData as MenuItem[]));
        setError(err instanceof Error ? err.message : 'Failed to load menu');
      }

      setLoading(false);
    };

    load();
  }, []);

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];

  return { items, loading, error, categories };
};
