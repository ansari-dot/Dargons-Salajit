const express = require('express');
const router = express.Router();

const {
  getDeals,
  getActiveDeals,
  getDealById,
  createDeal,
  updateDeal,
  toggleDealStatus,
  deleteDeal
} = require('../controllers/dealController');

// Public endpoints
router.get('/active', getActiveDeals);
router.get('/', getDeals);
router.get('/:id', getDealById);

// Admin / Management endpoints
router.post('/', createDeal);
router.put('/:id', updateDeal);
router.patch('/:id/toggle', toggleDealStatus);
router.delete('/:id', deleteDeal);

module.exports = router;
