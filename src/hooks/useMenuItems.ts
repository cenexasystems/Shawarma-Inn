import { useState, useEffect, useCallback, useRef } from 'react';
import type { MenuItem } from '../types';
import localMenuData from '../data/menu.json';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../lib/runtime';
import { resolveMenuImage } from '../utils/menuImages';
import { sortByCategoryOrder } from '../utils/categoryOrder';

const localMenuByName = new Map(
  (localMenuData as MenuItem[]).map((item) => [item.name.trim().toLowerCase(), item]),
);

/**
 * Enrich a DB row with local catalogue metadata (slug, desc, isVeg, rating)
 * and resolve the best available image via the semantic image engine.
 *
 * Image resolution priority:
 *   1. DB image_url — absolute CDN/admin URL or Supabase Storage path
 *   2. Semantic name-based Unsplash fallback — NEVER crosses food categories
 *
 * Local JSON `image` paths (/images/menu/…) are NOT passed to resolveMenuImage
 * because those files don't exist in public/. Passing them would cause 404s
 * and a broken-image flash before onError fires.
 */
function enrichMenuRow(row: {
  id: string | number;
  name: string;
  price: number;
  category: string;
  image_url?: string | null;
}): MenuItem {
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
    image: resolveMenuImage({
      name: row.name,
      category: row.category,
      image_url: row.image_url ?? null,
    }),
    isVeg: local?.isVeg,
    bestseller: local?.bestseller ?? false,
  };
}

export const useMenuItems = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      let menuItems: MenuItem[] = [];

      if (useSupabaseAuth) {
        const { data, error: supabaseError } = await supabase
          .from('menu_items')
          .select('id, name, price, category, image_url')
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
          image_url?: string | null;
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
      setError(null);
    } catch (err) {
      setItems(sortByCategoryOrder(localMenuData as MenuItem[]));
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Subscribe to menu_updated SSE so customer-facing menu refreshes when admin edits
  useEffect(() => {
    if (useSupabaseAuth) return;

    const es = new EventSource('/api/events');
    sseRef.current = es;

    es.addEventListener('menu_updated', () => {
      void load();
    });

    return () => {
      es.close();
      sseRef.current = null;
    };
  }, [load]);

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))];

  return { items, loading, error, categories, refresh: load };
};
