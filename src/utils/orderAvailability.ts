export interface StoreHours {
  store_status?: string;
  opening_time?: string;
  closing_time?: string;
  business_hours?: { openingTime?: string; closingTime?: string; isClosed?: boolean };
}

function toMinutes(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const [hours, minutes] = value.split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : fallback;
}

export function isOrderingAvailable(settings: StoreHours, now = new Date()) {
  if (String(settings.store_status || 'OPEN').toUpperCase() !== 'OPEN') return false;
  if (settings.business_hours?.isClosed) return false;
  const opening = settings.opening_time || settings.business_hours?.openingTime || '17:00';
  const closing = settings.closing_time || settings.business_hours?.closingTime || '22:00';
  const current = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(opening, 17 * 60);
  const end = toMinutes(closing, 22 * 60);
  return start <= end ? current >= start && current <= end : current >= start || current <= end;
}

export function formatTime(value: string | undefined) {
  if (!value) return '';
  const [h, m] = value.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return value;
  return new Date(2000, 0, 1, h, m).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}
