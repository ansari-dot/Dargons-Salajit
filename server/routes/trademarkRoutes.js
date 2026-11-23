const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const adminProtectedRoute = require('../middleware/admin.middleware');
const {
  getTrademarks,
  createTrademark,
  updateTrademark,
  deleteTrademark,
} = require('../controllers/trademarkController');

const router = express.Router();

router.get('/', (req, res, next) => {
  req.query.active = 'true';
  return getTrademarks(req, res, next);
});
router.get('/admin', authenticate, adminProtectedRoute, (req, res, next) => {
  req.query.active = 'false';
  return getTrademarks(req, res, next);
});
router.post('/admin', authenticate, adminProtectedRoute, createTrademark);
router.put('/admin/:id', authenticate, adminProtectedRoute, updateTrademark);
router.delete('/admin/:id', authenticate, adminProtectedRoute, deleteTrademark);

module.exports = router;
