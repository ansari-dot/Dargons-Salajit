const db = require('../config/db');

class OrderModel {
  // Create order with line items and atomic inventory deduction
  static async createOrder(orderData) {
    const { items = [] } = orderData;

    // Auto-create missing inventory rows in AUTOCOMMIT, BEFORE the transaction.
    // Doing INSERT IGNORE inside the transaction takes duplicate-key shared locks
    // that the guarded UPDATE below must upgrade → InnoDB deadlocks under
    // concurrent checkout. As standalone autocommit statements they commit alone.
    for (const item of items) {
      if (item && item.product_id) {
        await db.query(
          `INSERT IGNORE INTO inventory (product_id, variantId, stock_quantity, reserved_quantity, reorder_level, availability_status)
           VALUES (?, ?, 50, 0, 10, 'In Stock')`,
          [item.product_id, item.product_id]
        );
      }
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const {
        user_id = null,
        first_name,
        last_name,
        email,
        phone,
        street_address,
        city,
        postal_code,
        subtotal,
        discount_amount = 0.00,
        grand_total,
        payment_method = 'Cash on Delivery',
        delivery_type = 'normal',
        delivery_charge = 0.00,
        coupon_code = null,
        couponCode = null
      } = orderData;

      const appliedCode = coupon_code || couponCode;

      // 1. Generate unique Order Number — timestamp + random suffix so two
      //    checkouts in the same millisecond can never collide on the UNIQUE key
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')}`;

      // Normalise the delivery option + charge (kept in PKR like every total)
      const deliveryType = String(delivery_type).toLowerCase() === 'urgent' ? 'urgent' : 'normal';
      const deliveryCharge = Math.max(0, Number(delivery_charge) || 0);

      // 2. Insert Order Header
      const [orderRes] = await connection.query(
        `INSERT INTO orders (order_number, user_id, first_name, last_name, email, phone, street_address, city, postal_code, subtotal, discount_amount, delivery_charge, grand_total, payment_method, delivery_type, order_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [orderNumber, user_id, first_name, last_name, email, phone, street_address, city, postal_code, subtotal, discount_amount, deliveryCharge, grand_total, payment_method, deliveryType]
      );

      const orderId = orderRes.insertId;

      // 3. Record Coupon Usage if applied
      if (appliedCode) {
        try {
          const [couponRows] = await connection.query(
            `SELECT id FROM coupons WHERE UPPER(code) = UPPER(?)`,
            [appliedCode.trim()]
          );
          if (couponRows.length > 0) {
            const couponId = couponRows[0].id;
            await connection.query(
              `INSERT INTO coupon_usages (coupon_id, order_id, user_id, email, discount_applied) VALUES (?, ?, ?, ?, ?)`,
              [couponId, orderId, user_id, email, discount_amount]
            );
            await connection.query(
              `UPDATE coupons SET used_count = used_count + 1 WHERE id = ?`,
              [couponId]
            );
          }
        } catch (cErr) {
          console.warn('Coupon usage record warning:', cErr.message);
        }
      }

      // 3. Process each Order Line Item & Handle Inventory Stock
      const isSafepay = String(payment_method).toLowerCase() === 'safepay';

      // Deterministic lock order: always deduct rows by ascending product_id so
      // two multi-item checkouts can never form a lock cycle (deadlock).
      const orderedItems = [...items].sort(
        (a, b) => Number(a.product_id) - Number(b.product_id)
      );

      for (const item of orderedItems) {
        const { product_id, product_name, product_image, unit_price, quantity } = item;
        const itemTotal = unit_price * quantity;

        // Insert Order Line Item
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_image, unit_price, quantity, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, product_id, product_name, product_image, unit_price, quantity, itemTotal]
        );

        // ── If Cash on Delivery, deduct stock immediately ──
        // (For Safepay, stock is deducted atomically when payment succeeds)
        // (Row existence was already ensured in autocommit above.)
        if (!isSafepay) {
          // ATOMIC guard: the availability check and the decrement happen in one
          // statement, so the database serialises concurrent checkouts on the row
          // and can never oversell (no read-check-write gap).
          const [deductRes] = await connection.query(
            `UPDATE inventory
                SET stock_quantity = stock_quantity - ?,
                    availability_status = IF(stock_quantity - ? = 0, 'Out of Stock', 'In Stock')
              WHERE product_id = ? AND stock_quantity >= ?`,
            [quantity, quantity, product_id, quantity]
          );

          if (deductRes.affectedRows === 0) {
            // Guard failed → snapshot the real level for a clear client error
            const [stockNow] = await connection.query(
              `SELECT stock_quantity FROM inventory WHERE product_id = ? LIMIT 1`,
              [product_id]
            );
            const currentStock = stockNow[0]?.stock_quantity ?? 0;
            const error = new Error(
              `Insufficient stock for '${product_name}': only ${currentStock} unit(s) available, tried to order ${quantity}.`
            );
            error.statusCode = 409;
            throw error; // → rolls back the whole order (header + line items)
          }

          // Read back the post-deduction row for the audit trail
          // (same transaction → sees our own committed-in-transaction write)
          const [afterRows] = await connection.query(
            `SELECT id, stock_quantity FROM inventory WHERE product_id = ? LIMIT 1`,
            [product_id]
          );

          if (afterRows.length > 0) {
            const inv = afterRows[0];
            try {
              await connection.query(
                `INSERT INTO inventory_movements (inventory_id, movement_type, quantity_changed, stock_after, reference_id)
                 VALUES (?, 'order_deduction', ?, ?, ?)`,
                [inv.id, -quantity, inv.stock_quantity, orderNumber]
              );
            } catch (logErr) {
              console.warn('Inventory movement log failed:', logErr.message);
            }
          }
        }
      }

      await connection.commit();
      return { id: orderId, order_number: orderNumber };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Atomically mark order as PAID and deduct product quantity from inventory.
   * Called by Safepay Webhook (payment.succeeded) and payment verification API.
   */
  static async markPaidAndDeductStock(orderId) {
    // Pre-fetch line items + ensure inventory rows in AUTOCOMMIT, BEFORE the
    // transaction. (INSERT IGNORE inside the txn holds duplicate-key locks the
    // UPDATE then upgrades → deadlocks when webhooks race other checkouts.)
    const [preItems] = await db.query(
      `SELECT product_id, product_name, quantity FROM order_items WHERE order_id = ?`,
      [orderId]
    );

    for (const item of preItems) {
      if (item && item.product_id) {
        await db.query(
          `INSERT IGNORE INTO inventory (product_id, variantId, stock_quantity, reserved_quantity, reorder_level, availability_status)
           VALUES (?, ?, 50, 0, 10, 'In Stock')`,
          [item.product_id, item.product_id]
        );
      }
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Lock order row for update
      const [orders] = await connection.query(
        `SELECT id, order_number, payment_status, payment_method FROM orders WHERE id = ? FOR UPDATE`,
        [orderId]
      );

      if (orders.length === 0) {
        await connection.rollback();
        return { success: false, reason: 'order_not_found' };
      }

      const order = orders[0];

      // Idempotency: skip if already paid
      if (order.payment_status === 'paid') {
        await connection.rollback();
        return { success: true, alreadyPaid: true, order };
      }

      // Update payment status to paid & order status to processing
      await connection.query(
        `UPDATE orders
           SET payment_status = 'paid', order_status = 'processing'
         WHERE id = ?`,
        [orderId]
      );

      // Fetch order line items (fresh read inside the txn)
      const [items] = await connection.query(
        `SELECT product_id, product_name, quantity FROM order_items WHERE order_id = ?`,
        [orderId]
      );

      // Deterministic lock order (ascending product_id) — no lock cycles
      const orderedItems = [...items].sort(
        (a, b) => Number(a.product_id) - Number(b.product_id)
      );

      // Deduct inventory stock for each line item
      for (const item of orderedItems) {
        const { product_id, product_name, quantity } = item;

        // ATOMIC relative deduction + status flip in one statement.
        // Payment already succeeded, so we deduct the exact amount — if this
        // oversells, stock goes negative ON PURPOSE: that deficit is the signal
        // for staff to resolve. (The old GREATEST(0, …) clamp silently hid it.)
        await connection.query(
          `UPDATE inventory
              SET stock_quantity = stock_quantity - ?,
                  availability_status = IF(stock_quantity - ? <= 0, 'Out of Stock', 'In Stock')
            WHERE product_id = ?`,
          [quantity, quantity, product_id]
        );

        // Fetch new stock & log movement (same txn → stable read of our write)
        const [stockRows] = await connection.query(
          `SELECT id, stock_quantity FROM inventory WHERE product_id = ? LIMIT 1`,
          [product_id]
        );

        if (stockRows.length > 0) {
          const inv = stockRows[0];

          if (inv.stock_quantity < 0) {
            console.warn(
              `⚠️ [OrderModel] OVERSELL: order ${order.order_number} drove product ${product_id} ('${product_name}') stock to ${inv.stock_quantity}. Manual resolution required.`
            );
          }

          // Log movement
          try {
            await connection.query(
              `INSERT INTO inventory_movements (inventory_id, movement_type, quantity_changed, stock_after, reference_id)
               VALUES (?, 'order_deduction', ?, ?, ?)`,
              [inv.id, -quantity, inv.stock_quantity, order.order_number]
            );
          } catch (logErr) {
            console.warn('Inventory movement log failed:', logErr.message);
          }
        }
      }

      await connection.commit();
      console.log(`✅ [OrderModel] Order ${order.order_number} (ID: ${orderId}) marked as PAID and stock deducted successfully.`);
      return { success: true, alreadyPaid: false, order };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Find Order by ID with Line Items
  static async findById(id) {
    const [orders] = await db.query(`SELECT * FROM orders WHERE id = ?`, [id]);
    if (orders.length === 0) return null;

    const order = orders[0];
    const [items] = await db.query(`SELECT * FROM order_items WHERE order_id = ?`, [order.id]);
    order.items = items;

    return order;
  }

  // Find all orders (for admin) or user orders (by user_id or email)
  static async findAll(userId = null, email = null) {
    let query = `SELECT * FROM orders`;
    const params = [];

    if (userId && email) {
      query += ` WHERE user_id = ? OR email = ?`;
      params.push(userId, email);
    } else if (userId) {
      query += ` WHERE user_id = ?`;
      params.push(userId);
    } else if (email) {
      query += ` WHERE email = ?`;
      params.push(email);
    }

    query += ` ORDER BY id DESC`;
    const [rows] = await db.query(query, params);

    for (const order of rows) {
      const [items] = await db.query(`SELECT * FROM order_items WHERE order_id = ?`, [order.id]);
      order.items = items;
    }

    return rows;
  }

  // Update order status
  static async updateStatus(id, status) {
    const [result] = await db.query(
      `UPDATE orders SET order_status = ? WHERE id = ?`,
      [status, id]
    );
    return result;
  }
}

module.exports = OrderModel;
