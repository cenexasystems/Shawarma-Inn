import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { MenuItem } from '../types';

interface FavoritesContextType {
  favorites: MenuItem[];
  isFavorite: (id: string | number) => boolean;
  toggleFavorite: (item: MenuItem) => void;
  addFavorite: (item: MenuItem) => void;
  removeFavorite: (id: string | number) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);
const STORAGE_KEY = 'si_favorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<MenuItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as MenuItem[];
        setFavorites(parsed);
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  // Persist to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = (id: string | number): boolean => {
    return favorites.some(fav => fav.id === id);
  };

  const addFavorite = (item: MenuItem) => {
    if (!isFavorite(item.id)) {
      setFavorites([...favorites, item]);
    }
  };

  const removeFavorite = (id: string | number) => {
    setFavorites(favorites.filter(fav => fav.id !== id));
  };

  const toggleFavorite = (item: MenuItem) => {
    if (isFavorite(item.id)) {
      removeFavorite(item.id);
    } else {
      addFavorite(item);
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
