const { sendError } = require('../utils/responseHandler');

const validateBlog = (req, res, next) => {
  const { title, slug, excerpt, content, image } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Blog title is required and must be at least 3 characters long.');
  }

  if (!slug || typeof slug !== 'string' || slug.trim().length < 3) {
    errors.push('Blog slug is required and must be at least 3 characters long.');
  }

  if (!excerpt || typeof excerpt !== 'string' || excerpt.trim().length < 10) {
    errors.push('Blog excerpt is required and must be at least 10 characters long.');
  }

  if (!content || typeof content !== 'string' || content.trim().length < 20) {
    errors.push('Blog content is required and must be at least 20 characters long.');
  }

  if (!image || typeof image !== 'string') {
    errors.push('Blog header image URL is required.');
  }

  if (errors.length > 0) {
    return sendError(res, 'Blog Validation Error', 400, errors);
  }

  next();
};

module.exports = {
  validateBlog
};
