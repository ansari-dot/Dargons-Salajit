const CartModel = require('../models/cartModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const getCart = async (req, res) => {
  try {
    const items = await CartModel.getCartByUserId(req.user.id);
    return sendSuccess(res, items, 'User cart retrieved successfully');
  } catch (error) {
    console.error('Error in getCart controller:', error);
    return sendError(res, 'Failed to fetch user cart', 500);
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity, size } = req.body;
    if (!productId) {
      return sendError(res, 'productId is required', 400);
    }
    const items = await CartModel.addItem(req.user.id, productId, quantity || 1, size || '50g');
    return sendSuccess(res, items, 'Item added to cart in database', 201);
  } catch (error) {
    console.error('Error in addToCart controller:', error);
    return sendError(res, 'Failed to add item to cart', 500);
  }
};

const updateQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || quantity === undefined) {
      return sendError(res, 'productId and quantity are required', 400);
    }
    const items = await CartModel.updateQuantity(req.user.id, productId, quantity);
    return sendSuccess(res, items, 'Cart quantity updated');
  } catch (error) {
    console.error('Error in updateQuantity controller:', error);
    return sendError(res, 'Failed to update cart quantity', 500);
  }
};

const removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return sendError(res, 'productId parameter is required', 400);
    }
    const items = await CartModel.removeItem(req.user.id, productId);
    return sendSuccess(res, items, 'Item removed from cart');
  } catch (error) {
    console.error('Error in removeItem controller:', error);
    return sendError(res, 'Failed to remove item from cart', 500);
  }
};

const clearCart = async (req, res) => {
  try {
    const items = await CartModel.clearCart(req.user.id);
    return sendSuccess(res, items, 'Cart cleared successfully');
  } catch (error) {
    console.error('Error in clearCart controller:', error);
    return sendError(res, 'Failed to clear cart', 500);
  }
};

const mergeCart = async (req, res) => {
  try {
    const { items: localItems } = req.body;
    const items = await CartModel.mergeCart(req.user.id, localItems || []);
    return sendSuccess(res, items, 'Local cart merged with database cart successfully');
  } catch (error) {
    console.error('Error in mergeCart controller:', error);
    return sendError(res, 'Failed to merge cart', 500);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeItem,
  clearCart,
  mergeCart,
};
