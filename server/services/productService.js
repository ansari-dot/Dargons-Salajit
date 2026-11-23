const ProductModel = require('../models/productModel');

class ProductService {
  static async getProducts(filters) {
    return await ProductModel.findAll(filters);
  }

  static async getProductByIdOrSlug(idOrSlug) {
    const product = await ProductModel.findByIdOrSlug(idOrSlug);
    if (!product) {
      const error = new Error(`Product '${idOrSlug}' not found`);
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  static async createProduct(productData) {
    const productId = await ProductModel.create(productData);
    return await ProductModel.findByIdOrSlug(productId);
  }

  static async updateProduct(id, productData) {
    await this.getProductByIdOrSlug(id); // Ensure product exists
    await ProductModel.update(id, productData);
    return await ProductModel.findByIdOrSlug(id);
  }

  /**
   * Atomic relative stock change (admin restock / manual adjust).
   * The DB applies `stock_quantity = stock_quantity + delta`, so this is safe
   * to call concurrently with customer checkouts — no lost updates.
   */
  static async adjustStock(id, delta, movementType = 'restock') {
    await this.getProductByIdOrSlug(id); // Ensure product exists
    return await ProductModel.adjustStockAtomic(id, delta, movementType);
  }

  static async deleteProduct(id) {
    await this.getProductByIdOrSlug(id);
    await ProductModel.delete(id);
    return true;
  }
}

module.exports = ProductService;
