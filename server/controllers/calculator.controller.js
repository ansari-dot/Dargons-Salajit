const {
  calculateCost,
  getCalculatorOptions,
  saveConfiguration,
  getConfigurationByReference
} = require('../services/calculator.service');
const db = require('../config/db');
const {
  findOverlappingTier,
  isOpenEndedValue,
  validatePricingTier
} = require('../services/calculatorPricingTierValidation');
const {
  CALCULATOR_CURRENCIES,
  getCalculatorCurrencySettings
} = require('../services/calculatorCurrency.service');

const getTierOverlap = async (tier, excludedId) => {
  const [existingTiers] = await db.query(
    `SELECT id, min_quantity, max_quantity, is_open_ended, effective_from, effective_until
     FROM calculator_pricing_tiers
     WHERE entity_type = ? AND entity_id = ? AND is_active = 1`,
    [tier.entityType, tier.entityId]
  );
  return findOverlappingTier({ ...tier, id: excludedId }, existingTiers);
};

const calculateCostController = async (req, res) => {
  try {
    const data = req.body;
    const result = await calculateCost(data);

    return res.status(200).json({
      message: result.pricingAvailable
        ? 'Cost calculated successfully'
        : (result.message || 'Pricing is currently unavailable for this quantity. Please contact us for a custom quotation.'),
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    });
  }
};

const getCalculatorOptionsController = async (req, res) => {
  try {
    const result = await getCalculatorOptions();

    return res.status(200).json({
      message: 'Calculator options fetched successfully',
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    });
  }
};

