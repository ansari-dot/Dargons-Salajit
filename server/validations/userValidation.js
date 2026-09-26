const { sendError } = require('../utils/responseHandler');

// Regex patterns for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d\s().-]{7,20}$/;
const POSTAL_REGEX = /^[a-zA-Z0-9\s\-]{3,10}$/;

const validateUserData = (req, res, next) => {
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

  // 1. First Name Validation
  if (!first_name || typeof first_name !== 'string' || first_name.trim().length < 2) {
    errors.push('First name is required and must be at least 2 characters long.');
  }

  // 2. Email Validation
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required (e.g. user@example.com).');
  }

  // 3. Optional Phone Validation
  if (phone && phone.trim() !== '' && !PHONE_REGEX.test(phone.trim())) {
    errors.push('A valid phone number is required (e.g. +92 300 1234567).');
  }

  // 4. Password Validation (Optional for guest checkout, required for user registration)
  if (password !== undefined && password !== null && password !== '') {
    if (typeof password !== 'string' || password.length < 6) {
      errors.push('Password must be at least 6 characters long.');
    }
  }

  // Return validation errors if any exist
  if (errors.length > 0) {
    return sendError(res, 'Validation Error: Invalid input parameters', 400, errors);
  }

  next();
};

module.exports = {
  validateUserData
};
