const express = require('express');
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
} = require('../controllers/orderController');

const { validateOrder } = require('../validations/orderValidation');
const { authenticateOptional } = require('../middleware/authMiddleware');

// Customer Checkout Endpoint (Allows guest or authenticated)
router.post('/', validateOrder, createOrder);

// User & Admin Order Endpoints
router.get('/', authenticateOptional, getOrders);
router.get('/:id', authenticateOptional, getOrderById);

// Admin Order Status Update
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
