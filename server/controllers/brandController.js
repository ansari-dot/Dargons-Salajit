const fs = require('fs');
const path = require('path');
const BrandModel = require('../models/brandModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const BRAND_LOGO_DIR = path.join(__dirname, '..', 'uploads', 'brand-logos');

// Public URL of the uploaded brand logo (served from /uploads/brand-logos)
const buildLogoUrl = (req) =>
  `${req.protocol}://${req.get('host')}/uploads/brand-logos/${req.file.filename}`;

// Meta stored alongside the brand record
const buildLogoMeta = (req) => ({
  logo_url: buildLogoUrl(req),
  file_name: req.file.filename,
  file_size: req.file.size,
  mime_type: req.file.mimetype
});

// Best-effort removal of the physical logo file when a brand is replaced / deleted
const removeLogoFile = (fileName) => {
  if (!fileName) return;
  try {
    const filePath = path.join(BRAND_LOGO_DIR, path.basename(fileName));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    console.warn(`[Brand] Could not remove logo file '${fileName}':`, error.message);
  }
};

const getBrands = async (req, res, next) => {
  try {
    const activeOnly = req.query.active === 'true';
    const brands = await BrandModel.getAll(activeOnly);
    return sendSuccess(res, brands, 'Brands retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getBrandById = async (req, res, next) => {
  try {
    const brand = await BrandModel.getById(req.params.id);
    if (!brand) return sendError(res, 'Brand not found', 404);
    return sendSuccess(res, brand, 'Brand retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createBrand = async (req, res, next) => {
  try {
    const { name, description, is_active } = req.body || {};

    if (!name || !String(name).trim()) {
      return sendError(res, 'Brand name is required', 400);
    }

    if (!req.file) {
      return sendError(res, 'Brand logo image is required', 400);
    }

    const created = await BrandModel.create({
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      ...buildLogoMeta(req),
      is_active: is_active === undefined ? 1 : (is_active === true || is_active === 'true' || is_active === 1 || is_active === '1')
    });

    return sendSuccess(res, created, `Brand '${created.name}' uploaded successfully`, 201);
  } catch (error) {
    // Never leave an orphaned logo file behind when the insert fails
    if (req.file) removeLogoFile(req.file.filename);

    next(error);
  }
};

const updateBrand = async (req, res, next) => {
  try {
    const existing = await BrandModel.getById(req.params.id);
    if (!existing) return sendError(res, 'Brand not found', 404);

    const { name, description, is_active } = req.body || {};
    const updates = {};

    if (name !== undefined) updates.name = String(name).trim();
    if (description !== undefined) updates.description = description ? String(description).trim() : null;
    if (is_active !== undefined) {
      updates.is_active = is_active === true || is_active === 'true' || is_active === 1 || is_active === '1';
    }

    // A replacement logo was uploaded with this request
    if (req.file) {
      Object.assign(updates, buildLogoMeta(req));
      removeLogoFile(existing.file_name);
    }

    const updated = await BrandModel.update(req.params.id, updates);
    return sendSuccess(res, updated, 'Brand updated successfully');
  } catch (error) {
    next(error);
  }
};

const toggleBrandStatus = async (req, res, next) => {
  try {
    const existing = await BrandModel.getById(req.params.id);
    if (!existing) return sendError(res, 'Brand not found', 404);

    const updated = await BrandModel.toggleActive(req.params.id);
    return sendSuccess(res, updated, `Brand '${updated.name}' visibility updated`);
  } catch (error) {
    next(error);
  }
};

const deleteBrand = async (req, res, next) => {
  try {
    const existing = await BrandModel.getById(req.params.id);
    if (!existing) return sendError(res, 'Brand not found', 404);

    const deleted = await BrandModel.delete(req.params.id);
    if (!deleted) return sendError(res, 'Brand not found', 404);

    removeLogoFile(existing.file_name);
    return sendSuccess(res, null, `Brand '${existing.name}' deleted successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  toggleBrandStatus,
  deleteBrand
};
