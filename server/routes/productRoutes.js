const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct
} = require('../controllers/productController');
const { validateProduct } = require('../validations/productValidation');

// Public Product Catalog Endpoints
router.get('/', getAllProducts);
router.get('/:id', getProduct);

// Admin Management Endpoints (Auth temporarily bypassed per request)
router.post('/', validateProduct, createProduct);
router.put('/:id', updateProduct);
// Atomic relative stock change (restock / manual adjust) — never lossy under concurrency
router.post('/:id/stock', adjustStock);
router.delete('/:id', deleteProduct);

module.exports = router;
