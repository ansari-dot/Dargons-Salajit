const db = require('../config/db');

class CartModel {
  static async getCartByUserId(userId) {
    const [rows] = await db.query(
      `SELECT 
        c.product_id AS id,
        p.name,
        p.price,
        p.main_image AS image,
        p.vendor,
        c.size,
        c.quantity
       FROM cart_items c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC`,
      [userId]
    );

    return rows.map((r) => ({
      id: String(r.id),
      name: r.name,
      price: Number(r.price),
      image: r.image || '/popular_gold_jar.png',
      vendor: r.vendor || 'Himalayan Surp',
      size: r.size || '50g',
      quantity: Number(r.quantity),
    }));
  }

  static async addItem(userId, productId, quantity = 1, size = '50g') {
    const qty = Math.max(1, Number(quantity) || 1);
    await db.query(
      `INSERT INTO cart_items (user_id, product_id, quantity, size)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         quantity = quantity + VALUES(quantity),
         size = VALUES(size),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, productId, qty, size]
    );
    return this.getCartByUserId(userId);
  }

  static async updateQuantity(userId, productId, quantity) {
    const qty = Number(quantity);
    if (qty <= 0) {
      await db.query(`DELETE FROM cart_items WHERE user_id = ? AND product_id = ?`, [userId, productId]);
    } else {
      await db.query(
        `UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND product_id = ?`,
        [qty, userId, productId]
      );
    }
    return this.getCartByUserId(userId);
  }

  static async removeItem(userId, productId) {
    await db.query(`DELETE FROM cart_items WHERE user_id = ? AND product_id = ?`, [userId, productId]);
    return this.getCartByUserId(userId);
  }

  static async clearCart(userId) {
    await db.query(`DELETE FROM cart_items WHERE user_id = ?`, [userId]);
    return [];
  }

  static async mergeCart(userId, localItems = []) {
    if (Array.isArray(localItems) && localItems.length > 0) {
      for (const item of localItems) {
        if (item.id && Number(item.id)) {
          await this.addItem(userId, item.id, item.quantity || 1, item.size || '50g');
        }
      }
    }
    return this.getCartByUserId(userId);
  }
}

module.exports = CartModel;
