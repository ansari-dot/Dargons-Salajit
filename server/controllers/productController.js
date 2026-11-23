const ProductService = require('../services/productService');
const { sendSuccess } = require('../utils/responseHandler');

const getAllProducts = async (req, res, next) => {
  try {
    const products = await ProductService.getProducts(req.query);
    return sendSuccess(res, products, 'Products retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await ProductService.getProductByIdOrSlug(req.params.id);
    return sendSuccess(res, product, 'Product details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const newProduct = await ProductService.createProduct(req.body);
    return sendSuccess(res, newProduct, 'Product created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const updated = await ProductService.updateProduct(req.params.id, req.body);
    return sendSuccess(res, updated, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /products/:id/stock  — atomic relative stock change.
 * Body: { delta: number, movement_type?: 'restock' | 'manual_adjustment' | 'cancellation_refund' }
 * The database applies `stock_quantity = stock_quantity + delta` inside a
 * transaction, so concurrent checkouts can never lose this update.
 */
const adjustStock = async (req, res, next) => {
  try {
    const delta = Number(req.body.delta);
    if (!Number.isInteger(delta) || delta === 0) {
      const error = new Error('delta must be a non-zero whole number.');
      error.statusCode = 400;
      throw error;
    }
    const movementType = req.body.movement_type || 'restock';
    const inv = await ProductService.adjustStock(req.params.id, delta, movementType);
    return sendSuccess(
      res,
      inv,
      delta > 0
        ? `Stock increased by ${delta} unit(s). New level: ${inv.stock_quantity}.`
        : `Stock decreased by ${Math.abs(delta)} unit(s). New level: ${inv.stock_quantity}.`
    );
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    await ProductService.deleteProduct(req.params.id);
    return sendSuccess(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct
};
