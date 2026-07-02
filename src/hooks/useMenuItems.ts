import { useState, useEffect, useCallback, useRef } from 'react';
import type { MenuItem } from '../types';
import { supabase } from '../lib/supabaseClient';
import { isLocalHost, useSupabaseAuth } from '../lib/runtime';
import { resolveMenuImage } from '../utils/menuImages';

/**
 * Cleanly map a DB row to the MenuItem interface.
 * The SQLite database is now the Single Source of Truth.
 */
function mapMenuRow(row: any): MenuItem {
  return {
    id: row.id,
    slug: row.slug || '',
    name: row.name,
    desc: row.description || '',
    description: row.description || '',
    price: Number(row.price),
    large_price: row.large_price ? Number(row.large_price) : undefined,
    category: row.category,
    rating: row.rating ?? 4.6,
    image: resolveMenuImage({
      name: row.name,
      category: row.category,
      image_url: row.image_url ?? null,
    }),
    isVeg: Boolean(row.is_veg),
    bestseller: Boolean(row.is_bestseller),
    is_bestseller: Boolean(row.is_bestseller),
    trending: Boolean(row.is_trending),
    display_order: Number(row.display_order) || 0,
    is_active: row.is_active ?? row.is_available ?? true,
  };
}

function isRowActive(row: any): boolean {
  const value = row?.is_active ?? row?.is_available;

  if (value === undefined || value === null) {
    return true;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    return value !== '0' && value.toLowerCase() !== 'false';
  }

  return Boolean(value);
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
          .select('*')
          .order('display_order', { ascending: true })
          .order('name', { ascending: true });

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        menuItems = (data || [])
          .filter(isRowActive)
          .map(mapMenuRow);

        if (menuItems.length === 0 && isLocalHost) {
          const response = await fetch('/api/menu-items');
          if (!response.ok) {
            throw new Error('Could not load menu from local API');
          }

          const payload = await response.json();
          menuItems = (payload.items || [])
            .filter(isRowActive)
            .map(mapMenuRow);
        }
      } else {
        const response = await fetch('/api/menu-items');
        if (!response.ok) {
          throw new Error('Could not load menu from local API');
        }

        const payload = await response.json();
        menuItems = (payload.items || []).map(mapMenuRow);
      }

      setItems(menuItems);
      setError(null);
    } catch (err) {
      console.error(err);
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
