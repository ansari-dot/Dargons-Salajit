const OrderService = require('../services/orderService');
const { sendSuccess } = require('../utils/responseHandler');

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const order = await OrderService.createOrder(req.body, userId);
    return sendSuccess(res, order, 'Order placed successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const userId  = isAdmin ? null : (req.user?.id || null);
    const email   = isAdmin ? null : (req.user?.email || req.query.email || null);

    const orders = await OrderService.getOrders(userId, email);
    return sendSuccess(res, orders, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await OrderService.getOrderById(req.params.id);
    return sendSuccess(res, order, 'Order details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await OrderService.updateOrderStatus(req.params.id, status);
    return sendSuccess(res, updated, `Order status updated to '${status}'`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus
};
