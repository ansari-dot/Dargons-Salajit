const {
  calculateCost,
  getCalculatorOptions,
  saveConfiguration,
  getConfigurationByReference
} = require('../services/calculator.service');
const db = require('../config/db');

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

const updateAdminProductController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, moq, min_product_cost, description, is_active } = req.body;
    await db.query(
      `UPDATE calculator_products
       SET name = COALESCE(?, name),
           moq = COALESCE(?, moq),
           min_product_cost = COALESCE(?, min_product_cost),
           description = COALESCE(?, description),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, moq, min_product_cost, description, is_active, id]
    );
    return res.json({ success: true, message: 'Product updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
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

const updateAdminPackagingController = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, type, moq, max_quantity, unit_price,
      material_cost, printing_cost, setup_cost, printing_moq, other_cost,
      dieline_url, dimensions, capacity, technical_specs, is_active,
      effective_from, effective_until, pricing_version
    } = req.body;

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
        dieline_url, dimensions, capacity, technical_specs, is_active,
        effective_from || null, effective_until || null, pricing_version, id
      ]
    );
    return res.json({ success: true, message: 'Packaging item updated successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
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
    const { entity_type, entity_id, min_quantity, max_quantity, rate, is_open_ended, effective_from, effective_until, pricing_version } = req.body;
    const [result] = await db.query(
      `INSERT INTO calculator_pricing_tiers
        (entity_type, entity_id, min_quantity, max_quantity, rate, is_open_ended, is_active, effective_from, effective_until, pricing_version)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [entity_type, entity_id, min_quantity, max_quantity || null, rate, is_open_ended ? 1 : 0, effective_from || null, effective_until || null, pricing_version || 1]
    );
    return res.status(201).json({ success: true, id: result.insertId, message: 'Pricing tier created' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateAdminPricingTierController = async (req, res) => {
  try {
    const { id } = req.params;
    const { min_quantity, max_quantity, rate, is_open_ended, is_active, effective_from, effective_until, pricing_version } = req.body;
    await db.query(
      `UPDATE calculator_pricing_tiers
       SET min_quantity = COALESCE(?, min_quantity),
           max_quantity = ?,
           rate = COALESCE(?, rate),
           is_open_ended = COALESCE(?, is_open_ended),
           is_active = COALESCE(?, is_active),
           effective_from = ?,
           effective_until = ?,
           pricing_version = COALESCE(?, pricing_version)
       WHERE id = ?`,
      [min_quantity, max_quantity !== undefined ? max_quantity : null, rate, is_open_ended ? 1 : 0, is_active, effective_from || null, effective_until || null, pricing_version, id]
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
  saveConfigurationController,
  getConfigurationByReferenceController,
  getAdminProductsController,
  updateAdminProductController,
  getAdminPackagingController,
  updateAdminPackagingController,
  getAdminPricingTiersController,
  createAdminPricingTierController,
  updateAdminPricingTierController,
  deleteAdminPricingTierController
};
