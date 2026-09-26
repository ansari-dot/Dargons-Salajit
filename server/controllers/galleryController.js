const GalleryModel = require('../models/galleryModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const getGalleryItems = async (req, res, next) => {
  try {
    const activeOnly = req.query.active === 'true';
    const items = await GalleryModel.findAll(activeOnly);
    return sendSuccess(res, items, 'Gallery items fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getGalleryItemById = async (req, res, next) => {
  try {
    const item = await GalleryModel.findById(req.params.id);
    if (!item) {
      return sendError(res, 'Gallery item not found', 404);
    }
    return sendSuccess(res, item, 'Gallery item fetched successfully');
  } catch (error) {
    next(error);
  }
};

const createGalleryItem = async (req, res, next) => {
  try {
    const { title, image_url } = req.body;
    if (!title || !image_url) {
      return sendError(res, 'Title and Image URL are required', 400);
    }

    const created = await GalleryModel.create(req.body);
    const fullItem = await GalleryModel.findById(created.id);
    return sendSuccess(res, fullItem, 'Gallery item created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateGalleryItem = async (req, res, next) => {
  try {
    const item = await GalleryModel.findById(req.params.id);
    if (!item) {
      return sendError(res, 'Gallery item not found', 404);
    }

    await GalleryModel.update(req.params.id, req.body);
    const updatedItem = await GalleryModel.findById(req.params.id);
    return sendSuccess(res, updatedItem, 'Gallery item updated successfully');
  } catch (error) {
    next(error);
  }
};

const toggleGalleryItemStatus = async (req, res, next) => {
  try {
    const item = await GalleryModel.findById(req.params.id);
    if (!item) {
      return sendError(res, 'Gallery item not found', 404);
    }

    await GalleryModel.toggleStatus(req.params.id);
    const updatedItem = await GalleryModel.findById(req.params.id);
    return sendSuccess(res, updatedItem, `Gallery item '${updatedItem.title}' status updated`);
  } catch (error) {
    next(error);
  }
};

const deleteGalleryItem = async (req, res, next) => {
  try {
    const item = await GalleryModel.findById(req.params.id);
    if (!item) {
      return sendError(res, 'Gallery item not found', 404);
    }

    await GalleryModel.delete(req.params.id);
    return sendSuccess(res, null, `Gallery item '${item.title}' deleted successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  toggleGalleryItemStatus,
  deleteGalleryItem
};
