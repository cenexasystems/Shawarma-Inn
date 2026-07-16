export type CouponType = 'percentage' | 'fixed';

export interface Coupon {
  code: string;
  type: CouponType;
  /** Percentage points (e.g. 10 for 10%) when type is 'percentage', or rupees when type is 'fixed'. */
  value: number;
  active: boolean;
  /** Optional minimum items subtotal required for this coupon to apply. */
  minOrderValue?: number;
  /** Optional cap on the discount amount for percentage coupons. */
  maxDiscount?: number;
  description?: string;
}

/**
 * Source of truth for available coupons. Extend this list (or swap it for a
 * remote/admin-managed source) to add new coupons — never hardcode discount
 * logic at the call site.
 */
export const COUPONS: Coupon[] = [
  { code: 'WELCOME10', type: 'percentage', value: 10, active: true, maxDiscount: 100, description: '10% off, up to ₹100' },
  { code: 'FLAT50', type: 'fixed', value: 50, active: true, minOrderValue: 300, description: '₹50 off on orders above ₹300' },
];

export function findCoupon(code: string): Coupon | undefined {
  const normalized = code.trim().toUpperCase();
  return COUPONS.find((c) => c.code === normalized && c.active);
}

export interface CouponResult {
  valid: boolean;
  discount: number;
  error?: string;
  coupon?: Coupon;
}

/** Computes the discount amount for a coupon code against a given items subtotal. */
export function applyCoupon(code: string, itemsTotal: number): CouponResult {
  if (!code.trim()) {
    return { valid: false, discount: 0, error: 'Enter a coupon code.' };
  }

  const coupon = findCoupon(code);
  if (!coupon) {
    return { valid: false, discount: 0, error: 'Invalid or expired coupon code.' };
  }

  if (coupon.minOrderValue && itemsTotal < coupon.minOrderValue) {
    return {
      valid: false,
      discount: 0,
      error: `Add items worth ₹${coupon.minOrderValue - itemsTotal} more to use this coupon.`,
    };
  }

  let discount = coupon.type === 'percentage' ? (itemsTotal * coupon.value) / 100 : coupon.value;

  if (coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  discount = Math.min(discount, itemsTotal);

  return { valid: true, discount: Math.round(discount * 100) / 100, coupon };
}
