const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const adminProtectedRoute = require('../middleware/admin.middleware');

const {
  calculateCostController,
  getCalculatorOptionsController,
  saveConfigurationController,
  getConfigurationByReferenceController,
  getAdminProductsController,
  createAdminProductController,
  updateAdminProductController,
  deleteAdminProductController,
  getAdminPackagingController,
  createAdminPackagingController,
  updateAdminPackagingController,
  deleteAdminPackagingController,
  getAdminPricingTiersController,
  createAdminPricingTierController,
  updateAdminPricingTierController,
  deleteAdminPricingTierController
} = require('../controllers/calculator.controller');

// Public customer routes
router.post('/calculate', calculateCostController);
router.get('/options', getCalculatorOptionsController);
router.get('/config', getCalculatorOptionsController);
router.post('/save-configuration', saveConfigurationController);
router.get('/configurations/:reference', getConfigurationByReferenceController);

// Admin management routes
router.use('/admin', authenticate, adminProtectedRoute);
router.get('/admin/products', getAdminProductsController);
router.post('/admin/products', createAdminProductController);
router.put('/admin/products/:id', updateAdminProductController);
router.delete('/admin/products/:id', deleteAdminProductController);

router.get('/admin/packaging', getAdminPackagingController);
router.post('/admin/packaging', createAdminPackagingController);
router.put('/admin/packaging/:id', updateAdminPackagingController);
router.delete('/admin/packaging/:id', deleteAdminPackagingController);

router.get('/admin/pricing-tiers', getAdminPricingTiersController);
router.post('/admin/pricing-tiers', createAdminPricingTierController);
router.put('/admin/pricing-tiers/:id', updateAdminPricingTierController);
router.delete('/admin/pricing-tiers/:id', deleteAdminPricingTierController);

module.exports = router;