const getAdminCalculatorCurrenciesController = async (req, res) => {
  try {
    const currencies = await getCalculatorCurrencySettings();
    return res.json({ success: true, data: currencies });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateAdminCalculatorCurrencyController = async (req, res) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!CALCULATOR_CURRENCIES.some((currency) => currency.code === code)) {
      return res.status(400).json({ success: false, message: 'Unsupported calculator currency.' });
    }

    const [rows] = await db.query(
      'SELECT * FROM calculator_currency_settings WHERE currency_code = ? LIMIT 1',
      [code]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Calculator currency configuration not found.' });
    }

    const current = rows[0];
    if (
      req.body.is_enabled !== undefined &&
      ![true, false, 1, 0, '1', '0'].includes(req.body.is_enabled)
    ) {
      return res.status(400).json({ success: false, message: 'Enabled must be a boolean value.' });
    }
    const isEnabled = req.body.is_enabled === undefined
      ? Boolean(current.is_enabled)
      : req.body.is_enabled === true || req.body.is_enabled === 1 || req.body.is_enabled === '1';
    if (code === 'PKR' && !isEnabled) {
      return res.status(400).json({ success: false, message: 'PKR must remain enabled as the base currency.' });
    }

    if (code === 'PKR' && req.body.rate_mode && req.body.rate_mode !== 'automatic') {
      return res.status(400).json({ success: false, message: 'PKR is the base currency and cannot use an exchange-rate override.' });
    }
    const rateMode = code === 'PKR'
      ? 'automatic'
      : (req.body.rate_mode === undefined ? current.rate_mode : req.body.rate_mode);
    if (!['automatic', 'manual'].includes(rateMode)) {
      return res.status(400).json({ success: false, message: 'Rate mode must be automatic or manual.' });
    }

    let manualRate = null;
    if (rateMode === 'manual') {
      manualRate = req.body.manual_rate_pkr_per_unit === undefined
        ? Number(current.manual_rate_pkr_per_unit)
        : Number(req.body.manual_rate_pkr_per_unit);
      if (!Number.isFinite(manualRate) || manualRate <= 0) {
        return res.status(400).json({ success: false, message: 'Manual exchange rate must be a positive number of PKR per currency unit.' });
      }
    }

    await db.query(
      `UPDATE calculator_currency_settings
       SET is_enabled = ?, rate_mode = ?, manual_rate_pkr_per_unit = ?
       WHERE currency_code = ?`,
      [isEnabled ? 1 : 0, rateMode, manualRate, code]
    );
    const currencies = await getCalculatorCurrencySettings();
    return res.json({
      success: true,
      message: `${code} calculator currency settings updated.`,
      data: currencies.find((currency) => currency.code === code)
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const saveConfigurationController = async (req, res) => {
  try {
    const data = req.body;
    const result = await saveConfiguration(data);

    return res.status(201).json({
      message: 'Configuration saved successfully',
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    });
  }
};

const getConfigurationByReferenceController = async (req, res) => {
  try {
    const { reference } = req.params;
    const result = await getConfigurationByReference(reference);

    if (!result) {
      return res.status(404).json({
        message: `Configuration with reference ${reference} not found`,
        success: false
      });
    }

    return res.status(200).json({
      message: 'Configuration fetched successfully',
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      success: false
    });
  }
};

// ── Admin Management Handlers ────────────────────────────────────────────────
// Manage Products
const getAdminProductsController = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM calculator_products ORDER BY id ASC');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createAdminProductController = async (req, res) => {
  try {
    const { name, unit_type, moq, min_product_cost, description, image_url, is_active } = req.body;
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    const slugBase = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = `${slugBase || 'product'}-${Date.now()}`;
    const [result] = await db.query(
      `INSERT INTO calculator_products
        (name, slug, unit_type, moq, min_product_cost, description, image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        slug,
        unit_type || 'units',
        Number.isFinite(Number(moq)) ? Number(moq) : 1,
        Number.isFinite(Number(min_product_cost)) ? Number(min_product_cost) : 0,
        description || null,
        image_url || null,
        is_active === undefined ? 1 : (is_active ? 1 : 0)
      ]
    );
    return res.status(201).json({ success: true, id: result.insertId, message: 'Product created successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateAdminProductController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit_type, moq, min_product_cost, description, is_active } = req.body;
    const hasImageUrl = Object.prototype.hasOwnProperty.call(req.body, 'image_url');
    await db.query(
      `UPDATE calculator_products
       SET name = COALESCE(?, name),
           unit_type = COALESCE(?, unit_type),
           moq = COALESCE(?, moq),
           min_product_cost = COALESCE(?, min_product_cost),
           description = COALESCE(?, description),
           image_url = IF(?, ?, image_url),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, unit_type, moq, min_product_cost, description, hasImageUrl, req.body.image_url || null, is_active, id]
    );
    return res.json({ success: true, message: 'Product updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAdminProductController = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM calculator_pricing_tiers WHERE entity_type = ? AND entity_id = ?', ['product', req.params.id]);
    await connection.query('DELETE FROM calculator_product_options_v2 WHERE product_id = ?', [req.params.id]);
    await connection.query('DELETE FROM calculator_product_packaging_rules WHERE product_id = ?', [req.params.id]);
    await connection.query('DELETE FROM calculator_products WHERE id = ?', [req.params.id]);
    await connection.commit();
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    await connection.rollback();
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
};

// Manage Packaging
const getAdminPackagingController = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM calculator_packaging_items ORDER BY type, id ASC');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createAdminPackagingController = async (req, res) => {
  try {
    const {
      name, code, type, moq, max_quantity, unit_price,
      material_cost, printing_cost, setup_cost, printing_moq, other_cost,
      image_url, estimated_weight, dieline_url, dimensions, capacity, technical_specs, is_active,
      effective_from, effective_until, pricing_version
    } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof type !== 'string' || !type.trim()) {
      return res.status(400).json({ success: false, message: 'Packaging name and type are required.' });
    }

    const generatedCode = code || `${type.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${Date.now()}`;
    const [result] = await db.query(
      `INSERT INTO calculator_packaging_items
        (name, code, type, moq, max_quantity, unit_price, material_cost, printing_cost,
         setup_cost, printing_moq, other_cost, image_url, estimated_weight, dieline_url, dimensions,
         capacity, technical_specs, is_active, effective_from, effective_until, pricing_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(), generatedCode, type, Number(moq) || 200,
        max_quantity ?? null, unit_price ?? null, Number(material_cost) || 0,
        Number(printing_cost) || 0, Number(setup_cost) || 0, Number(printing_moq) || 0,
        Number(other_cost) || 0, image_url || null, estimated_weight || null, dieline_url || null, dimensions || null,
        capacity || null, technical_specs || null, is_active === false ? 0 : 1,
        effective_from || null, effective_until || null, Number(pricing_version) || 1
      ]
    );
    return res.status(201).json({ success: true, id: result.insertId, message: 'Packaging item created successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateAdminPackagingController = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, type, moq, max_quantity, unit_price,
      material_cost, printing_cost, setup_cost, printing_moq, other_cost,
      image_url, estimated_weight, dieline_url, dimensions, capacity, technical_specs, is_active,
      effective_from, effective_until, pricing_version
    } = req.body;
    const hasImageUrl = Object.prototype.hasOwnProperty.call(req.body, 'image_url');
    const hasEstimatedWeight = Object.prototype.hasOwnProperty.call(req.body, 'estimated_weight');

    await db.query(
      `UPDATE calculator_packaging_items
       SET name = COALESCE(?, name),
           type = COALESCE(?, type),
           moq = COALESCE(?, moq),
           max_quantity = ?,
           unit_price = ?,
           material_cost = COALESCE(?, material_cost),
           printing_cost = COALESCE(?, printing_cost),
           setup_cost = COALESCE(?, setup_cost),
           printing_moq = COALESCE(?, printing_moq),
           other_cost = COALESCE(?, other_cost),
           image_url = IF(?, ?, image_url),
           estimated_weight = IF(?, ?, estimated_weight),
           dieline_url = COALESCE(?, dieline_url),
           dimensions = COALESCE(?, dimensions),
           capacity = COALESCE(?, capacity),
           technical_specs = COALESCE(?, technical_specs),
           is_active = COALESCE(?, is_active),
           effective_from = ?,
           effective_until = ?,
           pricing_version = COALESCE(?, pricing_version)
       WHERE id = ?`,
      [
        name, type, moq, max_quantity !== undefined ? max_quantity : null,
        unit_price !== undefined ? unit_price : null,
        material_cost, printing_cost, setup_cost, printing_moq, other_cost,
        hasImageUrl, image_url || null, hasEstimatedWeight, estimated_weight || null,
        dieline_url, dimensions, capacity, technical_specs, is_active,
        effective_from || null, effective_until || null, pricing_version, id
      ]
    );
    return res.json({ success: true, message: 'Packaging item updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAdminPackagingController = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM calculator_pricing_tiers WHERE entity_type = ? AND entity_id = ?', ['packaging', req.params.id]);
    await connection.query('DELETE FROM calculator_product_packaging_rules WHERE packaging_id = ?', [req.params.id]);
    await connection.query('DELETE FROM calculator_packaging_items WHERE id = ?', [req.params.id]);
    await connection.commit();
    return res.json({ success: true, message: 'Packaging item deleted successfully' });
  } catch (err) {
    await connection.rollback();
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
};

// Manage Pricing Tiers
const getAdminPricingTiersController = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM calculator_pricing_tiers ORDER BY entity_type, entity_id, min_quantity ASC');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createAdminPricingTierController = async (req, res) => {
  try {
    const {
      entity_type, entity_id, min_quantity, max_quantity, rate, estimated_weight,
      is_open_ended, effective_from, effective_until, pricing_version
    } = req.body;
    const openEnded = isOpenEndedValue(is_open_ended);
    const tier = {
      entityType: entity_type,
      entityId: entity_id,
      minQuantity: min_quantity,
      maxQuantity: openEnded ? null : max_quantity,
      rate,
      isOpenEnded: openEnded,
      effectiveFrom: effective_from || null,
      effectiveUntil: effective_until || null
    };
    const validationError = validatePricingTier(tier);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const entityTable = entity_type === 'product' ? 'calculator_products' : 'calculator_packaging_items';
    const [entityRows] = await db.query(`SELECT id FROM ${entityTable} WHERE id = ? LIMIT 1`, [entity_id]);
    if (entityRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Tier entity does not exist.' });
    }

    if (await getTierOverlap(tier)) {
      return res.status(400).json({ success: false, message: 'This tier overlaps an active tier for the same item and date range.' });
    }

    const [result] = await db.query(
      `INSERT INTO calculator_pricing_tiers
        (entity_type, entity_id, min_quantity, max_quantity, rate, estimated_weight, is_open_ended, is_active, effective_from, effective_until, pricing_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [
        entity_type, entity_id, min_quantity, tier.maxQuantity, rate,
        estimated_weight ?? null, openEnded ? 1 : 0, effective_from || null,
        effective_until || null, pricing_version || 1
      ]
    );
    return res.status(201).json({ success: true, id: result.insertId, message: 'Pricing tier created' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateAdminPricingTierController = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM calculator_pricing_tiers WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pricing tier not found.' });
    }

    const current = rows[0];
    const has = (field) => Object.prototype.hasOwnProperty.call(req.body, field);
    const hasEstimatedWeight = Object.prototype.hasOwnProperty.call(req.body, 'estimated_weight');
    const openEnded = has('is_open_ended')
      ? isOpenEndedValue(req.body.is_open_ended)
      : Boolean(current.is_open_ended);
    const tier = {
      id: Number(id),
      entityType: current.entity_type,
      entityId: current.entity_id,
      minQuantity: has('min_quantity') ? req.body.min_quantity : current.min_quantity,
      maxQuantity: openEnded
        ? null
        : (has('max_quantity') ? req.body.max_quantity : current.max_quantity),
      rate: has('rate') ? req.body.rate : current.rate,
      isOpenEnded: openEnded,
      effectiveFrom: has('effective_from') ? (req.body.effective_from || null) : current.effective_from,
      effectiveUntil: has('effective_until') ? (req.body.effective_until || null) : current.effective_until
    };
    const validationError = validatePricingTier(tier);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const isActive = has('is_active') ? Boolean(req.body.is_active) : Boolean(current.is_active);
    if (isActive && await getTierOverlap(tier, id)) {
      return res.status(400).json({ success: false, message: 'This tier overlaps an active tier for the same item and date range.' });
    }

    await db.query(
      `UPDATE calculator_pricing_tiers
       SET min_quantity = ?,
           max_quantity = ?,
           rate = ?,
           estimated_weight = IF(?, ?, estimated_weight),
           is_open_ended = ?,
           is_active = ?,
           effective_from = ?,
           effective_until = ?,
           pricing_version = ?
       WHERE id = ?`,
      [
        tier.minQuantity, tier.maxQuantity, tier.rate,
        hasEstimatedWeight, req.body.estimated_weight ?? null,
        openEnded ? 1 : 0, isActive ? 1 : 0,
        tier.effectiveFrom, tier.effectiveUntil,
        has('pricing_version') ? req.body.pricing_version : current.pricing_version, id
      ]
    );
    return res.json({ success: true, message: 'Pricing tier updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAdminPricingTierController = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM calculator_pricing_tiers WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Pricing tier deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  calculateCostController,
  getCalculatorOptionsController,
  getAdminCalculatorCurrenciesController,
  updateAdminCalculatorCurrencyController,
  saveConfigurationController,
  getConfigurationByReferenceController,
  getAdminProductsController,
  createAdminProductController,
  updateAdminProductController,
  deleteAdminProductController,
  getAdminPackagingController,
  createAdminPackagingController,
  updateAdminPackagingController,
  deleteAdminPackagingController,
  getAdminPricingTiersController,
  createAdminPricingTierController,
  updateAdminPricingTierController,
  deleteAdminPricingTierController
};
