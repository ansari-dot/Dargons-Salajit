const CouponModel = require('../models/couponModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal, email } = req.body;

    if (!code) {
      return sendError(res, 'Coupon code is required', 400);
    }

    const result = await CouponModel.validateCoupon(code, subtotal, email);

    if (!result.valid) {
      return sendError(res, result.message, 400);
    }

    return sendSuccess(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

const getCoupons = async (req, res, next) => {
  try {
    const coupons = await CouponModel.findAll();
    return sendSuccess(res, coupons, 'Coupons fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getCouponById = async (req, res, next) => {
  try {
    const coupon = await CouponModel.findById(req.params.id);
    if (!coupon) {
      return sendError(res, 'Coupon not found', 404);
    }
    return sendSuccess(res, coupon, 'Coupon fetched successfully');
  } catch (error) {
    next(error);
  }
};

const createCoupon = async (req, res, next) => {
  try {
    const { code, discount_value } = req.body;
    if (!code || discount_value === undefined || discount_value === null) {
      return sendError(res, 'Coupon code and discount value are required', 400);
    }

    const existing = await CouponModel.findByCode(code);
    if (existing) {
      return sendError(res, `Coupon code '${code.toUpperCase()}' already exists`, 400);
    }

    const created = await CouponModel.create(req.body);
    const fullCoupon = await CouponModel.findById(created.id);
    return sendSuccess(res, fullCoupon, 'Coupon created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await CouponModel.findById(req.params.id);
    if (!coupon) {
      return sendError(res, 'Coupon not found', 404);
    }

    if (req.body.code && req.body.code.toUpperCase() !== coupon.code.toUpperCase()) {
      const existing = await CouponModel.findByCode(req.body.code);
      if (existing) {
        return sendError(res, `Coupon code '${req.body.code.toUpperCase()}' already exists`, 400);
      }
    }

    await CouponModel.update(req.params.id, req.body);
    const updatedCoupon = await CouponModel.findById(req.params.id);
    return sendSuccess(res, updatedCoupon, 'Coupon updated successfully');
  } catch (error) {
    next(error);
  }
};

const toggleCouponStatus = async (req, res, next) => {
  try {
    const coupon = await CouponModel.findById(req.params.id);
    if (!coupon) {
      return sendError(res, 'Coupon not found', 404);
    }

    await CouponModel.toggleStatus(req.params.id);
    const updatedCoupon = await CouponModel.findById(req.params.id);
    return sendSuccess(res, updatedCoupon, `Coupon '${updatedCoupon.code}' status updated`);
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await CouponModel.findById(req.params.id);
    if (!coupon) {
      return sendError(res, 'Coupon not found', 404);
    }

    await CouponModel.delete(req.params.id);
    return sendSuccess(res, null, `Coupon '${coupon.code}' deleted successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCoupon,
  getCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon
};
