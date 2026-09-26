const UserModel = require('../models/userModel');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/jwtHelper');

class AuthService {
  // Register a new user
  static async register(userData) {
    // Check if email already exists
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      const error = new Error('Email is already registered. Please login.');
      error.statusCode = 409;
      throw error;
    }

    const result = await UserModel.create(userData);
    const user = await UserModel.findById(result.id);

    // Generate Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Persist Refresh Token in DB
    await UserModel.updateRefreshToken(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  }

  // User Login
  static async login(email, password) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const error = new Error('Invalid email or password credentials.');
      error.statusCode = 401;
      throw error;
    }

    // Verify password
    const isPasswordValid = await UserModel.comparePassword(password, user.password);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password credentials.');
      error.statusCode = 401;
      throw error;
    }

    // Generate Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Persist Refresh Token in DB
    await UserModel.updateRefreshToken(user.id, refreshToken);

    // Exclude password from user output
    delete user.password;
    delete user.refresh_token;

    return { user, accessToken, refreshToken };
  }

  // Refresh Access Token using Refresh Token
  static async refreshAccessToken(token) {
    if (!token) {
      const error = new Error('Refresh Token is required.');
      error.statusCode = 401;
      throw error;
    }

    // Verify token validity
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      const error = new Error('Invalid or expired refresh token.');
      error.statusCode = 403;
      throw error;
    }

    // Verify token match in database
    const user = await UserModel.findByRefreshToken(token);
    if (!user || user.id !== decoded.id) {
      const error = new Error('Refresh token is no longer valid.');
      error.statusCode = 403;
      throw error;
    }

    // Generate new Access Token & new Refresh Token (Token Rotation)
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await UserModel.updateRefreshToken(user.id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // User Logout
  static async logout(userId) {
    if (userId) {
      await UserModel.clearRefreshToken(userId);
    }
    return true;
  }

  // Get Authenticated User Profile
  static async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }
}

module.exports = AuthService;
