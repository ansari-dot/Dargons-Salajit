const express = require('express');
const router = express.Router();

const uploadBrandLogo = require('../middleware/brand.middleware');
const {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  toggleBrandStatus,
  deleteBrand
} = require('../controllers/brandController');

// Public / storefront endpoints
router.get('/', getBrands);
router.get('/:id', getBrandById);

// Admin / Management endpoints (multipart form-data with a 'logo' file field)
router.post('/', uploadBrandLogo.single('logo'), createBrand);
router.put('/:id', uploadBrandLogo.single('logo'), updateBrand);
router.patch('/:id/toggle', toggleBrandStatus);
router.delete('/:id', deleteBrand);

module.exports = router;
