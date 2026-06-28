/**
 * Product Image Intelligence Engine
 *
 * Priority chain for any menu item:
 *   1. DB image_url — absolute HTTP/S URL (e.g. admin-set Supabase Storage CDN link)
 *   2. DB image_url — Supabase Storage path (e.g. "menu-images/shawarma/…") → resolved via SDK
 *   3. DB image_url / local JSON image — local path (e.g. "/images/menu/…") → served if file exists
 *   4. Semantic name match → verified Unsplash image for that EXACT food sub-type
 *   5. Category fallback → correct-category Unsplash pool (never crosses food types)
 *
 * Rule: a milkshake will NEVER show a burger image.
 *       A shawarma will NEVER show a pizza image.
 */

import { supabase } from '../lib/supabaseClient';
import type { MenuItem } from '../types';
import { imageMap, categoryFallbackMap } from './imageMap';

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
 * 1. DB image_url (absolute or Supabase Storage)
 * 2. Exact match in imageMap by slug or name
 * 3. Category fallback in categoryFallbackMap
 * 4. Absolute ultimate fallback (Shawarma)
 */
export function resolveMenuImage(
  item: Pick<MenuItem, 'name' | 'category'> & { image?: string; image_url?: string | null; slug?: string },
): string {
  const dbUrl = item.image_url ?? null;

  if (dbUrl) {
    if (isStoragePath(dbUrl)) return storagePublicUrl(dbUrl);
    if (dbUrl.startsWith('http://') || dbUrl.startsWith('https://')) return dbUrl;
  }

  // Generate a fallback slug from name if slug isn't provided
  const slug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Exact map match
  if (imageMap[slug]) return imageMap[slug];

  // Category fallback
  if (categoryFallbackMap[item.category]) return categoryFallbackMap[item.category];

  // Absolute fallback
  return categoryFallbackMap['Shawarma'];
}

/**
 * Recovery URL when the primary src fails (onError handler).
 */
export function getRecoveryImage(item: Pick<MenuItem, 'name' | 'category'> & { slug?: string }): string {
  const slug = item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (imageMap[slug]) return imageMap[slug];
  if (categoryFallbackMap[item.category]) return categoryFallbackMap[item.category];
  return categoryFallbackMap['Shawarma'];
}

