const express = require('express');
const router = express.Router();
const { getPackagingItems, getBulkTiers } = require('../controllers/packagingController');

router.get('/', getPackagingItems);
router.get('/bulk-tiers', getBulkTiers);

module.exports = router;
