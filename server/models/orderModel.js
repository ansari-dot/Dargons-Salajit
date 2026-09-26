const db = require('../config/db');

class OrderModel {
  // Create order with line items and atomic inventory deduction
  static async createOrder(orderData) {
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
        coupon_code = null,
        couponCode = null,
        items = []
      } = orderData;

      const appliedCode = coupon_code || couponCode;

      // 1. Generate unique Order Number (e.g. ORD-100234)
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

      // 2. Insert Order Header
      const [orderRes] = await connection.query(
        `INSERT INTO orders (order_number, user_id, first_name, last_name, email, phone, street_address, city, postal_code, subtotal, discount_amount, grand_total, payment_method, order_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [orderNumber, user_id, first_name, last_name, email, phone, street_address, city, postal_code, subtotal, discount_amount, grand_total, payment_method]
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

      for (const item of items) {
        const { product_id, product_name, product_image, unit_price, quantity } = item;
        const itemTotal = unit_price * quantity;

        // Insert Order Line Item
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, product_name, product_image, unit_price, quantity, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, product_id, product_name, product_image, unit_price, quantity, itemTotal]
        );

        // ── Inventory: ensure row exists (default 50 units when none set yet) ──
        const [existingInv] = await connection.query(
          `SELECT id, stock_quantity FROM inventory WHERE product_id = ? LIMIT 1`,
          [product_id]
        );

        if (existingInv.length === 0) {
          // Auto-create inventory row with a default stock of 50
          await connection.query(
            `INSERT INTO inventory (product_id, variantId, stock_quantity, reserved_quantity, reorder_level, availability_status)
             VALUES (?, ?, 50, 0, 10, 'In Stock')`,
            [product_id, product_id]
          );
        }

        // Verify stock availability
        const [checkRow] = await connection.query(
          `SELECT id, stock_quantity FROM inventory WHERE product_id = ? LIMIT 1`,
          [product_id]
        );
        const currentStock = checkRow[0]?.stock_quantity ?? 0;
        if (currentStock < quantity) {
          throw new Error(
            `Insufficient stock for '${product_name}': only ${currentStock} unit(s) available, tried to order ${quantity}.`
          );
        }

        // ── If Cash on Delivery, deduct stock immediately ──
        // (For Safepay, stock is deducted atomically when payment succeeds)
        if (!isSafepay) {
          const invId = checkRow[0].id;
          const newStock = Math.max(0, currentStock - quantity);
          const newStatus = newStock === 0 ? 'Out of Stock' : 'In Stock';

          await connection.query(
            `UPDATE inventory SET stock_quantity = ?, availability_status = ? WHERE id = ?`,
            [newStock, newStatus, invId]
          );

          try {
            await connection.query(
              `INSERT INTO inventory_movements (inventory_id, movement_type, quantity_changed, stock_after, reference_id)
               VALUES (?, 'order_deduction', ?, ?, ?)`,
              [invId, -quantity, newStock, orderNumber]
            );
          } catch (logErr) {
            console.warn('Inventory movement log failed:', logErr.message);
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

      // Fetch order line items
      const [items] = await connection.query(
        `SELECT product_id, product_name, quantity FROM order_items WHERE order_id = ?`,
        [orderId]
      );

      // Deduct inventory stock for each line item
      for (const item of items) {
        const { product_id, product_name, quantity } = item;

        // Ensure inventory row exists
        const [invCheck] = await connection.query(
          `SELECT id, stock_quantity FROM inventory WHERE product_id = ? LIMIT 1`,
          [product_id]
        );

        if (invCheck.length === 0) {
          await connection.query(
            `INSERT INTO inventory (product_id, variantId, stock_quantity, reserved_quantity, reorder_level, availability_status)
             VALUES (?, ?, 50, 0, 10, 'In Stock')`,
            [product_id, product_id]
          );
        }

        // Deduct stock quantity atomically
        await connection.query(
          `UPDATE inventory
             SET stock_quantity = GREATEST(0, stock_quantity - ?)
           WHERE product_id = ?`,
          [quantity, product_id]
        );

        // Fetch new stock & update availability_status
        const [stockRows] = await connection.query(
          `SELECT id, stock_quantity FROM inventory WHERE product_id = ? LIMIT 1`,
          [product_id]
        );

        if (stockRows.length > 0) {
          const inv = stockRows[0];
          const newStatus = inv.stock_quantity === 0 ? 'Out of Stock' : 'In Stock';
          await connection.query(
            `UPDATE inventory SET availability_status = ? WHERE id = ?`,
            [newStatus, inv.id]
          );

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
