function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Master GST switch. When false, GST is never calculated or shown anywhere. */
export const GST_ENABLED = parseBool(import.meta.env.VITE_GST_ENABLED, true);

/** GST rate applied to the items subtotal when GST is enabled and prices are tax-exclusive. */
export const GST_PERCENTAGE = parseNumber(import.meta.env.VITE_GST_PERCENTAGE, 5);

/**
 * Whether menu prices already include GST.
 * true  -> prices are tax-inclusive, no GST is added at checkout.
 * false -> prices are tax-exclusive, GST is added on top at checkout.
 */
export const PRICES_INCLUDE_GST = parseBool(import.meta.env.VITE_PRICES_INCLUDE_GST, false);

export const DELIVERY_CHARGE = 0;

export const PACKING_CHARGE = 0;

/** True when GST should actually be charged (master switch on AND prices are tax-exclusive). */
export const GST_ACTIVE = GST_ENABLED && !PRICES_INCLUDE_GST;

/** Computes GST on a taxable amount using the shared config. Returns 0 when GST is not active. */
export function computeGst(taxableAmount: number): number {
  return GST_ACTIVE ? round2(taxableAmount * (GST_PERCENTAGE / 100)) : 0;
}

export type DeliveryMethod = 'delivery' | 'pickup';

export interface CheckoutTotals {
  itemsTotal: number;
  deliveryCharge: number;
  packingCharge: number;
  gstEnabled: boolean;
  gstPercentage: number;
  gst: number;
  discount: number;
  couponCode?: string;
  grandTotal: number;
}

/**
 * Computes the checkout-only charges (delivery, packing, GST) on top of the cart's
 * items subtotal. GST is only added when GST_ENABLED is true AND prices are
 * tax-exclusive (PRICES_INCLUDE_GST is false) — otherwise it is already baked
 * into the item prices and must not be charged again.
 *
 * `discount` is applied to the items subtotal before GST, delivery, and packing
 * are calculated (i.e. it reduces the taxable amount).
 */
export function computeCheckoutTotals(
  itemsTotal: number,
  deliveryMethod: DeliveryMethod = 'delivery',
  discount = 0,
  couponCode?: string
): CheckoutTotals {
  const cappedDiscount = round2(Math.max(0, Math.min(discount, itemsTotal)));
  const taxableAmount = round2(itemsTotal - cappedDiscount);
  const deliveryCharge = deliveryMethod === 'delivery' ? DELIVERY_CHARGE : 0;
  const packingCharge = PACKING_CHARGE;
  const gstEnabled = GST_ENABLED && !PRICES_INCLUDE_GST;
  const gst = gstEnabled ? round2(taxableAmount * (GST_PERCENTAGE / 100)) : 0;
  const grandTotal = round2(taxableAmount + deliveryCharge + packingCharge + gst);

  return {
    itemsTotal: round2(itemsTotal),
    deliveryCharge,
    packingCharge,
    gstEnabled,
    gstPercentage: GST_PERCENTAGE,
    gst,
    discount: cappedDiscount,
    couponCode,
    grandTotal,
  };
}
