import { useFavorites } from '../context/FavoritesContext';

export function useFavoritesHook() {
  return useFavorites();
}
