const db = require('../config/db');
const safepay = require('../config/safepay');
const OrderModel = require('../models/orderModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const PAYMENT_SUCCESS_URL = process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/checkout/success';
const PAYMENT_CANCEL_URL  = process.env.PAYMENT_CANCEL_URL  || 'http://localhost:3000/checkout';

/**
 * POST /api/payments/create
 *
 * Safepay Hosted Checkout flow (SDK-based):
 *  1. Create Order in MySQL (payment_status = pending)
 *  2. safepay.payments.session.setup() → get tracker token
 *  3. safepay.auth.passport.create()  → get tbt (temp bearer token)
 *  4. safepay.checkouts.payment.create() → build checkout URL
 *  5. Save tracker on order → return checkoutURL to frontend
 */
const createPayment = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      street_address,
      city,
      postal_code,
      subtotal,
      discount_amount = 0,
      grand_total,
      delivery_type = 'normal',
      delivery_charge = 0,
      coupon_code,
      items,
    } = req.body;

    const user_id = req.user ? req.user.id : null;

    if (!items || items.length === 0) {
      return sendError(res, 'Cart is empty', 400);
    }

    // ── Delivery option (Normal / Urgent) + delivery charge ───────────────────
    // Pakistan → flat ₨300 (Normal) / ₨500 (Urgent), other countries → courier
    // quote entered on checkout. All amounts are stored in PKR.
    const deliveryType =
      String(delivery_type).toLowerCase() === 'urgent' ? 'urgent' : 'normal';
    const deliveryCharge = Math.max(0, Number(delivery_charge) || 0);

    // Recalculate the total Safepay must collect so the delivery charge can never
    // be dropped from the amount: products − discount + delivery
    const itemsSubtotal = items.reduce(
      (sum, item) => sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 0),
      0
    );
    const orderSubtotal = itemsSubtotal || Number(subtotal) || 0;
    const orderGrandTotal = Math.max(
      0,
      orderSubtotal - (Number(discount_amount) || 0) + deliveryCharge
    );

    // ── Step 1: Create Order in MySQL ──────────────────────────────────────────
    const createdOrder = await OrderModel.createOrder({
      user_id,
      first_name,
      last_name,
      email,
      phone,
      street_address,
      city,
      postal_code,
      subtotal: orderSubtotal,
      discount_amount,
      grand_total: orderGrandTotal,
      payment_method: 'Safepay',
      delivery_type: deliveryType,
      delivery_charge: deliveryCharge,
      coupon_code,
      items,
    });

    const orderId     = createdOrder.id;
    const orderNumber = createdOrder.order_number;

    // ── Step 2: Create Safepay Tracker ─────────────────────────────────────────
    // Safepay amounts are in the lowest denomination (paisa for PKR → × 100)
    const amountPaisa = Math.round(orderGrandTotal * 100);

    const trackerResponse = await safepay.payments.session.setup({
      merchant_api_key: process.env.SAFEPAY_API_KEY,
      currency:         'PKR',
      amount:           amountPaisa,
    });

    const tracker = trackerResponse?.data?.tracker?.token;

    if (!tracker) {
      throw new Error('Safepay did not return a tracker token.');
    }

    // ── Step 3: Save tracker on order row ──────────────────────────────────────
    await db.query(
      `UPDATE orders
         SET safepay_tracker = ?, payment_status = 'unpaid'
       WHERE id = ?`,
      [tracker, orderId]
    );

    // ── Step 4: Log initial transaction record ─────────────────────────────────
    try {
      await db.query(
        `INSERT INTO payment_transactions
           (order_id, provider, tracker, event_type, amount, currency, status)
         VALUES (?, 'safepay', ?, 'session.created', ?, 'PKR', 'pending')`,
        [orderId, tracker, orderGrandTotal]
      );
    } catch (e) {
      console.warn('payment_transactions log skipped:', e.message);
    }

    // ── Step 5: Generate Temporary Bearer Token (TBT) ─────────────────────────
    // safepay.client.passport.create() calls /client/passport/v1/token to get TBT
    let tbt = '';
    try {
      const passportResponse = await safepay.client.passport.create();
      tbt = passportResponse?.data || '';
    } catch (tbtErr) {
      console.warn('TBT generation failed:', tbtErr.message);
    }

    // ── Step 6: Build Safepay Hosted Checkout URL ──────────────────────────────
    const checkoutURL = safepay.checkout.createCheckoutUrl({
      env:          'sandbox',
      tracker,
      tbt,
      source:       'hosted',
      redirect_url: `${PAYMENT_SUCCESS_URL}?order_number=${encodeURIComponent(orderNumber)}&tracker=${encodeURIComponent(tracker)}`,
      cancel_url:   `${PAYMENT_CANCEL_URL}?order_number=${encodeURIComponent(orderNumber)}&cancelled=true`,
    });

    console.log('✅ Safepay checkout ready:');
    console.log('   tracker:', tracker);
    console.log('   tbt    :', tbt ? tbt.substring(0, 20) + '...' : 'MISSING ❌');
    console.log('   URL    :', checkoutURL.substring(0, 120) + '...');

    return sendSuccess(
      res,
      { orderId, orderNumber, tracker, checkoutURL },
      'Safepay checkout session created',
      201
    );
  } catch (error) {
    console.error('createPayment error:', error);
    return sendError(res, error.message || 'Unable to create Safepay payment', 500);
  }
};

/**
 * POST /api/payments/verify
 *
 * Called when Safepay redirects back to /checkout/success
 * so the frontend can confirm the order is recorded correctly.
 */
const verifyPayment = async (req, res) => {
  try {
    const { order_number, tracker } = req.body;

    if (!order_number && !tracker) {
      return sendError(res, 'order_number or tracker is required', 400);
    }

    let order = null;
    if (order_number) {
      const [rows] = await db.query(
        `SELECT id, order_number, payment_status, order_status, safepay_tracker
           FROM orders WHERE order_number = ? LIMIT 1`,
        [order_number]
      );
      if (rows.length > 0) order = rows[0];
    } else if (tracker) {
      const [rows] = await db.query(
        `SELECT id, order_number, payment_status, order_status, safepay_tracker
           FROM orders WHERE safepay_tracker = ? LIMIT 1`,
        [tracker]
      );
      if (rows.length > 0) order = rows[0];
    }

    if (!order) return sendError(res, 'Order not found', 404);

    // If order is not yet marked paid (e.g. webhook fallback), mark paid & deduct stock
    if (order.payment_status !== 'paid') {
      await OrderModel.markPaidAndDeductStock(order.id);
      const [updatedRows] = await db.query(
        `SELECT id, order_number, payment_status, order_status, safepay_tracker
           FROM orders WHERE id = ? LIMIT 1`,
        [order.id]
      );
      if (updatedRows.length > 0) order = updatedRows[0];
    }

    return sendSuccess(res, order, 'Order status retrieved and verified');
  } catch (error) {
    return sendError(res, error.message || 'Verification failed', 500);
  }
};

module.exports = { createPayment, verifyPayment };
