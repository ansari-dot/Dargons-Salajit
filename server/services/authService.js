const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require('../utils/jwtHelper');

const generateCode = require('../utils/generateCode.js')
const sendEmail = require('../utils/stmp.js')
const EMAIL_SUBJECTS = require('../utils/EmailSubject');
const { verificationEmailHtml, passwordResetEmailHtml } = require('../utils/emailTemplates');

const CODE_TTL_MINUTES = 10;
const RESET_TOKEN_TTL_MINUTES = 30;
const RESEND_COOLDOWN_SECONDS = 60;

const hashCode = (code) => {
  return crypto.createHash("sha256").update(String(code).trim()).digest('hex')
}



class AuthService {
  // Register a new user (email verification required — does NOT log in yet)
  static async register(userData) {
    // Check if email already exists
    const existingUser = await UserModel.findByEmail(userData.email);
    if (existingUser) {
      const error = new Error('Email is already registered. Please login.');
      error.statusCode = 409;
      throw error;
    }

    // Create the account as UNVERIFIED
    const result = await UserModel.create({ ...userData, email_verified: 0 });
    const user = await UserModel.findById(result.id);

    // Generate + email the 6-digit verification code (hash stored in DB)
    await AuthService.sendVerificationCode(user);

    return { requiresVerification: true, email: user.email };
  }

  // Generate a fresh 6-digit code, persist its hash and email it to the user
  static async sendVerificationCode(user) {
    const code = await generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
    await UserModel.setVerificationCode(user.id, hashCode(code), expiresAt);

    try {
      await sendEmail({
        to: user.email,
        subject: EMAIL_SUBJECTS.VERIFY_EMAIL,
        html: verificationEmailHtml({
          name: user.first_name || '',
          code,
        }),
      });
    } catch (err) {
      // Never block registration if SMTP is down — surface the code in server logs
      console.warn(`[Auth] Failed to send verification email to ${user.email}: ${err.message}`);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Auth] Email verification code for ${user.email}: ${code}`);
    }

    return code;
  }

  // Verify email with the 6-digit code, then log the user in
  static async verifyEmail(email, code) {
    const user = await UserModel.findByEmail(String(email || '').trim());
    if (!user) {
      const error = new Error('Account not found. Please register again.');
      error.statusCode = 404;
      throw error;
    }

    // Already verified → still issue tokens (idempotent, e.g. page refresh)
    if (Number(user.email_verified) === 1) {
      const tokens = await AuthService.issueTokens(user);
      return { user: AuthService.sanitizeUser(user), ...tokens };
    }

    if (!user.verification_code || user.verification_code !== hashCode(code)) {
      const error = new Error('Invalid verification code. Please check your email and try again.');
      error.statusCode = 400;
      throw error;
    }

    if (!user.verification_expires_at || new Date(user.verification_expires_at) < new Date()) {
      const error = new Error('This code has expired. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    await UserModel.markEmailVerified(user.id);
    const verifiedUser = { ...user, email_verified: 1, verification_code: null };

    const tokens = await AuthService.issueTokens(verifiedUser);
    return { user: AuthService.sanitizeUser(verifiedUser), ...tokens };
  }

  // Resend a fresh verification code (60s cooldown between sends)
  static async resendCode(email) {
    const user = await UserModel.findByEmail(String(email || '').trim());
    if (!user) {
      const error = new Error('Account not found. Please register again.');
      error.statusCode = 404;
      throw error;
    }

    if (Number(user.email_verified) === 1) {
      const error = new Error('This email is already verified. Please login.');
      error.statusCode = 400;
      throw error;
    }

    if (user.verification_sent_at) {
      const elapsedSeconds = (Date.now() - new Date(user.verification_sent_at).getTime()) / 1000;
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSeconds);
        const error = new Error(`Please wait ${wait} second(s) before requesting a new code.`);
        error.statusCode = 429;
        throw error;
      }
    }

    await AuthService.sendVerificationCode(user);
    return true;
  }

  // Password reset (30-min token, 60s resend cooldown, generic response to avoid account enumeration)
  static async forgotPassword(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const user = await UserModel.findByEmail(normalizedEmail);

    // Unknown email → succeed silently (don't reveal whether an account exists)
    if (!user) {
      return true;
    }

    if (Number(user.email_verified) !== 1) {
      // Unverified accounts can't reset — they need the 6-digit code instead
      const error = new Error('This email is not verified yet. Please verify your email first.');
      error.statusCode = 400;
      throw error;
    }

    if (user.reset_sent_at) {
      const elapsedSeconds = (Date.now() - new Date(user.reset_sent_at).getTime()) / 1000;
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSeconds);
        const error = new Error(`Please wait ${wait} second(s) before requesting another reset link.`);
        error.statusCode = 429;
        throw error;
      }
    }

    // Opaque token goes in the emailed link; only its hash is stored
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);
    await UserModel.setResetToken(user.id, hashCode(token), expiresAt);

    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: EMAIL_SUBJECTS.RESET_PASSWORD,
        html: passwordResetEmailHtml({
          name: user.first_name || '',
          resetUrl,
        }),
      });
    } catch (err) {
      // Never block the request if SMTP is down — surface the link in server logs
      console.warn(`[Auth] Failed to send password reset email to ${user.email}: ${err.message}`);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Auth] Password reset link for ${user.email}: ${resetUrl}`);
    }

    return true;
  }

  // Set a new password using a valid reset token
  static async resetPassword(token, newPassword) {
    const user = await UserModel.findByResetToken(hashCode(String(token || '').trim()));
    if (!user || !user.reset_expires_at || new Date(user.reset_expires_at) < new Date()) {
      const error = new Error('This reset link is invalid or has expired. Please request a new one.');
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    // Also clears the reset token + any persisted refresh token (logs out other sessions)
    await UserModel.resetPassword(user.id, hashedPassword);

    return true;
  }

  // Issue access + refresh tokens and persist the refresh token
  static async issueTokens(user) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await UserModel.updateRefreshToken(user.id, refreshToken);
    return { accessToken, refreshToken };
  }

  // Strip sensitive fields before returning a user object
  static sanitizeUser(user) {
    const safe = { ...user };
    delete safe.password;
    delete safe.refresh_token;
    delete safe.verification_code;
    delete safe.verification_expires_at;
    return safe;
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

    // Block unverified emails (existing/legacy accounts default to verified)
    if (Number(user.email_verified) === 0) {
      const error = new Error('Your email has not been verified yet. Please check your inbox for the 6-digit code.');
      error.statusCode = 403;
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
