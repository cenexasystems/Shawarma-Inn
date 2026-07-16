/**
 * Normalizes any Indian phone input to the 12-digit form 91XXXXXXXXXX.
 * Returns null for anything that cannot be reduced to a valid
 * 10-digit Indian subscriber number (first digit 6-9).
 */
export function normalizeIndianPhone(input: string): string | null {
  if (!input) return null;

  const raw = input.replace(/\D/g, '');
  if (!raw) return null;

  let digits = raw;

  if (digits.length === 12 && digits.startsWith('91')) {
    // already normalized
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = '91' + digits.slice(1);
  } else if (digits.length === 10) {
    digits = '91' + digits;
  } else {
    return null;
  }

  if (!/^91[6-9]\d{9}$/.test(digits)) return null;

  return digits;
}

/** Returns true when the input can be normalized to a valid Indian number. */
export function isValidIndianPhone(input: string): boolean {
  return normalizeIndianPhone(input) !== null;
}

/** Returns the 10-digit subscriber number (no country code). */
export function getSubscriberDigits(input: string): string | null {
  const normalized = normalizeIndianPhone(input);
  return normalized ? normalized.slice(2) : null;
}
