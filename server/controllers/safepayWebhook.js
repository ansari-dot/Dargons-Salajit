const crypto = require('crypto');
const db = require('../config/db');
const OrderModel = require('../models/orderModel');

/**
 * Verify incoming Safepay webhook signature
 * using HMAC SHA-256 + the raw request body.
 *
 * Safepay sends: x-sfpy-signature header
 */
const verifySignature = (rawBody, signature) => {
  if (!signature || !process.env.SAFEPAY_WEBHOOK_SECRET) return false;

  const expected = crypto
    .createHmac('sha256', process.env.SAFEPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
};

/**
 * POST /api/webhooks/safepay
 *
 * Handles Safepay webhook events:
 *   - payment.succeeded  → set payment_status = paid, order_status = processing, deduct product inventory stock
 *   - payment.failed     → set payment_status = failed
 *
 * IMPORTANT: This route must receive the raw (unparsed) body,
 *   registered in server/index.js BEFORE express.json() middleware.
 */
const safepayWebhook = async (req, res) => {
  let event;
  const signature = req.headers['x-sfpy-signature'];
  const rawBody   = req.body; // Buffer, because we used express.raw()

  // ── 1. Verify HMAC signature ────────────────────────────────────────────────
  const valid = verifySignature(rawBody, signature);
  if (!valid) {
    console.warn('[Safepay Webhook] Invalid signature — rejected');
    return res.status(401).send('Invalid signature');
  }

  // ── 2. Parse JSON body ───────────────────────────────────────────────────────
  try {
    event = JSON.parse(rawBody.toString());
  } catch (err) {
    console.error('[Safepay Webhook] Failed to parse JSON body:', err.message);
    return res.status(400).send('Bad JSON payload');
  }

  console.log('[Safepay Webhook] Event received:', event?.type);

  const tracker  = event?.data?.tracker;
  const eventId  = event?.id || null;
  const eventType = event?.type || 'unknown';

  // ── 3. Deduplicate — if this event_id was already processed, skip ───────────
  if (eventId) {
    const [dup] = await db.query(
      `SELECT id FROM payment_transactions WHERE event_id = ? LIMIT 1`,
      [eventId]
    ).catch(() => [[]]);

    if (dup.length > 0) {
      console.log('[Safepay Webhook] Duplicate event skipped:', eventId);
      return res.status(200).send('Already processed');
    }
  }

  // ── 4. Find matching order by safepay_tracker ───────────────────────────────
  let order = null;
  if (tracker) {
    const [rows] = await db.query(
      `SELECT * FROM orders WHERE safepay_tracker = ? LIMIT 1`,
      [tracker]
    ).catch(() => [[]]);

    if (rows.length > 0) order = rows[0];
  }

  // ── 5. Handle payment.succeeded ─────────────────────────────────────────────
  if (eventType === 'payment.succeeded') {
    if (!order) {
      console.warn('[Safepay Webhook] payment.succeeded — order not found for tracker:', tracker);
      return res.status(404).send('Order not found');
    }

    // Mark order paid & deduct product stock atomically in database
    const result = await OrderModel.markPaidAndDeductStock(order.id);

    if (result.alreadyPaid) {
      console.log(`[Safepay Webhook] Order ${order.order_number} already marked paid — skipping.`);
      return res.status(200).send('Already paid');
    }

    // Log the transaction event
    await db.query(
      `INSERT INTO payment_transactions
         (order_id, provider, tracker, event_type, amount, currency, status, event_id, raw_response)
       VALUES (?, 'safepay', ?, 'payment.succeeded', ?, 'PKR', 'paid', ?, ?)`,
      [
        order.id,
        tracker,
        Number(order.grand_total),
        eventId,
        JSON.stringify(event),
      ]
    ).catch((e) => console.warn('[Safepay Webhook] Failed to log transaction:', e.message));

    console.log(`[Safepay Webhook] ✅ Order ${order.order_number} marked as PAID, PROCESSING & stock deducted!`);
  }

  // ── 6. Handle payment.failed ─────────────────────────────────────────────────
  else if (eventType === 'payment.failed') {
    if (order && order.payment_status !== 'paid') {
      await db.query(
        `UPDATE orders SET payment_status = 'failed' WHERE id = ?`,
        [order.id]
      );
    }

    if (tracker) {
      await db.query(
        `INSERT INTO payment_transactions
           (order_id, provider, tracker, event_type, amount, currency, status, event_id, raw_response)
         VALUES (?, 'safepay', ?, 'payment.failed', ?, 'PKR', 'failed', ?, ?)`,
        [
          order?.id || 0,
          tracker,
          Number(order?.grand_total || 0),
          eventId,
          JSON.stringify(event),
        ]
      ).catch((e) => console.warn('[Safepay Webhook] Failed to log failed transaction:', e.message));
    }

    console.log('[Safepay Webhook] ❌ Payment failed for tracker:', tracker);
  }

  // ── 7. Unknown event type ─────────────────────────────────────────────────────
  else {
    console.log('[Safepay Webhook] Unhandled event type:', eventType);
  }

  return res.status(200).send('Webhook received');
};

module.exports = safepayWebhook;
