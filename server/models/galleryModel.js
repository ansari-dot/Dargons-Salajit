const db = require('../config/db');

class GalleryModel {
  // Find all gallery items
  static async findAll(activeOnly = false) {
    let query = `SELECT * FROM gallery`;
    const params = [];

    if (activeOnly) {
      query += ` WHERE is_active = TRUE`;
    }

    query += ` ORDER BY display_order ASC, id DESC`;
    const [rows] = await db.query(query, params);
    return rows;
  }

  // Find gallery item by ID
  static async findById(id) {
    const [rows] = await db.query(`SELECT * FROM gallery WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  // Create new gallery item
  static async create(galleryData) {
    const {
      title,
      category = 'Nature',
      image_url,
      caption = '',
      display_order = 0,
      is_active = true
    } = galleryData;

    const [result] = await db.query(
      `INSERT INTO gallery (title, category, image_url, caption, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, category, image_url, caption, display_order, is_active]
    );

    return { id: result.insertId, title, image_url };
  }

  // Update existing gallery item
  static async update(id, galleryData) {
    const fields = [];
    const values = [];

    const allowedFields = ['title', 'category', 'image_url', 'caption', 'display_order', 'is_active'];

    for (const key of allowedFields) {
      if (galleryData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(galleryData[key]);
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const [result] = await db.query(
      `UPDATE gallery SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result;
  }

  // Toggle active status
  static async toggleStatus(id) {
    const [result] = await db.query(
      `UPDATE gallery SET is_active = NOT is_active WHERE id = ?`,
      [id]
    );
    return result;
  }

  // Delete gallery item
  static async delete(id) {
    const [result] = await db.query(`DELETE FROM gallery WHERE id = ?`, [id]);
    return result;
  }
}

module.exports = GalleryModel;
