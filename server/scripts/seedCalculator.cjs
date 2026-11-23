/**
 * Seeds the private-label Cost Calculator so /calculator returns real figures.
 *
 * Creates (only if missing — safe to run repeatedly):
 *   - a "Resin" category
 *   - the 3 calculator products (ids 1-3, matching the storefront dropdown order)
 *   - calculator_packaging rows (ids 1-4, matching the packaging dropdown)
 *   - calculator_product_options rows (product x package type x fill size)
 *
 * Usage (from the server folder):  node scripts/seedCalculator.cjs
 */
require('dotenv').config();
const db = require('../config/db');

const CATEGORY = { name: 'Resin', slug: 'resin' };

// unitPrice = cost of ONE finished unit (PKR) used by calculator.service.js
const PRODUCTS = [
  { name: 'Gold Grade Shilajit Resin', slug: 'gold-grade-shilajit-resin', sku: 'CALC-GOLD-RESIN', price: 3500, unitPrice: 350 },
  { name: 'Silver Grade Shilajit Resin', slug: 'silver-grade-shilajit-resin', sku: 'CALC-SILVER-RESIN', price: 2500, unitPrice: 250 },
  { name: 'Pure Himalayan Shilajit Resin', slug: 'pure-himalayan-shilajit-resin', sku: 'CALC-PURE-RESIN', price: 4500, unitPrice: 450 },
];

const PACKAGE_TYPES = ['Jar', 'Bottle', 'Pouch'];
const FILL_SIZES = [10, 20, 50, 100];

const PACKAGING = [
  { id: 1, name: 'Resin Jars', packaging_type: 'Jar', price_per_unit: 35 },
  { id: 2, name: 'Glass Bottles', packaging_type: 'Bottle', price_per_unit: 28 },
  { id: 3, name: 'Stand-up Pouches', packaging_type: 'Pouch', price_per_unit: 12 },
  { id: 4, name: 'Gift Boxes', packaging_type: 'Jar', price_per_unit: 60 },
];

(async () => {
  try {
    // 1. Category
    let [catRows] = await db.query('SELECT id FROM categories WHERE slug = ? LIMIT 1', [CATEGORY.slug]);
    if (catRows.length === 0) {
      const [r] = await db.query(
        'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
        [CATEGORY.name, CATEGORY.slug, 'Shilajit resin products']
      );
      catRows = [{ id: r.insertId }];
      console.log(`+ category "${CATEGORY.name}" (id ${r.insertId})`);
    }
    const categoryId = catRows[0].id;

    // 2. Products
    const products = [];
    for (const p of PRODUCTS) {
      let [rows] = await db.query('SELECT id FROM products WHERE slug = ? LIMIT 1', [p.slug]);
      if (rows.length === 0) {
        const [r] = await db.query(
          `INSERT INTO products (category_id, sku, name, slug, price, main_image, vendor, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [categoryId, p.sku, p.name, p.slug, p.price, '/shilajit-surp.png', 'Palses']
        );
        rows = [{ id: r.insertId }];
        console.log(`+ product "${p.name}" (id ${r.insertId})`);
      }
      products.push({ id: rows[0].id, unitPrice: p.unitPrice });
    }

    // 3. Packaging
    for (const pk of PACKAGING) {
      await db.query(
        `INSERT INTO calculator_packaging (id, name, packaging_type, price_per_unit, is_active)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE name = VALUES(name),
                                 packaging_type = VALUES(packaging_type),
                                 price_per_unit = VALUES(price_per_unit)`,
        [pk.id, pk.name, pk.packaging_type, pk.price_per_unit]
      );
      console.log(`~ packaging "${pk.name}" (id ${pk.id})`);
    }

    // 4. Product options (product x package type x fill size)
    let created = 0;
    for (const prod of products) {
      for (const packageType of PACKAGE_TYPES) {
        for (const fill of FILL_SIZES) {
          const [rows] = await db.query(
            `SELECT id FROM calculator_product_options
             WHERE product_id = ? AND package_type = ? AND fill_size = ? AND strength IS NULL
             LIMIT 1`,
            [prod.id, packageType, fill]
          );
          if (rows.length === 0) {
            await db.query(
              `INSERT INTO calculator_product_options
                 (product_id, package_type, fill_size, strength, price_per_unit, is_active)
               VALUES (?, ?, ?, NULL, ?, 1)`,
              [prod.id, packageType, fill, prod.unitPrice]
            );
            created++;
          }
        }
      }
    }
    console.log(`+ ${created} calculator product option rows`);

    console.log('✅ Calculator seed complete.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
})();