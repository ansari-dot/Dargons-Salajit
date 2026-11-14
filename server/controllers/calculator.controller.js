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
    const [result] = await db.query(
      `INSERT INTO calculator_pricing_tiers
        (entity_type, entity_id, min_quantity, max_quantity, rate, estimated_weight, is_open_ended, is_active, effective_from, effective_until, pricing_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [
        entity_type, entity_id, min_quantity, max_quantity ?? null, rate,
        estimated_weight ?? null, is_open_ended ? 1 : 0, effective_from || null,
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
    const {
      min_quantity, max_quantity, rate, estimated_weight,
      is_open_ended, is_active, effective_from, effective_until, pricing_version
    } = req.body;
    const hasEstimatedWeight = Object.prototype.hasOwnProperty.call(req.body, 'estimated_weight');
    await db.query(
      `UPDATE calculator_pricing_tiers
       SET min_quantity = COALESCE(?, min_quantity),
           max_quantity = ?,
           rate = COALESCE(?, rate),
           estimated_weight = IF(?, ?, estimated_weight),
           is_open_ended = COALESCE(?, is_open_ended),
           is_active = COALESCE(?, is_active),
           effective_from = ?,
           effective_until = ?,
           pricing_version = COALESCE(?, pricing_version)
       WHERE id = ?`,
      [
        min_quantity, max_quantity !== undefined ? max_quantity : null, rate,
        hasEstimatedWeight, estimated_weight ?? null, is_open_ended ? 1 : 0,
        is_active, effective_from || null, effective_until || null, pricing_version, id
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
