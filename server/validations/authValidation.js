const { sendError } = require('../utils/responseHandler');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{2,4}[-\s\.]?[0-9]{2,4}[-\s\.]?[0-9]{0,6}$/;
const POSTAL_REGEX = /^[a-zA-Z0-9\s\-]{3,10}$/;

const validateRegister = (req, res, next) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    street_address,
    city,
    postal_code,
    password
  } = req.body;

  const errors = [];

  if (!first_name || typeof first_name !== 'string' || first_name.trim().length < 2) {
    errors.push('First name is required and must be at least 2 characters long.');
  }

  if (!last_name || typeof last_name !== 'string' || last_name.trim().length < 2) {
    errors.push('Last name is required and must be at least 2 characters long.');
  }

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!phone || !PHONE_REGEX.test(phone.trim())) {
    errors.push('A valid phone number is required.');
  }

  if (!street_address || typeof street_address !== 'string' || street_address.trim().length < 5) {
    errors.push('Street address is required and must be at least 5 characters long.');
  }

  if (!city || typeof city !== 'string' || city.trim().length < 2) {
    errors.push('City is required.');
  }

  if (!postal_code || !POSTAL_REGEX.test(postal_code.trim())) {
    errors.push('A valid postal code is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long.');
  }

  if (errors.length > 0) {
    return sendError(res, 'Registration Validation Error', 400, errors);
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return sendError(res, 'Login Validation Error', 400, errors);
  }

  next();
};

const validateVerifyEmail = (req, res, next) => {
  const { email, code } = req.body;
  const errors = [];

  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    errors.push('A valid email address is required.');
  }

  if (!code || !/^\d{6}$/.test(String(code).trim())) {
    errors.push('The 6-digit verification code is required.');
  }

  if (errors.length > 0) {
    return sendError(res, 'Verification Validation Error', 400, errors);
  }

  next();
};

const validateResendCode = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    errors.push('A valid email address is required.');
  }

  if (errors.length > 0) {
    return sendError(res, 'Resend Validation Error', 400, errors);
  }

  next();
};

const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    errors.push('A valid email address is required.');
  }

  if (errors.length > 0) {
    return sendError(res, 'Forgot Password Validation Error', 400, errors);
  }

  next();
};

const validateResetPassword = (req, res, next) => {
  const { token, password } = req.body;
  const errors = [];

  if (!token || typeof token !== 'string' || token.trim().length < 32) {
    errors.push('A valid reset token is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters long.');
  }

  if (errors.length > 0) {
    return sendError(res, 'Reset Password Validation Error', 400, errors);
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateResendCode,
  validateForgotPassword,
  validateResetPassword
};
