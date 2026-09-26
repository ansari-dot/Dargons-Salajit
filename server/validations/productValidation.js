const { sendError } = require('../utils/responseHandler');

const validateProduct = (req, res, next) => {
  const { name, category_id, price, sku, main_image } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Product name is required and must be at least 2 characters long.');
  }

  if (!category_id || isNaN(Number(category_id))) {
    errors.push('A valid category_id is required.');
  }

  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    errors.push('A valid non-negative product price is required.');
  }

  if (!sku || typeof sku !== 'string' || sku.trim().length < 2) {
    errors.push('Product SKU is required.');
  }

  if (!main_image || typeof main_image !== 'string') {
    errors.push('Main product image URL is required.');
  }

  if (errors.length > 0) {
    return sendError(res, 'Product Validation Error', 400, errors);
  }

  next();
};

module.exports = {
  validateProduct
};
