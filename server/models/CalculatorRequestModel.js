const db = require('../config/db');

class CalculatorRequestModel {
  // Create quotation request
  static async createRequest(data) {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const referenceNo = data.referenceNo || `PL-${year}-${randomSuffix}`;

    const configSnapshot = data.configurationSnapshot
      ? (typeof data.configurationSnapshot === 'string' ? data.configurationSnapshot : JSON.stringify(data.configurationSnapshot))
      : null;

    const [result] = await db.query(
      `
      INSERT INTO calculator_requests (
        reference_no,
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        product_id,
        product_name,
        package_type,
        fill_size,
        strength,
        finished_quantity,
        packaging_id,
        packaging_name,
        packaging_purchase_quantity,
        product_cost,
        packaging_cost,
        printing_cost,
        setup_cost,
        other_costs,
        shipping,
        discount,
        estimated_project_cost,
        configuration_snapshot,
        status
      )
      VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        'pending'
      )
      `,
      [
        referenceNo,
        data.userId || null,
        data.customerName || null,
        data.customerEmail || null,
        data.customerPhone || null,
        data.productId || null,
        data.productName || null,
        data.packageType || null,
        data.fillSize || null,
        data.strength || null,
        data.finishedQuantity || null,
        data.packagingId || null,
        data.packagingName || null,
        data.packagingPurchaseQuantity || null,
        data.productCost || 0,
        data.packagingCost || 0,
        data.printingCost || 0,
        data.setupCost || 0,
        data.otherCosts || 0,
        data.shipping || 0,
        data.discount || 0,
        data.estimatedProjectCost || 0,
        configSnapshot
      ]
    );

    return {
      id: result.insertId,
      referenceNo
    };
  }

  static async findAll() {
    const [rows] = await db.query(
      `
      SELECT *
      FROM calculator_requests
      ORDER BY created_at DESC
      `
    );
    return rows;
  }

  /**
   * Admin list: newest first plus requesting user's contact details or guest contact details.
   */
  static async findAllWithUser() {
    const [rows] = await db.query(
      `
      SELECT
        cr.*,
        COALESCE(u.first_name, SUBSTRING_INDEX(cr.customer_name, ' ', 1)) AS user_first_name,
        COALESCE(u.last_name, SUBSTRING(cr.customer_name, LENGTH(SUBSTRING_INDEX(cr.customer_name, ' ', 1)) + 2)) AS user_last_name,
        COALESCE(u.email, cr.customer_email) AS user_email,
        COALESCE(u.phone, cr.customer_phone) AS user_phone
      FROM calculator_requests cr
      LEFT JOIN users u ON u.id = cr.user_id
      ORDER BY cr.created_at DESC
      `
    );
    return rows;
  }

  static async findById(requestId) {
    const [rows] = await db.query(
      `
      SELECT *
      FROM calculator_requests
      WHERE id = ?
      `,
      [requestId]
    );
    return rows[0] || null;
  }

  static async UpdateStatus(requestId, status, adminNote = null) {
    const [result] = await db.query(
      `
      UPDATE calculator_requests
      SET
        status = ?,
        admin_note = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [status, adminNote, requestId]
    );
    return result;
  }

  static async findByUserId(userId) {
    const [rows] = await db.query(
      `
      SELECT *
      FROM calculator_requests
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId]
    );
    return rows;
  }
}

module.exports = CalculatorRequestModel;
