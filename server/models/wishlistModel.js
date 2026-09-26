const db = require('../config/db');

class WishlistModel {
  static async getWishlistByUserId(userId) {
    const [rows] = await db.query(
      `SELECT 
        w.product_id AS id,
        p.name,
        p.price,
        p.old_price AS oldPrice,
        p.main_image AS image,
        p.vendor,
        p.size,
        COALESCE(cat.name, 'Resin') AS category
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       LEFT JOIN categories cat ON p.category_id = cat.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [userId]
    );

    return rows.map((r) => ({
      id: String(r.id),
      name: r.name,
      price: Number(r.price),
      oldPrice: r.oldPrice ? Number(r.oldPrice) : undefined,
      image: r.image || '/popular_gold_jar.png',
      vendor: r.vendor || 'Himalayan Surp',
      size: r.size || '50g',
      category: r.category || 'Resin',
    }));
  }

  static async toggleItem(userId, productId) {
    const [existing] = await db.query(
      `SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?`,
      [userId, productId]
    );

    if (existing.length > 0) {
      await db.query(`DELETE FROM wishlist WHERE user_id = ? AND product_id = ?`, [userId, productId]);
    } else {
      await db.query(
        `INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
        [userId, productId]
      );
    }
    return this.getWishlistByUserId(userId);
  }

  static async removeItem(userId, productId) {
    await db.query(`DELETE FROM wishlist WHERE user_id = ? AND product_id = ?`, [userId, productId]);
    return this.getWishlistByUserId(userId);
  }

  static async clearWishlist(userId) {
    await db.query(`DELETE FROM wishlist WHERE user_id = ?`, [userId]);
    return [];
  }

  static async mergeWishlist(userId, localItems = []) {
    if (Array.isArray(localItems) && localItems.length > 0) {
      for (const item of localItems) {
        if (item.id && Number(item.id)) {
          await db.query(
            `INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`,
            [userId, item.id]
          );
        }
      }
    }
    return this.getWishlistByUserId(userId);
  }
}

module.exports = WishlistModel;
