const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  getWishlist,
  toggleWishlist,
  removeItem,
  clearWishlist,
  mergeWishlist,
} = require('../controllers/wishlistController');

// All wishlist routes require user authentication
router.use(authenticate);

router.get('/', getWishlist);
router.post('/toggle', toggleWishlist);
router.delete('/item/:productId', removeItem);
router.delete('/clear', clearWishlist);
router.post('/merge', mergeWishlist);

module.exports = router;
