const db = require('../config/db');

class CertificationModel {
  static async findAll(activeOnly = false) {
    const where = activeOnly ? 'WHERE is_active = TRUE' : '';
    const [rows] = await db.query(
      `SELECT * FROM certifications ${where} ORDER BY display_order ASC, id DESC`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM certifications WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create(data) {
    const [result] = await db.query(
      `INSERT INTO certifications
        (title, issuer, certificate_number, description, image_url, document_url, issued_at, expires_at, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.issuer || null,
        data.certificate_number || null,
        data.description || null,
        data.image_url || null,
        data.document_url || null,
        data.issued_at || null,
        data.expires_at || null,
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
      'issuer',
      'certificate_number',
      'description',
      'image_url',
      'document_url',
      'issued_at',
      'expires_at',
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
    await db.query(`UPDATE certifications SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  static async delete(id) {
    await db.query('DELETE FROM certifications WHERE id = ?', [id]);
  }
}

module.exports = CertificationModel;
