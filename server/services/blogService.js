const BlogModel = require('../models/blogModel');

class BlogService {
  static async getBlogs(filters) {
    return await BlogModel.findAll(filters);
  }

  static async getBlogByIdOrSlug(idOrSlug) {
    const blog = await BlogModel.findByIdOrSlug(idOrSlug);
    if (!blog) {
      const error = new Error(`Blog post '${idOrSlug}' not found.`);
      error.statusCode = 404;
      throw error;
    }
    return blog;
  }

  static async createBlog(blogData) {
    // Check slug uniqueness
    const existing = await BlogModel.findByIdOrSlug(blogData.slug);
    if (existing) {
      const error = new Error('A blog post with this slug already exists.');
      error.statusCode = 409;
      throw error;
    }

    const newId = await BlogModel.create(blogData);
    return await BlogModel.findByIdOrSlug(newId);
  }

  static async updateBlog(id, blogData) {
    await this.getBlogByIdOrSlug(id); // Ensure blog exists

    if (blogData.slug) {
      const existing = await BlogModel.findByIdOrSlug(blogData.slug);
      if (existing && existing.id !== parseInt(id, 10)) {
        const error = new Error('Another blog post with this slug already exists.');
        error.statusCode = 409;
        throw error;
      }
    }

    await BlogModel.update(id, blogData);
    return await BlogModel.findByIdOrSlug(id);
  }

  static async deleteBlog(id) {
    await this.getBlogByIdOrSlug(id);
    await BlogModel.delete(id);
    return true;
  }
}

module.exports = BlogService;
