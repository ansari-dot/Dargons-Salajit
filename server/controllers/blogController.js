const BlogService = require('../services/blogService');
const { sendSuccess } = require('../utils/responseHandler');

const getAllBlogs = async (req, res, next) => {
  try {
    const blogs = await BlogService.getBlogs(req.query);
    return sendSuccess(res, blogs, 'Blog posts retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

const getBlog = async (req, res, next) => {
  try {
    const blog = await BlogService.getBlogByIdOrSlug(req.params.id);
    return sendSuccess(res, blog, 'Blog post details retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

const createBlog = async (req, res, next) => {
  try {
    const newBlog = await BlogService.createBlog(req.body);
    return sendSuccess(res, newBlog, 'Blog post published successfully.', 201);
  } catch (error) {
    next(error);
  }
};

const updateBlog = async (req, res, next) => {
  try {
    const updated = await BlogService.updateBlog(req.params.id, req.body);
    return sendSuccess(res, updated, 'Blog post updated successfully.');
  } catch (error) {
    next(error);
  }
};

const deleteBlog = async (req, res, next) => {
  try {
    await BlogService.deleteBlog(req.params.id);
    return sendSuccess(res, null, 'Blog post deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog
};
