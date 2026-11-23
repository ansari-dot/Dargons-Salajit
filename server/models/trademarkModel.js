const db = require('../config/db');

class TrademarkModel {
  static async findAll(activeOnly = false) {
    const where = activeOnly ? 'WHERE is_active = TRUE' : '';
    const [rows] = await db.query(
      `SELECT * FROM trademarks ${where} ORDER BY display_order ASC, id DESC`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM trademarks WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO trademarks
        (title, subtitle, image_url, document_url, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.subtitle || null,
        data.image_url || null,
        data.document_url || null,
        data.display_order ?? 0,
        data.is_active ?? true,
      ]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    const allowedFields = [
      'title',
      'subtitle',
      'image_url',
      'document_url',
      'display_order',
      'is_active',
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field] === '' ? null : data[field]);
      }
    }

    if (fields.length === 0) return;
    values.push(id);
    await db.query(`UPDATE trademarks SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  static async delete(id) {
    await db.query('DELETE FROM trademarks WHERE id = ?', [id]);
  }
}

module.exports = TrademarkModel;
