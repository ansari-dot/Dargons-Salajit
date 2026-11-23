const db = require('../config/db');

class BrandModel {
  // Get all brands (for admin management). Pass true to only get storefront-visible brands.
  static async getAll(activeOnly = false) {
    let query = `SELECT * FROM brands`;

    if (activeOnly) {
      query += ` WHERE is_active = TRUE`;
    }

    query += ` ORDER BY id DESC`;
    const [rows] = await db.query(query);
    return rows;
  }

  // Get a single brand by ID
  static async getById(id) {
    const [rows] = await db.query(`SELECT * FROM brands WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  // Create new brand (logo file meta comes from the multer middleware)
  static async create(brandData) {
    const {
      name,
      description = null,
      logo_url,
      file_name = null,
      file_size = null,
      mime_type = null,
      is_active = 1
    } = brandData;

    const [result] = await db.query(
      `INSERT INTO brands (name, description, logo_url, file_name, file_size, mime_type, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, logo_url, file_name, file_size, mime_type, is_active ? 1 : 0]
    );

    return await this.getById(result.insertId);
  }

  // Update an existing brand (only the provided fields are changed)
  static async update(id, brandData) {
    const fields = [];
    const values = [];

    const allowedFields = ['name', 'description', 'logo_url', 'file_name', 'file_size', 'mime_type', 'is_active'];

    for (const key of allowedFields) {
      if (brandData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'is_active' ? (brandData[key] ? 1 : 0) : brandData[key]);
      }
    }

    if (fields.length === 0) return await this.getById(id);

    values.push(id);
    await db.query(`UPDATE brands SET ${fields.join(', ')} WHERE id = ?`, values);

    return await this.getById(id);
  }

  // Toggle storefront visibility
  static async toggleActive(id) {
    await db.query(`UPDATE brands SET is_active = NOT is_active WHERE id = ?`, [id]);
    return await this.getById(id);
  }

  // Delete brand
  static async delete(id) {
    const [result] = await db.query(`DELETE FROM brands WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = BrandModel;
