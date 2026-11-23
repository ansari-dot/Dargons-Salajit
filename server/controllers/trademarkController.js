const TrademarkModel = require('../models/trademarkModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const isValidHttpUrl = (value) => {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value !== 'string') return false;
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

const getTrademarks = async (req, res, next) => {
  try {
    const items = await TrademarkModel.findAll(req.query.active === 'true');
    return sendSuccess(res, items, 'Trademarks fetched successfully');
  } catch (error) {
    next(error);
  }
};

const createTrademark = async (req, res, next) => {
  try {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) return sendError(res, 'Trademark title is required', 400);
    if (!isValidHttpUrl(req.body.document_url) || !isValidHttpUrl(req.body.image_url)) {
      return sendError(res, 'Image and document URLs must use HTTP or HTTPS', 400);
    }

    const id = await TrademarkModel.create({ ...req.body, title });
    const created = await TrademarkModel.findById(id);
    return sendSuccess(res, created, 'Trademark created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateTrademark = async (req, res, next) => {
  try {
    const existing = await TrademarkModel.findById(req.params.id);
    if (!existing) return sendError(res, 'Trademark not found', 404);

    const payload = { ...req.body };
    if (payload.title !== undefined) {
      payload.title = typeof payload.title === 'string' ? payload.title.trim() : '';
      if (!payload.title) return sendError(res, 'Trademark title is required', 400);
    }
    if (!isValidHttpUrl(payload.document_url) || !isValidHttpUrl(payload.image_url)) {
      return sendError(res, 'Image and document URLs must use HTTP or HTTPS', 400);
    }
    await TrademarkModel.update(req.params.id, payload);
    return sendSuccess(
      res,
      await TrademarkModel.findById(req.params.id),
      'Trademark updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

const deleteTrademark = async (req, res, next) => {
  try {
    const existing = await TrademarkModel.findById(req.params.id);
    if (!existing) return sendError(res, 'Trademark not found', 404);

    await TrademarkModel.delete(req.params.id);
    return sendSuccess(res, null, 'Trademark deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrademarks,
  createTrademark,
  updateTrademark,
  deleteTrademark,
};
