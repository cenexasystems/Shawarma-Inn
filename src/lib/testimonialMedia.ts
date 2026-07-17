import { supabase } from './supabaseClient';

const STORAGE_BUCKET = 'testimonial-videos';

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, '');
}

export function resolveTestimonialMediaUrl(value: string | null | undefined): string {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (/^https?:\/\//i.test(raw) || raw.startsWith('blob:') || raw.startsWith('data:')) {
    return raw;
  }

  const normalized = raw.includes(STORAGE_BUCKET)
    ? raw.slice(raw.indexOf(STORAGE_BUCKET) + STORAGE_BUCKET.length + 1)
    : raw;

  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(trimSlashes(normalized)).data.publicUrl;
}
