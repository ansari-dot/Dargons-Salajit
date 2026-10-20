/**
 * Migration & Seed Script for Private Label Shilajit Configuration & Cost Calculator
 * Implements specifications from Developer Specification PDF
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/db');

async function migrate() {
  console.log('🚀 Starting calculator migration and database seed...');

  // 1. Calculator Products Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS calculator_products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      unit_type VARCHAR(50) NOT NULL DEFAULT 'units',
      moq DECIMAL(12,2) NOT NULL DEFAULT 1,
      min_product_cost DECIMAL(12,2) DEFAULT 0.00,
      description TEXT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // 2. Calculator Product Options (Fill sizes, strengths, bottle sizes)
  await db.query(`
    CREATE TABLE IF NOT EXISTS calculator_product_options_v2 (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      option_type VARCHAR(50) NOT NULL,
      label VARCHAR(100) NOT NULL,
      numeric_value DECIMAL(10,2) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      fixed_price DECIMAL(10,2) NULL,
      is_default BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_cpo_prod (product_id, option_type, is_active)
    )
  `);

  // 3. Calculator Packaging Items Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS calculator_packaging_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL UNIQUE,
      type VARCHAR(50) NOT NULL,
      moq INT NOT NULL DEFAULT 200,
      max_quantity INT NULL,
      unit_price DECIMAL(10,2) NULL,
      material_cost DECIMAL(10,2) DEFAULT 0.00,
      printing_cost DECIMAL(10,2) DEFAULT 0.00,
      setup_cost DECIMAL(10,2) DEFAULT 0.00,
      printing_moq INT DEFAULT 0,
      other_cost DECIMAL(10,2) DEFAULT 0.00,
      image_url VARCHAR(500) NULL,
      dieline_url VARCHAR(500) NULL,
      dimensions VARCHAR(100) NULL,
      capacity VARCHAR(100) NULL,
      technical_specs TEXT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      effective_from DATE NULL,
      effective_until DATE NULL,
      pricing_version INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_pkg_type (type, is_active)
    )
  `);

  // 4. Calculator Pricing Tiers Table (Centralized Pricing Engine)
  await db.query(`
    CREATE TABLE IF NOT EXISTS calculator_pricing_tiers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      entity_type ENUM('product', 'packaging') NOT NULL,
      entity_id INT NOT NULL,
      min_quantity DECIMAL(12,2) NOT NULL,
      max_quantity DECIMAL(12,2) NULL,
      rate DECIMAL(10,2) NOT NULL,
      is_open_ended BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      effective_from DATE NULL,
      effective_until DATE NULL,
      pricing_version INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_tiers_lookup (entity_type, entity_id, is_active)
    )
  `);

  // 5. Calculator Product Packaging Rules (Compatibility & Alternatives)
  await db.query(`
    CREATE TABLE IF NOT EXISTS calculator_product_packaging_rules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      packaging_id INT NOT NULL,
      component_type ENUM('required', 'optional', 'alternative') NOT NULL,
      alternative_group VARCHAR(50) NULL,
      suggested_qty_rule VARCHAR(50) NOT NULL DEFAULT 'per_finished_unit',
      is_default BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_rules_prod (product_id, is_active)
    )
  `);

  // 6. Calculator Saved Configurations Table
  await db.query(`
    CREATE TABLE IF NOT EXISTS calculator_saved_configurations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reference_no VARCHAR(50) NOT NULL UNIQUE,
      user_id INT NULL,
      customer_name VARCHAR(255) NULL,
      customer_email VARCHAR(255) NULL,
      customer_phone VARCHAR(50) NULL,
      product_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      fill_size VARCHAR(50) NULL,
      strength VARCHAR(50) NULL,
      bottle_size VARCHAR(50) NULL,
      finished_quantity INT NOT NULL,
      product_required_amount DECIMAL(12,2) NOT NULL,
      product_unit VARCHAR(20) NOT NULL,
      product_unit_price DECIMAL(10,2) NOT NULL,
      product_cost DECIMAL(12,2) NOT NULL,
      packaging_cost DECIMAL(12,2) NOT NULL,
      printing_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      setup_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      other_costs DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      shipping DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      discounts DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      estimated_project_cost DECIMAL(12,2) NOT NULL,
      packaging_breakdown JSON NOT NULL,
      pricing_snapshot JSON NOT NULL,
      status VARCHAR(50) DEFAULT 'saved',
      admin_note TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_saved_cfg_ref (reference_no),
      INDEX idx_saved_cfg_user (user_id)
    )
  `);

  // Add reference_no to calculator_requests if not exists
  try {
    await db.query(`ALTER TABLE calculator_requests ADD COLUMN reference_no VARCHAR(50) NULL AFTER id`);
  } catch (e) {}
  try {
    await db.query(`ALTER TABLE calculator_requests ADD COLUMN configuration_snapshot JSON NULL AFTER estimated_project_cost`);
  } catch (e) {}
  try {
    await db.query(`ALTER TABLE calculator_requests ADD COLUMN customer_name VARCHAR(255) NULL`);
    await db.query(`ALTER TABLE calculator_requests ADD COLUMN customer_email VARCHAR(255) NULL`);
    await db.query(`ALTER TABLE calculator_requests ADD COLUMN customer_phone VARCHAR(50) NULL`);
  } catch (e) {}
  try {
    await db.query(`ALTER TABLE calculator_requests DROP FOREIGN KEY calculator_requests_ibfk_2`);
  } catch (e) {}
  try {
    await db.query(`ALTER TABLE calculator_requests DROP FOREIGN KEY calculator_requests_ibfk_3`);
  } catch (e) {}

  console.log('✅ Tables created or confirmed.');

  // ── SEEDING PRODUCTS ──────────────────────────────────────────────────────────
  const products = [
    {
      id: 1,
      name: 'Gold Grade Shilajit Resin',
      slug: 'gold-grade-shilajit-resin',
      unit_type: 'grams',
      moq: 1000, // 1kg = 1000g
      min_product_cost: 0,
      description: 'Pure Gold Grade Himalayan Shilajit Resin with certified fulvic acid content.'
    },
    {
      id: 2,
      name: 'Liquid Shilajit 30ml',
      slug: 'liquid-shilajit-30ml',
      unit_type: 'ml',
      moq: 30, // at least 1 bottle of 30ml
      min_product_cost: 0,
      description: 'Liquid Shilajit packaged in 30ml Dropper Bottles.'
    },
    {
      id: 3,
      name: 'Shilajit Capsules',
      slug: 'shilajit-capsules',
      unit_type: 'capsules',
      moq: 10000, // MOQ 10,000 capsules
      min_product_cost: 0,
      description: 'Pure Shilajit extract capsules in 200mg and 400mg strengths.'
    },
    {
      id: 4,
      name: 'Shilajit Tablets',
      slug: 'shilajit-tablets',
      unit_type: 'blisters',
      moq: 500, // MOQ 500 blisters (3,500 tablets)
      min_product_cost: 500000.00, // Product 4 minimum product cost = Rs.500,000
      description: 'Shilajit tablets in blister packs (1 Blister = 7 Tablets).'
    }
  ];

  for (const p of products) {
    await db.query(`
      INSERT INTO calculator_products (id, name, slug, unit_type, moq, min_product_cost, description, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        slug = VALUES(slug),
        unit_type = VALUES(unit_type),
        moq = VALUES(moq),
        min_product_cost = VALUES(min_product_cost),
        description = VALUES(description),
        is_active = 1
    `, [p.id, p.name, p.slug, p.unit_type, p.moq, p.min_product_cost, p.description]);
  }
  console.log('✅ Seeded calculator products.');

  // ── SEEDING PRODUCT OPTIONS ──────────────────────────────────────────────────
  await db.query(`DELETE FROM calculator_product_options_v2`);
  const options = [
    // Product 1 (Resin) Fill Sizes: 10g, 15g, 20g, 30g, 50g
    { product_id: 1, option_type: 'fill_size', label: '10g', numeric_value: 10, unit: 'g', fixed_price: null, is_default: false, sort_order: 1 },
    { product_id: 1, option_type: 'fill_size', label: '15g', numeric_value: 15, unit: 'g', fixed_price: null, is_default: false, sort_order: 2 },
    { product_id: 1, option_type: 'fill_size', label: '20g', numeric_value: 20, unit: 'g', fixed_price: null, is_default: true, sort_order: 3 },
    { product_id: 1, option_type: 'fill_size', label: '30g', numeric_value: 30, unit: 'g', fixed_price: null, is_default: false, sort_order: 4 },
    { product_id: 1, option_type: 'fill_size', label: '50g', numeric_value: 50, unit: 'g', fixed_price: null, is_default: false, sort_order: 5 },

    // Product 2 (Liquid Shilajit) Fill Size: 30ml
    { product_id: 2, option_type: 'fill_size', label: '30ml', numeric_value: 30, unit: 'ml', fixed_price: null, is_default: true, sort_order: 1 },

    // Product 3 (Capsules) Strengths: 200mg (Rs.45), 400mg (Rs.85)
    { product_id: 3, option_type: 'strength', label: '200mg', numeric_value: 200, unit: 'mg', fixed_price: 45.00, is_default: true, sort_order: 1 },
    { product_id: 3, option_type: 'strength', label: '400mg', numeric_value: 400, unit: 'mg', fixed_price: 85.00, is_default: false, sort_order: 2 },
    // Product 3 Bottle Sizes: 30, 60, 90 capsules
    { product_id: 3, option_type: 'bottle_size', label: '30 capsules', numeric_value: 30, unit: 'capsules', fixed_price: null, is_default: false, sort_order: 1 },
    { product_id: 3, option_type: 'bottle_size', label: '60 capsules', numeric_value: 60, unit: 'capsules', fixed_price: null, is_default: true, sort_order: 2 },
    { product_id: 3, option_type: 'bottle_size', label: '90 capsules', numeric_value: 90, unit: 'capsules', fixed_price: null, is_default: false, sort_order: 3 },

    // Product 4 (Tablets) 1 Blister = 7 Tablets (Price: Rs.1,000/blister)
    { product_id: 4, option_type: 'fill_size', label: '7 Tablets per blister', numeric_value: 7, unit: 'tablets', fixed_price: 1000.00, is_default: true, sort_order: 1 }
  ];

  for (const opt of options) {
    await db.query(`
      INSERT INTO calculator_product_options_v2
        (product_id, option_type, label, numeric_value, unit, fixed_price, is_default, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [opt.product_id, opt.option_type, opt.label, opt.numeric_value, opt.unit, opt.fixed_price, opt.is_default ? 1 : 0, opt.sort_order]);
  }
  console.log('✅ Seeded calculator product options.');

  // ── SEEDING PACKAGING ITEMS ──────────────────────────────────────────────────
  const packagingItems = [
    // Resin Jars
    { id: 1, name: '10g Resin Jar', code: 'JAR-10G', type: 'container', moq: 200, unit_price: 120.00, capacity: '10g', dieline_url: '/dielines/jar-10g.pdf' },
    { id: 2, name: '15g Resin Jar', code: 'JAR-15G', type: 'container', moq: 200, unit_price: 120.00, capacity: '15g', dieline_url: '/dielines/jar-15g.pdf' },
    { id: 3, name: '20g Resin Jar', code: 'JAR-20G', type: 'container', moq: 200, unit_price: 130.00, capacity: '20g', dieline_url: '/dielines/jar-20g.pdf' },
    { id: 4, name: '30g Resin Jar', code: 'JAR-30G', type: 'container', moq: 200, unit_price: 160.00, capacity: '30g', dieline_url: '/dielines/jar-30g.pdf' },
    { id: 5, name: '50g Resin Jar', code: 'JAR-50G', type: 'container', moq: 200, unit_price: 165.00, capacity: '50g', dieline_url: '/dielines/jar-50g.pdf' },

    // Liquid Dropper Bottle
    { id: 6, name: '30ml Dropper Bottle', code: 'BOTTLE-DROP-30ML', type: 'container', moq: 200, unit_price: 160.00, capacity: '30ml', dieline_url: '/dielines/dropper-30ml.pdf' },

    // Capsule PET Bottle
    { id: 7, name: 'PET Capsule Bottle', code: 'BOTTLE-PET-CAP', type: 'container', moq: 200, unit_price: 150.00, capacity: '30-90 capsules', dieline_url: '/dielines/pet-bottle.pdf' },

    // Resin Spoons
    { id: 8, name: 'Hook Spoon', code: 'SPOON-HOOK', type: 'spoon', moq: 200, unit_price: 40.00, dieline_url: null },
    { id: 9, name: 'Stick Spoon', code: 'SPOON-STICK', type: 'spoon', moq: 200, unit_price: 80.00, dieline_url: null },
    { id: 10, name: 'Premium Spoon', code: 'SPOON-PREMIUM', type: 'spoon', moq: 200, unit_price: 130.00, dieline_url: null },

    // Labels
    { id: 11, name: 'Resin Labels (Set - Side & Lid)', code: 'LABEL-RESIN-SET', type: 'label', moq: 100, unit_price: null, dieline_url: '/dielines/label-set.pdf' },
    { id: 12, name: 'Resin Labels (Side Only)', code: 'LABEL-RESIN-SIDE', type: 'label', moq: 100, unit_price: null, dieline_url: '/dielines/label-side.pdf' },
    { id: 13, name: 'Resin Labels (Lid Only)', code: 'LABEL-RESIN-LID', type: 'label', moq: 100, unit_price: null, dieline_url: '/dielines/label-lid.pdf' },
    { id: 14, name: 'Dropper Bottle Labels', code: 'LABEL-BOTTLE-30ML', type: 'label', moq: 100, unit_price: null, dieline_url: '/dielines/label-dropper.pdf' },

    // Brochures
    { id: 15, name: 'Product Brochure', code: 'BROCHURE-STD', type: 'brochure', moq: 200, unit_price: null, dieline_url: '/dielines/brochure.pdf' },

    // External Packaging
    { id: 16, name: 'Resin Tube', code: 'BOX-TUBE-RESIN', type: 'outer_box', moq: 200, unit_price: null, dieline_url: '/dielines/resin-tube.pdf' },
    { id: 17, name: 'Bleach Card Box', code: 'BOX-BLEACH-CARD', type: 'outer_box', moq: 200, unit_price: null, dieline_url: '/dielines/bleach-card-box.pdf' },
    { id: 18, name: 'Resin Rigid Box', code: 'BOX-RIGID-RESIN', type: 'outer_box', moq: 100, unit_price: null, dieline_url: '/dielines/rigid-box.pdf' }
  ];

  for (const pkg of packagingItems) {
    await db.query(`
      INSERT INTO calculator_packaging_items
        (id, name, code, type, moq, unit_price, capacity, dieline_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        code = VALUES(code),
        type = VALUES(type),
        moq = VALUES(moq),
        unit_price = VALUES(unit_price),
        capacity = VALUES(capacity),
        dieline_url = VALUES(dieline_url),
        is_active = 1
    `, [pkg.id, pkg.name, pkg.code, pkg.type, pkg.moq, pkg.unit_price, pkg.capacity || null, pkg.dieline_url || null]);
  }
  console.log('✅ Seeded calculator packaging items.');

  // ── SEEDING PRICING TIERS ──────────────────────────────────────────────────
  await db.query(`DELETE FROM calculator_pricing_tiers`);

  const tiers = [
    // 1. Product 1 (Gold Grade Shilajit Resin):
    // 1kg–<5kg: Rs.75/g (1000 to 4999.99)
    // 5kg–<10kg: Rs.70/g (5000 to 9999.99)
    // 10kg–<20kg: Rs.65/g (10000 to 19999.99)
    // 20kg–<100kg: Rs.60/g (20000 to 99999.99)
    // 100kg–500kg: Rs.58/g (100000 to 500000)
    // Capped at 500kg
    { entity_type: 'product', entity_id: 1, min_quantity: 1000, max_quantity: 4999.99, rate: 75.00, is_open_ended: 0 },
    { entity_type: 'product', entity_id: 1, min_quantity: 5000, max_quantity: 9999.99, rate: 70.00, is_open_ended: 0 },
    { entity_type: 'product', entity_id: 1, min_quantity: 10000, max_quantity: 19999.99, rate: 65.00, is_open_ended: 0 },
    { entity_type: 'product', entity_id: 1, min_quantity: 20000, max_quantity: 99999.99, rate: 60.00, is_open_ended: 0 },
    { entity_type: 'product', entity_id: 1, min_quantity: 100000, max_quantity: 500000.00, rate: 58.00, is_open_ended: 0 },

    // 2. Product 2 (Liquid Shilajit 30ml):
    // Below 5L (<5,000ml): Rs.70/ml
    // 5L–<30L (5,000 to 29,999.99ml): Rs.65/ml
    // 30L–100L (30,000 to 100,000ml): Rs.60/ml
    { entity_type: 'product', entity_id: 2, min_quantity: 1, max_quantity: 4999.99, rate: 70.00, is_open_ended: 0 },
    { entity_type: 'product', entity_id: 2, min_quantity: 5000, max_quantity: 29999.99, rate: 65.00, is_open_ended: 0 },
    { entity_type: 'product', entity_id: 2, min_quantity: 30000, max_quantity: 100000.00, rate: 60.00, is_open_ended: 0 },

    // 3. Packaging: Resin Labels Set (id 11)
    // 100–500: Rs.22
    // Above 500: Rs.15 (Open-ended for >500)
    { entity_type: 'packaging', entity_id: 11, min_quantity: 100, max_quantity: 500, rate: 22.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 11, min_quantity: 501, max_quantity: null, rate: 15.00, is_open_ended: 1 },

    // 4. Packaging: Resin Labels Side (id 12)
    // 100–500: Rs.15
    // Above 500: Rs.10
    { entity_type: 'packaging', entity_id: 12, min_quantity: 100, max_quantity: 500, rate: 15.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 12, min_quantity: 501, max_quantity: null, rate: 10.00, is_open_ended: 1 },

    // 5. Packaging: Resin Labels Lid (id 13)
    // 100–500: Rs.7
    // Above 500: Rs.5
    { entity_type: 'packaging', entity_id: 13, min_quantity: 100, max_quantity: 500, rate: 7.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 13, min_quantity: 501, max_quantity: null, rate: 5.00, is_open_ended: 1 },

    // 6. Packaging: Dropper Bottle Labels (id 14)
    { entity_type: 'packaging', entity_id: 14, min_quantity: 100, max_quantity: 500, rate: 22.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 14, min_quantity: 501, max_quantity: null, rate: 15.00, is_open_ended: 1 },

    // 7. Packaging: Resin Brochures (id 15)
    // 200–500: Rs.15
    // 501–1,000: Rs.13
    // 1,001–5,000: Rs.10
    // 5,001–10,000: Rs.7
    // Above 10,000: capped (requires custom quote unless marked open-ended, per doc rules 32-37)
    { entity_type: 'packaging', entity_id: 15, min_quantity: 200, max_quantity: 500, rate: 15.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 15, min_quantity: 501, max_quantity: 1000, rate: 13.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 15, min_quantity: 1001, max_quantity: 5000, rate: 10.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 15, min_quantity: 5001, max_quantity: 10000, rate: 7.00, is_open_ended: 0 },

    // 8. Packaging: Resin Tubes (id 16)
    // 200–400: Rs.310
    // 500–700: Rs.250
    // 800–2,000*: Rs.210
    // Note: Gaps (401-499, 701-799, >2000) are not in tiers, so require custom quotation per doc rules
    { entity_type: 'packaging', entity_id: 16, min_quantity: 200, max_quantity: 400, rate: 310.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 16, min_quantity: 500, max_quantity: 700, rate: 250.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 16, min_quantity: 800, max_quantity: 2000, rate: 210.00, is_open_ended: 0 },

    // 9. Packaging: Bleach Card Box (id 17)
    // 200–499: Rs.60
    // 500–1,000: Rs.40
    // 1,001–5,000: Rs.30
    // 5,001–10,000: Rs.22
    // Capped at 10,000
    { entity_type: 'packaging', entity_id: 17, min_quantity: 200, max_quantity: 499, rate: 60.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 17, min_quantity: 500, max_quantity: 1000, rate: 40.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 17, min_quantity: 1001, max_quantity: 5000, rate: 30.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 17, min_quantity: 5001, max_quantity: 10000, rate: 22.00, is_open_ended: 0 },

    // 10. Packaging: Resin Rigid Box (id 18)
    // 100–300: Rs.350
    // 301–499: Rs.300
    // 500–999: Rs.250
    // 1,000–2,999: Rs.200
    // 3,000–5,000: Rs.160
    // Capped at 5,000
    { entity_type: 'packaging', entity_id: 18, min_quantity: 100, max_quantity: 300, rate: 350.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 18, min_quantity: 301, max_quantity: 499, rate: 300.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 18, min_quantity: 500, max_quantity: 999, rate: 250.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 18, min_quantity: 1000, max_quantity: 2999, rate: 200.00, is_open_ended: 0 },
    { entity_type: 'packaging', entity_id: 18, min_quantity: 3000, max_quantity: 5000, rate: 160.00, is_open_ended: 0 }
  ];

  for (const t of tiers) {
    await db.query(`
      INSERT INTO calculator_pricing_tiers
        (entity_type, entity_id, min_quantity, max_quantity, rate, is_open_ended, is_active, pricing_version)
      VALUES (?, ?, ?, ?, ?, ?, 1, 1)
    `, [t.entity_type, t.entity_id, t.min_quantity, t.max_quantity, t.rate, t.is_open_ended]);
  }
  console.log('✅ Seeded calculator pricing tiers.');

  // ── SEEDING PRODUCT PACKAGING RULES (COMPATIBILITY & ALTERNATIVES) ───────────
  await db.query(`DELETE FROM calculator_product_packaging_rules`);

  const rules = [
    // Product 1 (Resin):
    // Required: Jar (matched to fill size), Label, Brochure, Spoon
    // Alternative group 'spoon': Hook Spoon (8), Stick Spoon (9), Premium Spoon (10)
    // Alternative group 'label': Set (11), Side (12), Lid (13)
    // Alternative group 'outer_packaging' (Choose exactly ONE): Tube (16), Bleach Card Box (17), Rigid Box (18)
    // Jar items 1..5 are matched to fill sizes
    { product_id: 1, packaging_id: 1, component_type: 'required', alternative_group: 'container', suggested_qty_rule: 'per_finished_unit', is_default: 0 },
    { product_id: 1, packaging_id: 2, component_type: 'required', alternative_group: 'container', suggested_qty_rule: 'per_finished_unit', is_default: 0 },
    { product_id: 1, packaging_id: 3, component_type: 'required', alternative_group: 'container', suggested_qty_rule: 'per_finished_unit', is_default: 1 },
    { product_id: 1, packaging_id: 4, component_type: 'required', alternative_group: 'container', suggested_qty_rule: 'per_finished_unit', is_default: 0 },
    { product_id: 1, packaging_id: 5, component_type: 'required', alternative_group: 'container', suggested_qty_rule: 'per_finished_unit', is_default: 0 },

    // Spoons for Resin
    { product_id: 1, packaging_id: 8, component_type: 'alternative', alternative_group: 'spoon', suggested_qty_rule: 'per_finished_unit', is_default: 1 },
    { product_id: 1, packaging_id: 9, component_type: 'alternative', alternative_group: 'spoon', suggested_qty_rule: 'per_finished_unit', is_default: 0 },
    { product_id: 1, packaging_id: 10, component_type: 'alternative', alternative_group: 'spoon', suggested_qty_rule: 'per_finished_unit', is_default: 0 },

    // Labels for Resin
    { product_id: 1, packaging_id: 11, component_type: 'alternative', alternative_group: 'label', suggested_qty_rule: 'per_finished_unit', is_default: 1 },
    { product_id: 1, packaging_id: 12, component_type: 'alternative', alternative_group: 'label', suggested_qty_rule: 'per_finished_unit', is_default: 0 },
    { product_id: 1, packaging_id: 13, component_type: 'alternative', alternative_group: 'label', suggested_qty_rule: 'per_finished_unit', is_default: 0 },

    // Brochure for Resin
    { product_id: 1, packaging_id: 15, component_type: 'required', alternative_group: null, suggested_qty_rule: 'per_finished_unit', is_default: 1 },

    // Outer packaging for Resin (Choose exactly ONE: Tube, Bleach Card Box, Rigid Box)
    { product_id: 1, packaging_id: 16, component_type: 'alternative', alternative_group: 'outer_packaging', suggested_qty_rule: 'per_finished_unit', is_default: 0 },
    { product_id: 1, packaging_id: 17, component_type: 'alternative', alternative_group: 'outer_packaging', suggested_qty_rule: 'per_finished_unit', is_default: 1 },
    { product_id: 1, packaging_id: 18, component_type: 'alternative', alternative_group: 'outer_packaging', suggested_qty_rule: 'per_finished_unit', is_default: 0 },

    // Product 2 (Liquid Shilajit 30ml):
    // Required: 30ml Dropper Bottle (6), Brochure (15), Labels (14)
    // Choose exactly ONE: Bleach Card Box (17) or Tube (16). No spoon!
    { product_id: 2, packaging_id: 6, component_type: 'required', alternative_group: 'container', suggested_qty_rule: 'per_finished_unit', is_default: 1 },
    { product_id: 2, packaging_id: 14, component_type: 'required', alternative_group: 'label', suggested_qty_rule: 'per_finished_unit', is_default: 1 },
    { product_id: 2, packaging_id: 15, component_type: 'required', alternative_group: null, suggested_qty_rule: 'per_finished_unit', is_default: 1 },
    { product_id: 2, packaging_id: 17, component_type: 'alternative', alternative_group: 'outer_packaging', suggested_qty_rule: 'per_finished_unit', is_default: 1 },
    { product_id: 2, packaging_id: 16, component_type: 'alternative', alternative_group: 'outer_packaging', suggested_qty_rule: 'per_finished_unit', is_default: 0 },

    // Product 3 (Capsules):
    // Required: PET Bottle (7), Brochure (15)
    // Choose exactly ONE: Bleach Card Box (17) or Tube (16)
    { product_id: 3, packaging_id: 7, component_type: 'required', alternative_group: 'container', suggested_qty_rule: 'per_bottle', is_default: 1 },
    { product_id: 3, packaging_id: 15, component_type: 'required', alternative_group: null, suggested_qty_rule: 'per_bottle', is_default: 1 },
    { product_id: 3, packaging_id: 17, component_type: 'alternative', alternative_group: 'outer_packaging', suggested_qty_rule: 'per_bottle', is_default: 1 },
    { product_id: 3, packaging_id: 16, component_type: 'alternative', alternative_group: 'outer_packaging', suggested_qty_rule: 'per_bottle', is_default: 0 },

    // Product 4 (Tablets):
    // Tablets in Blister + Bleach Card Box (17) as external packaging
    { product_id: 4, packaging_id: 17, component_type: 'required', alternative_group: 'outer_packaging', suggested_qty_rule: 'per_blister', is_default: 1 }
  ];

  for (const r of rules) {
    await db.query(`
      INSERT INTO calculator_product_packaging_rules
        (product_id, packaging_id, component_type, alternative_group, suggested_qty_rule, is_default, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [r.product_id, r.packaging_id, r.component_type, r.alternative_group, r.suggested_qty_rule, r.is_default]);
  }
  console.log('✅ Seeded product packaging compatibility rules.');

  console.log('🎉 Migration & Seed finished successfully!');
}

module.exports = migrate;

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Migration failed:', err);
      process.exit(1);
    });
}
