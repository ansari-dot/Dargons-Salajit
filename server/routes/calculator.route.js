const express = require('express');
const router = express.Router();

const {
  calculateCostController,
  getCalculatorOptionsController,
  saveConfigurationController,
  getConfigurationByReferenceController,
  getAdminProductsController,
  updateAdminProductController,
  getAdminPackagingController,
  updateAdminPackagingController,
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
router.get('/admin/products', getAdminProductsController);
router.put('/admin/products/:id', updateAdminProductController);

router.get('/admin/packaging', getAdminPackagingController);
router.put('/admin/packaging/:id', updateAdminPackagingController);

router.get('/admin/pricing-tiers', getAdminPricingTiersController);
router.post('/admin/pricing-tiers', createAdminPricingTierController);
router.put('/admin/pricing-tiers/:id', updateAdminPricingTierController);
router.delete('/admin/pricing-tiers/:id', deleteAdminPricingTierController);

module.exports = router;
