const db = require('../config/db');

class DealModel {
  // Get all deals (for admin management)
  static async getAll() {
    const [rows] = await db.query(`
      SELECT d.*, p.name as product_name, p.main_image as product_image
      FROM deals d
      LEFT JOIN products p ON d.product_id = p.id
      ORDER BY d.id DESC
    `);
    return rows;
  }

  // Get active deals (for client homepage)
  static async getActive() {
    const [rows] = await db.query(`
      SELECT d.*, p.name as product_name, p.main_image as product_image
      FROM deals d
      LEFT JOIN products p ON d.product_id = p.id
      WHERE d.is_active = 1 AND (d.end_time IS NULL OR d.end_time > NOW())
      ORDER BY d.id DESC
    `);
    return rows;
  }

  // Get deal by ID
  static async getById(id) {
    const [rows] = await db.query(`
      SELECT d.*, p.name as product_name
      FROM deals d
      LEFT JOIN products p ON d.product_id = p.id
      WHERE d.id = ?
      LIMIT 1
    `, [id]);
    return rows[0] || null;
  }

  // Create new deal
  static async create(dealData) {
    const {
      title,
      subtitle = null,
      product_id = null,
      original_price,
      deal_price,
      banner_image = null,
      start_time = null,
      end_time = null,
      is_active = 1
    } = dealData;

    const orig = Number(original_price || 0);
    const dealP = Number(deal_price || 0);
    const discount = orig > 0 ? Math.round(((orig - dealP) / orig) * 100) : 0;

    const [result] = await db.query(`
      INSERT INTO deals (
        title, subtitle, product_id, original_price, deal_price,
        discount_percentage, banner_image, start_time, end_time, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, subtitle, product_id ? Number(product_id) : null, orig, dealP,
      discount, banner_image, start_time, end_time, is_active ? 1 : 0
    ]);

    return await this.getById(result.insertId);
  }

  // Update existing deal
  static async update(id, dealData) {
    const {
      title,
      subtitle,
      product_id,
      original_price,
      deal_price,
      banner_image,
      start_time,
      end_time,
      is_active
    } = dealData;

    const orig = Number(original_price || 0);
    const dealP = Number(deal_price || 0);
    const discount = orig > 0 ? Math.round(((orig - dealP) / orig) * 100) : 0;

    await db.query(`
      UPDATE deals
      SET title = ?, subtitle = ?, product_id = ?, original_price = ?,
          deal_price = ?, discount_percentage = ?, banner_image = ?,
          start_time = ?, end_time = ?, is_active = ?
      WHERE id = ?
    `, [
      title, subtitle, product_id ? Number(product_id) : null, orig, dealP,
      discount, banner_image, start_time, end_time, is_active ? 1 : 0, id
    ]);

    return await this.getById(id);
  }

  // Toggle active status
  static async toggleActive(id) {
    await db.query(`UPDATE deals SET is_active = NOT is_active WHERE id = ?`, [id]);
    return await this.getById(id);
  }

  // Delete deal
  static async delete(id) {
    const [result] = await db.query(`DELETE FROM deals WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = DealModel;
