const DealModel = require('../models/dealModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const getDeals = async (req, res, next) => {
  try {
    const deals = await DealModel.getAll();
    return sendSuccess(res, deals, 'Deals retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getActiveDeals = async (req, res, next) => {
  try {
    const deals = await DealModel.getActive();
    return sendSuccess(res, deals, 'Active deals retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getDealById = async (req, res, next) => {
  try {
    const deal = await DealModel.getById(req.params.id);
    if (!deal) return sendError(res, 'Deal not found', 404);
    return sendSuccess(res, deal, 'Deal retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createDeal = async (req, res, next) => {
  try {
    const { title, original_price, deal_price } = req.body;
    if (!title || original_price === undefined || deal_price === undefined) {
      return sendError(res, 'Title, original_price, and deal_price are required', 400);
    }
    const newDeal = await DealModel.create(req.body);
    return sendSuccess(res, newDeal, 'Deal created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateDeal = async (req, res, next) => {
  try {
    const existing = await DealModel.getById(req.params.id);
    if (!existing) return sendError(res, 'Deal not found', 404);

    const updated = await DealModel.update(req.params.id, { ...existing, ...req.body });
    return sendSuccess(res, updated, 'Deal updated successfully');
  } catch (error) {
    next(error);
  }
};

const toggleDealStatus = async (req, res, next) => {
  try {
    const updated = await DealModel.toggleActive(req.params.id);
    if (!updated) return sendError(res, 'Deal not found', 404);
    return sendSuccess(res, updated, 'Deal status toggled');
  } catch (error) {
    next(error);
  }
};

const deleteDeal = async (req, res, next) => {
  try {
    const success = await DealModel.delete(req.params.id);
    if (!success) return sendError(res, 'Deal not found', 404);
    return sendSuccess(res, null, 'Deal deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeals,
  getActiveDeals,
  getDealById,
  createDeal,
  updateDeal,
  toggleDealStatus,
  deleteDeal
};
