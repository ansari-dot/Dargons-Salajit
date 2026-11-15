const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const adminProtectedRoute = require('../middleware/admin.middleware');
const {
  getCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
} = require('../controllers/certificationController');

const router = express.Router();

router.get('/', (req, res, next) => {
  req.query.active = 'true';
  return getCertifications(req, res, next);
});
router.get('/admin', authenticate, adminProtectedRoute, (req, res, next) => {
  req.query.active = 'false';
  return getCertifications(req, res, next);
});
router.post('/admin', authenticate, adminProtectedRoute, createCertification);
router.put('/admin/:id', authenticate, adminProtectedRoute, updateCertification);
router.delete('/admin/:id', authenticate, adminProtectedRoute, deleteCertification);

module.exports = router;
