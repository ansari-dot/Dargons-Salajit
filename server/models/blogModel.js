const db = require('../config/db');

class BlogModel {
  // Find all blog posts with search filtering
  static async findAll(filters = {}) {
    const { search, isPublished = true } = filters;
    let query = `SELECT * FROM blogs WHERE 1=1`;
    const params = [];

    if (isPublished !== undefined && isPublished !== 'all') {
      query += ` AND is_published = ?`;
      params.push(isPublished ? 1 : 0);
    }

    if (search) {
      query += ` AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)`;
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    query += ` ORDER BY created_at DESC`;
    const [rows] = await db.query(query, params);
    return rows;
  }

  // Find blog post by ID or Slug
  static async findByIdOrSlug(idOrSlug) {
    const isId = !isNaN(Number(idOrSlug));
    const whereClause = isId ? `id = ?` : `slug = ?`;

    const [rows] = await db.query(
      `SELECT * FROM blogs WHERE ${whereClause}`,
      [idOrSlug]
    );

    return rows[0] || null;
  }

  // Create new Blog Post
  static async create(blogData) {
    const {
      title,
      slug,
      author = 'admin admin',
      excerpt,
      content,
      image,
      tags = null,
      is_published = true
    } = blogData;

    const [result] = await db.query(
      `INSERT INTO blogs (title, slug, author, excerpt, content, image, tags, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        slug,
        author,
        excerpt,
        content,
        image,
        tags ? JSON.stringify(tags) : null,
        is_published ? 1 : 0
      ]
    );

    return result.insertId;
  }

  // Update existing Blog Post
  static async update(id, blogData) {
    const allowedFields = ['title', 'slug', 'author', 'excerpt', 'content', 'image', 'is_published'];
    const fields = [];
    const values = [];

    for (const key of allowedFields) {
      if (blogData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(blogData[key]);
      }
    }

    if (blogData.tags !== undefined) {
      fields.push(`tags = ?`);
      values.push(blogData.tags ? JSON.stringify(blogData.tags) : null);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const [result] = await db.query(
      `UPDATE blogs SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result;
  }

  // Delete Blog Post
  static async delete(id) {
    const [result] = await db.query(`DELETE FROM blogs WHERE id = ?`, [id]);
    return result;
  }
}

module.exports = BlogModel;
