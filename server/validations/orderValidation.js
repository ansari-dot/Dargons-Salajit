const { sendError } = require('../utils/responseHandler');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,10}$/;

const validateOrder = (req, res, next) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    street_address,
    city,
    postal_code,
    delivery_type,
    delivery_charge,
    items
  } = req.body;

  const errors = [];

  if (!first_name || typeof first_name !== 'string') errors.push('First name is required.');
  if (!last_name || typeof last_name !== 'string') errors.push('Last name is required.');
  if (!email || !EMAIL_REGEX.test(email.trim())) errors.push('Valid email address is required.');
  if (!phone || !PHONE_REGEX.test(phone.trim())) errors.push('Valid phone number is required.');
  if (!street_address || typeof street_address !== 'string') errors.push('Street address is required.');
  if (!city || typeof city !== 'string') errors.push('City is required.');
  if (!postal_code || typeof postal_code !== 'string') errors.push('Postal code is required.');

  // Delivery: Normal / Urgent speed + the delivery charge (PKR) collected
  if (
    delivery_type !== undefined &&
    delivery_type !== null &&
    delivery_type !== '' &&
    !['normal', 'urgent'].includes(String(delivery_type).toLowerCase())
  ) {
    errors.push("Delivery type must be either 'normal' or 'urgent'.");
  }

  if (delivery_charge !== undefined && delivery_charge !== null && delivery_charge !== '') {
    const charge = Number(delivery_charge);
    if (isNaN(charge) || charge < 0 || charge > 100000) {
      errors.push('Delivery charge must be a valid amount between 0 and 100,000.');
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('Order must contain at least one item.');
  } else {
    items.forEach((item, index) => {
      if (!item.product_id || isNaN(Number(item.product_id))) {
        errors.push(`Item at index ${index} missing valid product_id.`);
      }
      if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
        errors.push(`Item at index ${index} must have a positive quantity.`);
      }
      if (item.unit_price === undefined || isNaN(Number(item.unit_price))) {
        errors.push(`Item at index ${index} missing valid unit_price.`);
      }
    });
  }

  if (errors.length > 0) {
    return sendError(res, 'Order Validation Error', 400, errors);
  }

  next();
};

module.exports = {
  validateOrder
};
