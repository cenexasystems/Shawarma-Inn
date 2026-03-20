import { useState, useEffect } from 'react';
import type { MenuItem } from '../types';
import localMenuData from '../data/menu.json';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../lib/runtime';

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
          }>).map((row) => ({
            id: row.id,
            name: row.name,
            desc: '',
            description: '',
            price: Number(row.price),
            category: row.category,
            rating: 4.8,
          }));
        } else {
          const response = await fetch('/api/menu-items');
          if (!response.ok) {
            throw new Error('Could not load menu from local API');
          }

          const payload = await response.json();
          menuItems = (payload.items || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            desc: '',
            description: '',
            price: Number(row.price),
            category: row.category,
            rating: 4.8,
          })) as MenuItem[];
        }

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
