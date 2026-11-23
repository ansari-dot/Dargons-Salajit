const CertificationModel = require('../models/certificationModel');
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

const getCertifications = async (req, res, next) => {
  try {
    const items = await CertificationModel.findAll(req.query.active === 'true');
    return sendSuccess(res, items, 'Certifications fetched successfully');
  } catch (error) {
    next(error);
  }
};

const createCertification = async (req, res, next) => {
  try {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) return sendError(res, 'Certification title is required', 400);
    if (!isValidHttpUrl(req.body.document_url) || !isValidHttpUrl(req.body.image_url)) {
      return sendError(res, 'Image and document URLs must use HTTP or HTTPS', 400);
    }

    const id = await CertificationModel.create({ ...req.body, title });
    const created = await CertificationModel.findById(id);
    return sendSuccess(res, created, 'Certification created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateCertification = async (req, res, next) => {
  try {
    const existing = await CertificationModel.findById(req.params.id);
    if (!existing) return sendError(res, 'Certification not found', 404);

    const payload = { ...req.body };
    if (payload.title !== undefined) {
      payload.title = typeof payload.title === 'string' ? payload.title.trim() : '';
      if (!payload.title) return sendError(res, 'Certification title is required', 400);
    }
    if (!isValidHttpUrl(payload.document_url) || !isValidHttpUrl(payload.image_url)) {
      return sendError(res, 'Image and document URLs must use HTTP or HTTPS', 400);
    }
    await CertificationModel.update(req.params.id, payload);
    return sendSuccess(
      res,
      await CertificationModel.findById(req.params.id),
      'Certification updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

const deleteCertification = async (req, res, next) => {
  try {
    const existing = await CertificationModel.findById(req.params.id);
    if (!existing) return sendError(res, 'Certification not found', 404);

    await CertificationModel.delete(req.params.id);
    return sendSuccess(res, null, 'Certification deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
};
