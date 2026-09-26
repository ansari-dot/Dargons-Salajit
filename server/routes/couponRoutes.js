const express = require('express');
const router = express.Router();
const {
  validateCoupon,
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon
} = require('../controllers/couponController');

// Public Storefront Validation Endpoint
router.post('/validate', validateCoupon);

// Admin & Management Endpoints
router.get('/', getCoupons);
router.get('/:id', getCouponById);
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.patch('/:id/toggle', toggleCouponStatus);
router.delete('/:id', deleteCoupon);

module.exports = router;
