const db = require('../config/db');

class CouponModel {
  // Find all coupons with overall usage summary
  static async findAll() {
    const [rows] = await db.query(`
      SELECT 
        id, 
        code, 
        description, 
        discount_type, 
        discount_value, 
        min_order_amount, 
        max_discount_amount, 
        usage_limit, 
        used_count, 
        usage_limit_per_user, 
        start_date, 
        end_date, 
        is_active, 
        created_at, 
        updated_at
      FROM coupons 
      ORDER BY id DESC
    `);
    return rows;
  }

  // Find coupon by ID
  static async findById(id) {
    const [rows] = await db.query(`SELECT * FROM coupons WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  // Find coupon by Code (case-insensitive)
  static async findByCode(code) {
    const [rows] = await db.query(`SELECT * FROM coupons WHERE UPPER(code) = UPPER(?)`, [code.trim()]);
    return rows[0] || null;
  }

  // Create a new promo coupon
  static async create(couponData) {
    const {
      code,
      description = '',
      discount_type = 'percentage',
      discount_value,
      min_order_amount = 0.00,
      max_discount_amount = null,
      usage_limit = null,
      usage_limit_per_user = 1,
      start_date = null,
      end_date = null,
      is_active = true
    } = couponData;

    const formattedCode = code.trim().toUpperCase();

    const [result] = await db.query(
      `INSERT INTO coupons 
       (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, usage_limit_per_user, start_date, end_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [formattedCode, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, usage_limit_per_user, start_date, end_date, is_active]
    );

    return { id: result.insertId, code: formattedCode };
  }

  // Update an existing coupon
  static async update(id, couponData) {
    const fields = [];
    const values = [];

    const allowedFields = [
      'code', 'description', 'discount_type', 'discount_value',
      'min_order_amount', 'max_discount_amount', 'usage_limit',
      'usage_limit_per_user', 'start_date', 'end_date', 'is_active'
    ];

    for (const key of allowedFields) {
      if (couponData[key] !== undefined) {
        if (key === 'code') {
          fields.push(`${key} = ?`);
          values.push(couponData[key].trim().toUpperCase());
        } else {
          fields.push(`${key} = ?`);
          values.push(couponData[key]);
        }
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const [result] = await db.query(
      `UPDATE coupons SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result;
  }

  // Toggle active status
  static async toggleStatus(id) {
    const [result] = await db.query(
      `UPDATE coupons SET is_active = NOT is_active WHERE id = ?`,
      [id]
    );
    return result;
  }

  // Delete coupon by ID
  static async delete(id) {
    const [result] = await db.query(`DELETE FROM coupons WHERE id = ?`, [id]);
    return result;
  }

  // Validate coupon against subtotal, usage limits, and expiration
  static async validateCoupon(code, subtotal = 0, email = null) {
    if (!code || typeof code !== 'string') {
      return { valid: false, message: 'Please enter a valid coupon code.' };
    }

    const coupon = await this.findByCode(code);
    if (!coupon) {
      return { valid: false, message: `Coupon code '${code.toUpperCase()}' does not exist.` };
    }

    if (!coupon.is_active) {
      return { valid: false, message: `Coupon code '${coupon.code}' is currently inactive.` };
    }

    const now = new Date();

    if (coupon.start_date && new Date(coupon.start_date) > now) {
      return { valid: false, message: `Coupon code '${coupon.code}' is not active yet.` };
    }

    if (coupon.end_date && new Date(coupon.end_date) < now) {
      return { valid: false, message: `Coupon code '${coupon.code}' has expired.` };
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return { valid: false, message: `Coupon code '${coupon.code}' usage limit has been reached.` };
    }

    const numericSubtotal = Number(subtotal) || 0;
    const minOrder = Number(coupon.min_order_amount) || 0;

    if (numericSubtotal < minOrder) {
      return {
        valid: false,
        message: `Minimum order subtotal of ₨${minOrder.toLocaleString()} is required for coupon '${coupon.code}'.`
      };
    }

    // Check user specific usage if email provided
    if (email && coupon.usage_limit_per_user) {
      const [userUsages] = await db.query(
        `SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = ? AND email = ?`,
        [coupon.id, email]
      );
      if (userUsages[0].count >= coupon.usage_limit_per_user) {
        return { valid: false, message: `You have already used coupon '${coupon.code}' the maximum number of times allowed.` };
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    const discountVal = Number(coupon.discount_value);

    if (coupon.discount_type === 'percentage') {
      discountAmount = (numericSubtotal * discountVal) / 100;
      if (coupon.max_discount_amount !== null && coupon.max_discount_amount > 0) {
        discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
      }
    } else {
      // Fixed discount
      discountAmount = Math.min(discountVal, numericSubtotal);
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const newTotal = Math.max(0, numericSubtotal - discountAmount);

    return {
      valid: true,
      message: `Coupon '${coupon.code}' applied successfully!`,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
      },
      discount_amount: discountAmount,
      new_total: newTotal
    };
  }

  // Record coupon usage on order placement
  static async recordUsage(couponId, orderId = null, userId = null, email = null, discountApplied = 0) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `INSERT INTO coupon_usages (coupon_id, order_id, user_id, email, discount_applied) VALUES (?, ?, ?, ?, ?)`,
        [couponId, orderId, userId, email, discountApplied]
      );

      await connection.query(
        `UPDATE coupons SET used_count = used_count + 1 WHERE id = ?`,
        [couponId]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error('Failed to record coupon usage:', error.message);
    } finally {
      connection.release();
    }
  }
}

module.exports = CouponModel;
