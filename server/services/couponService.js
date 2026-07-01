import { db } from '../db.js';

export function validateCouponForOrder(rawCode, itemsTotal) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, error: 'Enter a coupon code.' };
  }

  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(code);
  if (!coupon) {
    return { valid: false, error: 'Invalid or inactive coupon code.' };
  }

  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
    return { valid: false, error: 'This coupon has expired.' };
  }

  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, error: 'Coupon usage limit has been reached.' };
  }

  if (coupon.min_order_value && itemsTotal < coupon.min_order_value) {
    return { valid: false, error: `Minimum order of ₹${coupon.min_order_value} required for this coupon.` };
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = itemsTotal * (coupon.discount_value / 100);
  } else if (coupon.discount_type === 'flat') {
    discount = coupon.discount_value;
  }

  if (coupon.max_discount) {
    discount = Math.min(discount, coupon.max_discount);
  }
  discount = Math.round(Math.min(discount, itemsTotal) * 100) / 100;

  return {
    valid: true,
    coupon: {
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
    },
    discount,
  };
}
