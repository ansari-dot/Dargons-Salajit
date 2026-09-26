const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { validateProduct } = require('../validations/productValidation');

// Public Product Catalog Endpoints
router.get('/', getAllProducts);
router.get('/:id', getProduct);

// Admin Management Endpoints (Auth temporarily bypassed per request)
router.post('/', validateProduct, createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
