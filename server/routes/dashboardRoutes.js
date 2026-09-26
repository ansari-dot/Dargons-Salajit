const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');

// Public or Admin endpoint for Dashboard Statistics
router.get('/stats', getDashboardStats);

module.exports = router;
