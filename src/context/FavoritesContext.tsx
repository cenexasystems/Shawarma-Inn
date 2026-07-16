import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { MenuItem } from '../types';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/api';
import { useSupabaseAuth } from '../lib/runtime';

interface FavoritesContextType {
  favorites: MenuItem[];
  isFavorite: (id: string | number) => boolean;
  toggleFavorite: (item: MenuItem) => void;
  addFavorite: (item: MenuItem) => void;
  removeFavorite: (id: string | number) => void;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);
const STORAGE_KEY = 'si_favorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [favorites, setFavorites] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  const isLoggedIn = !!user?.id && user.role === 'user' && !!token && !useSupabaseAuth;

  // Load favorites from DB (if authenticated) or localStorage (guest)
  const loadFavorites = useCallback(async () => {
    if (isLoggedIn) {
      setLoading(true);
      try {
        const payload = await apiRequest<{ favorites: Array<{
          id: number;
          menu_item_id: number;
          name: string;
          price: number;
          category: string;
          image_url: string | null;
        }> }>('/users/favorites', { token: token! });

        // Merge DB favorites with any guest favorites stored in localStorage
        const guestRaw = localStorage.getItem(STORAGE_KEY);
        let guestFavorites: MenuItem[] = [];
        if (guestRaw) {
          try { guestFavorites = JSON.parse(guestRaw) as MenuItem[]; } catch { guestFavorites = []; }
        }

        const dbFavIds = new Set((payload.favorites || []).map((f) => f.menu_item_id));
        const newGuestFavs = guestFavorites.filter((g) => !dbFavIds.has(Number(g.id)));

        // Sync guest favorites to DB
        for (const gf of newGuestFavs) {
          try {
            await apiRequest('/users/favorites', {
              method: 'POST',
              token: token!,
              body: {
                menu_item_id: Number(gf.id),
                name: gf.name,
                price: Number(gf.price),
                category: gf.category,
                image_url: gf.image_url || null,
              },
            });
          } catch { /* ignore conflicts */ }
        }

        // Clear localStorage after merge
        localStorage.removeItem(STORAGE_KEY);

        // Re-fetch merged list
        const refreshed = await apiRequest<{ favorites: Array<{
          id: number; menu_item_id: number; name: string; price: number; category: string; image_url: string | null;
        }> }>('/users/favorites', { token: token! });

        const mapped: MenuItem[] = (refreshed.favorites || []).map((f) => ({
          id: f.menu_item_id,
          name: f.name,
          price: f.price,
          category: f.category,
          image_url: f.image_url || undefined,
          is_active: true,
          is_bestseller: false,
        }));

        setFavorites(mapped);
      } catch {
        // Fallback to localStorage
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try { setFavorites(JSON.parse(raw) as MenuItem[]); } catch { setFavorites([]); }
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Guest: use localStorage
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try { setFavorites(JSON.parse(raw) as MenuItem[]); } catch { setFavorites([]); }
      }
    }
  }, [isLoggedIn, token]);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  // Persist to localStorage for guests
  useEffect(() => {
    if (!isLoggedIn) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoggedIn]);

  const isFavorite = (id: string | number): boolean => {
    return favorites.some((fav) => String(fav.id) === String(id));
  };

  const addFavorite = async (item: MenuItem) => {
    if (favorites.some((fav) => String(fav.id) === String(item.id))) return;

    setFavorites((prev) => [...prev, item]);

    if (isLoggedIn) {
      try {
        await apiRequest('/users/favorites', {
          method: 'POST',
          token: token!,
          body: {
            menu_item_id: Number(item.id),
            name: item.name,
            price: Number(item.price),
            category: item.category,
            image_url: (item as any).image_url || null,
          },
        });
      } catch { /* optimistic update — ignore errors */ }
    }
  };

  const removeFavorite = async (id: string | number) => {
    setFavorites((prev) => prev.filter((fav) => String(fav.id) !== String(id)));

    if (isLoggedIn) {
      try {
        await apiRequest(`/users/favorites/${id}`, {
          method: 'DELETE',
          token: token!,
        });
      } catch { /* optimistic update — ignore errors */ }
    }
  };

  const toggleFavorite = (item: MenuItem) => {
    if (isFavorite(item.id)) {
      void removeFavorite(item.id);
    } else {
      void addFavorite(item);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        loading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
