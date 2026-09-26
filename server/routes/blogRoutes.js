const express = require('express');
const router = express.Router();

const {
  getAllBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog
} = require('../controllers/blogController');

const { validateBlog } = require('../validations/blogValidation');

// Public Blog Feed & Detail Endpoints
router.get('/', getAllBlogs);
router.get('/:id', getBlog);

// Blog Management Endpoints (Auth temporarily bypassed per request)
router.post('/', validateBlog, createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);

module.exports = router;
