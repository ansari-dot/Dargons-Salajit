const AuthService = require('../services/authService');
const { sendSuccess } = require('../utils/responseHandler');
const { setTokenCookies, clearTokenCookies } = require('../utils/jwtHelper');

// Register Controller
const register = async (req, res, next) => {
  try {
    const { requiresVerification, email } = await AuthService.register(req.body);

    return sendSuccess(
      res,
      { requiresVerification, email },
      'Registration successful. Please verify your email with the 6-digit code we sent you.',
      201
    );
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.verifyEmail(email, code);

    setTokenCookies(res, accessToken, refreshToken);

    return sendSuccess(
      res,
      { user, accessToken },
      'Email verified successfully. You are now logged in.'
    );
  } catch (error) {
    next(error);
  }
};

// Resend Verification Code Controller (60s cooldown)
const resendCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    await AuthService.resendCode(email);

    return sendSuccess(
      res,
      null,
      'A new verification code has been sent to your email.'
    );
  } catch (error) {
    next(error);
  }
};

// Forgot Password Controller — emails a reset link (60s cooldown, generic response)
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await AuthService.forgotPassword(email);

    // Same message whether or not the account exists (no account enumeration)
    return sendSuccess(
      res,
      null,
      'If an account exists for that email, a password reset link has been sent.'
    );
  } catch (error) {
    next(error);
  }
};

// Reset Password Controller — sets a new password using the emailed token
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await AuthService.resetPassword(token, password);

    return sendSuccess(res, null, 'Your password has been reset successfully. You can now login.');
  } catch (error) {
    next(error);
  }
};

// Login Controller
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.login(email, password);

    setTokenCookies(res, accessToken, refreshToken);

    return sendSuccess(
      res,
      { user, accessToken },
      'Login successful.'
    );
  } catch (error) {
    next(error);
  }
};

// Refresh Access Token Controller
const refreshToken = async (req, res, next) => {
  try {

    const token = req.cookies?.refreshToken || req.body.refreshToken;
    const { accessToken, refreshToken: newRefreshToken } = await AuthService.refreshAccessToken(token);

    // Update Cookies with new rotated tokens
    setTokenCookies(res, accessToken, newRefreshToken);

    return sendSuccess(
      res,
      { accessToken },
      'Token refreshed successfully.'
    );
  } catch (error) {
    next(error);
  }
};

// Logout Controller
const logout = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    await AuthService.logout(userId);

    // Clear HTTP-Only Cookies
    clearTokenCookies(res);

    return sendSuccess(res, null, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
};

// Get Current User Profile Controller
const getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getProfile(req.user.id);
    return sendSuccess(res, user, 'User profile retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendCode,
  forgotPassword,
  resetPassword,
  login,
  refreshToken,
  logout,
  getMe
};
