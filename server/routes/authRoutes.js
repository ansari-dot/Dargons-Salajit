const express = require('express');
const router = express.Router();

const {
  register,
  verifyEmail,
  resendCode,
  forgotPassword,
  resetPassword,
  login,
  refreshToken,
  logout,
  getMe
} = require('../controllers/authController');

const {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendCode,
  validateForgotPassword,
  validateResetPassword
} = require('../validations/authValidation');

const { authenticate } = require('../middleware/authMiddleware');

// Public Authentication Endpoints
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refreshToken);

// Email Verification Endpoints (public — identity proven by email + 6-digit code)
router.post('/verify-email', validateVerifyEmail, verifyEmail);
router.post('/resend-code', validateResendCode, resendCode);

// Password Reset Endpoints (public — identity proven by the emailed reset token)
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

// Protected Authentication Endpoints
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;
