const AuthService = require('../services/authService');
const { sendSuccess } = require('../utils/responseHandler');
const { setTokenCookies, clearTokenCookies } = require('../utils/jwtHelper');

// Register Controller
const register = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await AuthService.register(req.body);
    
    // Attach Tokens in HTTP-Only Cookies
    setTokenCookies(res, accessToken, refreshToken);

    return sendSuccess(
      res,
      { user, accessToken },
      'User registered successfully and logged in.',
      201
    );
  } catch (error) {
    next(error);
  }
};

// Login Controller
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await AuthService.login(email, password);

    // Attach Tokens in HTTP-Only Cookies
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
    // Read refresh token from HTTP-only cookie or body
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
  login,
  refreshToken,
  logout,
  getMe
};
