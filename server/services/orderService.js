const OrderModel = require('../models/orderModel');

class OrderService {
  static async createOrder(orderData, userId = null) {
    // Automatically calculate subtotal & grand total if not provided
    let calculatedSubtotal = 0;
    for (const item of orderData.items) {
      calculatedSubtotal += item.unit_price * item.quantity;
    }

    const discountAmount = orderData.discount_amount || 0;

    // Delivery charges are collected on top of the products
    const deliveryCharge = Math.max(0, Number(orderData.delivery_charge) || 0);
    const deliveryType =
      String(orderData.delivery_type || 'normal').toLowerCase() === 'urgent' ? 'urgent' : 'normal';

    const grandTotal = calculatedSubtotal - discountAmount + deliveryCharge;

    const payload = {
      ...orderData,
      user_id: userId || orderData.user_id || null,
      subtotal: calculatedSubtotal,
      delivery_type: deliveryType,
      delivery_charge: deliveryCharge,
      grand_total: grandTotal
    };

    const { id, order_number } = await OrderModel.createOrder(payload);
    return await OrderModel.findById(id);
  }

  static async getOrderById(id) {
    const order = await OrderModel.findById(id);
    if (!order) {
      const error = new Error(`Order ID ${id} not found`);
      error.statusCode = 404;
      throw error;
    }
    return order;
  }

  static async getOrders(userId = null, email = null) {
    return await OrderModel.findAll(userId, email);
  }

  static async updateOrderStatus(id, status) {
    await this.getOrderById(id);
    await OrderModel.updateStatus(id, status);
    return await OrderModel.findById(id);
  }
}

module.exports = OrderService;
