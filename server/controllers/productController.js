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
  deleteProduct
};
