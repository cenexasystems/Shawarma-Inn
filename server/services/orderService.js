import { db, getNextOrderNumber, recordOrderStatusChange } from '../db.js';
import { validateCouponForOrder } from './couponService.js';
import { broadcastSSE } from '../events/sse.js';

export const ADMIN_ORDER_STATUSES = ['pending', 'accepted', 'processing', 'preparing', 'ready', 'in_transit', 'completed', 'cancelled'];
export const REVENUE_COUNTED_STATUS = 'completed';

export function normalizeCheckoutItems(cartItems) {
  return cartItems
    .map((item) => ({
      menu_item_id: Number(item.id) || null,
      name: String(item.name || '').trim(),
      quantity: Number(item.qty) || Number(item.quantity) || 1,
      price: Number(item.price) || 0,
    }))
    .filter((item) => item.name && item.quantity > 0 && item.price >= 0);
}

export function createOrderWithItems({
  userId,
  customerName,
  customerPhone,
  customerEmail,
  deliveryType,
  deliveryAddress,
  couponCode,
  discountAmount,
  gstAmount,
  packingCharge,
  notes,
  source,
  status,
  items,
}) {
  const runTx = db.transaction((payload) => {
    const orderNumber = getNextOrderNumber();
    const now = new Date().toISOString();

    const itemsTotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const calculatedTotal =
      itemsTotal +
      (payload.gstAmount || 0) +
      (payload.packingCharge || 0) -
      (payload.discountAmount || 0);

    const insertOrder = db.prepare(
      `INSERT INTO orders (
        order_number,
        user_id,
        total,
        status,
        customer_name,
        customer_phone,
        customer_email,
        delivery_type,
        delivery_address,
        coupon_code,
        discount_amount,
        gst_amount,
        packing_charge,
        notes,
        source,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const insertOrderItem = db.prepare(
      `INSERT INTO order_items (order_id, menu_item_id, name, quantity, price)
       VALUES (?, ?, ?, ?, ?)`
    );

    const orderResult = insertOrder.run(
      orderNumber,
      payload.userId ?? null,
      Math.max(calculatedTotal, 0),
      payload.status,
      payload.customerName ?? null,
      payload.customerPhone ?? null,
      payload.customerEmail ?? null,
      payload.deliveryType ?? 'store_pickup',
      payload.deliveryAddress ?? null,
      payload.couponCode ?? null,
      payload.discountAmount ?? 0,
      payload.gstAmount ?? 0,
      payload.packingCharge ?? 0,
      payload.notes ?? null,
      payload.source ?? 'checkout',
      now,
      now,
    );

    const orderId = Number(orderResult.lastInsertRowid);

    for (const item of payload.items) {
      insertOrderItem.run(
        orderId,
        item.menu_item_id ?? null,
        item.name,
        item.quantity,
        item.price,
      );
    }

    recordOrderStatusChange(orderId, payload.status, payload.userId ?? null, 'Order created');

    const orderRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    return orderRow;
  });

  return runTx({
    userId, customerName, customerPhone, customerEmail, deliveryType,
    deliveryAddress, couponCode, discountAmount, gstAmount, packingCharge, notes, source, status, items,
  });
}

export function getOrderWithItems(orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return null;
  const items = db.prepare(
    'SELECT id, name, quantity, price FROM order_items WHERE order_id = ?'
  ).all(orderId);
  return { ...order, items };
}
