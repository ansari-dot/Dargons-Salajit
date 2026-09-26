const express = require('express');
const router = express.Router();

const {
  register,
  login,
  refreshToken,
  logout,
  getMe
} = require('../controllers/authController');

const {
  validateRegister,
  validateLogin
} = require('../validations/authValidation');

const { authenticate } = require('../middleware/authMiddleware');

// Public Authentication Endpoints
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);

// Protected Authentication Endpoints
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;
