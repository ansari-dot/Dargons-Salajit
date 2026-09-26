const WishlistModel = require('../models/wishlistModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const getWishlist = async (req, res) => {
  try {
    const items = await WishlistModel.getWishlistByUserId(req.user.id);
    return sendSuccess(res, items, 'User wishlist retrieved successfully');
  } catch (error) {
    console.error('Error in getWishlist controller:', error);
    return sendError(res, 'Failed to fetch user wishlist', 500);
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return sendError(res, 'productId is required', 400);
    }
    const items = await WishlistModel.toggleItem(req.user.id, productId);
    return sendSuccess(res, items, 'Wishlist updated successfully');
  } catch (error) {
    console.error('Error in toggleWishlist controller:', error);
    return sendError(res, 'Failed to toggle wishlist item', 500);
  }
};

const removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return sendError(res, 'productId parameter is required', 400);
    }
    const items = await WishlistModel.removeItem(req.user.id, productId);
    return sendSuccess(res, items, 'Item removed from wishlist');
  } catch (error) {
    console.error('Error in removeItem controller:', error);
    return sendError(res, 'Failed to remove item from wishlist', 500);
  }
};

const clearWishlist = async (req, res) => {
  try {
    const items = await WishlistModel.clearWishlist(req.user.id);
    return sendSuccess(res, items, 'Wishlist cleared successfully');
  } catch (error) {
    console.error('Error in clearWishlist controller:', error);
    return sendError(res, 'Failed to clear wishlist', 500);
  }
};

const mergeWishlist = async (req, res) => {
  try {
    const { items: localItems } = req.body;
    const items = await WishlistModel.mergeWishlist(req.user.id, localItems || []);
    return sendSuccess(res, items, 'Local wishlist merged with database successfully');
  } catch (error) {
    console.error('Error in mergeWishlist controller:', error);
    return sendError(res, 'Failed to merge wishlist', 500);
  }
};

module.exports = {
  getWishlist,
  toggleWishlist,
  removeItem,
  clearWishlist,
  mergeWishlist,
};
