const express = require('express');
const router = express.Router();
const { createPayment, verifyPayment } = require('../controllers/paymentController');
const { authenticateOptional } = require('../middleware/authMiddleware');

/**
 * POST /api/payments/create
 * Creates Safepay tracker, saves to MySQL, returns official hosted checkout URL.
 * Optional auth — works for both guest and logged-in users.
 */
router.post('/create', authenticateOptional, createPayment);

/**
 * POST /api/payments/verify
 * Called from frontend after Safepay redirects back to /checkout/success.
 * Returns current order payment_status from MySQL.
 */
router.post('/verify', verifyPayment);

module.exports = router;
