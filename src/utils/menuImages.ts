/**
 * Product Image Intelligence Engine
 *
 * Priority chain for any menu item:
 *   1. Premium Commercial Assets (Local exact match in imageMap overrides EVERYTHING)
 *   2. DB image_url — absolute HTTP/S URL (e.g. admin-set Supabase Storage CDN link)
 *   3. DB image_url — Supabase Storage path (e.g. "menu-images/shawarma/…") → resolved via SDK
 *   4. Coming Soon Placeholder — The absolute final fallback. Never guess with generic foods.
 */

import { supabase } from '../lib/supabaseClient';
import type { MenuItem } from '../types';
import { imageMap, fallbackPlaceholder, categoryFallbackMap } from './imageMap';

// ─── Supabase Storage ─────────────────────────────────────────────────────────

const STORAGE_BUCKET = 'menu-images';

/** Resolves a Supabase Storage object path to its public CDN URL. */
export function storagePublicUrl(objectPath: string): string {
  const clean = objectPath.replace(/^\/?(menu-images\/)?/, '');
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(clean).data.publicUrl;
}

/** True when the string looks like a Supabase Storage object path rather than a full URL. */
function isStoragePath(s: string): boolean {
  return !!s && !s.startsWith('http://') && !s.startsWith('https://') && !s.startsWith('/');
}

// ─── Main resolver ────────────────────────────────────────────────────────────

/**
 * Resolves the best image URL for a menu item.
 * Priority:
 * 1. Exact match in imageMap by slug or name
 * 2. DB image_url (absolute or Supabase Storage)
 * 3. Coming Soon fallback placeholder
 */
export function resolveMenuImage(
  item: Pick<MenuItem, 'name' | 'category'> & { image?: string; image_url?: string | null; slug?: string },
): string {
  const dbSlug = item.slug;
  const nameSlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // 1. Premium Commercial Assets (Local exact match overrides EVERYTHING)
  if (dbSlug && imageMap[dbSlug]) return imageMap[dbSlug];
  if (imageMap[nameSlug]) return imageMap[nameSlug];

  // 2. DB image_url (absolute, local public path, or Supabase Storage)
  const dbUrl = item.image_url || item.image || null;

  if (dbUrl) {
    if (dbUrl.startsWith('/')) return dbUrl; // Local public asset
    if (isStoragePath(dbUrl)) return storagePublicUrl(dbUrl);
    if (dbUrl.startsWith('http://') || dbUrl.startsWith('https://')) return dbUrl;
  }

  // 3. Strict category fallback (prevent empty images but maintain cuisine accuracy)
  if (item.category && categoryFallbackMap[item.category]) {
    return categoryFallbackMap[item.category];
  }

  // 4. Absolute fallback placeholder (never guess or use cross-category foods)
  return fallbackPlaceholder;
}

/**
 * Recovery URL when the primary src fails (onError handler).
 */
export function getRecoveryImage(item: Pick<MenuItem, 'name' | 'category'> & { slug?: string }): string {
  const nameSlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  if (item.category && categoryFallbackMap[item.category]) {
    return categoryFallbackMap[item.category];
  }

  return fallbackPlaceholder;
}
