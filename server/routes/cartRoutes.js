const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  getCart,
  addToCart,
  updateQuantity,
  removeItem,
  clearCart,
  mergeCart,
} = require('../controllers/cartController');

// All cart routes require user authentication
router.use(authenticate);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateQuantity);
router.delete('/item/:productId', removeItem);
router.delete('/clear', clearCart);
router.post('/merge', mergeCart);

module.exports = router;
