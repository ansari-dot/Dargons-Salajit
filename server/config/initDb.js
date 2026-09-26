const fs = require('fs');
const path = require('path');
const db = require('./db');

const addColumnIfNotExist = async (table, column, definition) => {
  try {
    await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`✨ Added column '${column}' to '${table}' table.`);
  } catch (e) {
    // Ignore error if column already exists
  }
};

const initDb = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sqlScript = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL script into individual CREATE TABLE statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      await db.query(statement);
    }

    // Auto-migrate columns if tables existed from an earlier schema version
    await addColumnIfNotExist('products', 'category_id', 'INT DEFAULT 1');
    await addColumnIfNotExist('products', 'sku', "VARCHAR(100) DEFAULT 'SKU-001'");
    await addColumnIfNotExist('products', 'name', "VARCHAR(255) NOT NULL DEFAULT 'Product'");
    await addColumnIfNotExist('products', 'slug', "VARCHAR(255) NOT NULL DEFAULT 'product'");
    await addColumnIfNotExist('products', 'price', 'DECIMAL(10,2) NOT NULL DEFAULT 0.00');
    await addColumnIfNotExist('products', 'old_price', 'DECIMAL(10,2) NULL');
    await addColumnIfNotExist('products', 'vendor', "VARCHAR(100) DEFAULT 'Himalayan Surp'");
    await addColumnIfNotExist('products', 'size', "VARCHAR(50) DEFAULT 'Medium'");
    await addColumnIfNotExist('products', 'rating', 'DECIMAL(3,2) DEFAULT 5.00');
    await addColumnIfNotExist('products', 'main_image', 'TEXT NULL');
    await addColumnIfNotExist('products', 'is_active', 'BOOLEAN DEFAULT TRUE');

    await addColumnIfNotExist('product_details', 'product_id', 'INT NULL');
    await addColumnIfNotExist('product_details', 'productId', 'INT NULL');
    try { await db.query(`UPDATE product_details SET product_id = productId WHERE product_id IS NULL AND productId IS NOT NULL`); } catch (e) { }
    try { await db.query(`UPDATE product_details SET productId = product_id WHERE productId IS NULL AND product_id IS NOT NULL`); } catch (e) { }

    await addColumnIfNotExist('product_details', 'short_description', 'TEXT NULL');
    await addColumnIfNotExist('product_details', 'full_description', 'LONGTEXT NULL');
    await addColumnIfNotExist('product_details', 'features_list', 'JSON NULL');
    await addColumnIfNotExist('product_details', 'weight_options', 'JSON NULL');
    await addColumnIfNotExist('product_details', 'tags', 'JSON NULL');
    await addColumnIfNotExist('product_details', 'name_update_notice', 'TEXT NULL');
    await addColumnIfNotExist('product_details', 'usage_instructions', 'TEXT NULL');
    await addColumnIfNotExist('product_details', 'ingredients', 'TEXT NULL');
    await addColumnIfNotExist('product_details', 'meta_title', 'VARCHAR(255) NULL');
    await addColumnIfNotExist('product_details', 'meta_description', 'VARCHAR(500) NULL');

    await addColumnIfNotExist('inventory', 'product_id', 'INT NULL');
    await addColumnIfNotExist('inventory', 'productId', 'INT NULL');
    try { await db.query(`UPDATE inventory SET product_id = productId WHERE product_id IS NULL AND productId IS NOT NULL`); } catch (e) { }
    try { await db.query(`UPDATE inventory SET productId = product_id WHERE productId IS NULL AND product_id IS NOT NULL`); } catch (e) { }

    await addColumnIfNotExist('inventory', 'stock_quantity', 'INT DEFAULT 50');
    await addColumnIfNotExist('inventory', 'reserved_quantity', 'INT DEFAULT 0');
    await addColumnIfNotExist('inventory', 'reorder_level', 'INT DEFAULT 10');
    await addColumnIfNotExist('inventory', 'availability_status', "VARCHAR(50) DEFAULT 'In Stock'");

    await addColumnIfNotExist('orders', 'payment_status', "ENUM('unpaid', 'paid', 'refunded', 'failed') DEFAULT 'unpaid'");
    await addColumnIfNotExist('orders', 'tracker_token',   'VARCHAR(255) NULL');
    await addColumnIfNotExist('orders', 'safepay_tracker', 'VARCHAR(255) NULL');

    // Safepay payment audit log table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS payment_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          provider VARCHAR(30) NOT NULL DEFAULT 'safepay',
          tracker VARCHAR(255) NOT NULL,
          event_type VARCHAR(100) NULL,
          amount DECIMAL(12,2) NOT NULL,
          currency VARCHAR(3) NOT NULL DEFAULT 'PKR',
          status VARCHAR(30) NOT NULL DEFAULT 'pending',
          event_id VARCHAR(255) NULL,
          raw_response JSON NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_pt_order (order_id),
          INDEX idx_pt_tracker (tracker)
        )
      `);
    } catch (e) { /* table already exists */ }

    // Deals of the Day table
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS deals (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          subtitle TEXT NULL,
          product_id INT NULL,
          original_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          deal_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          discount_percentage INT DEFAULT 0,
          banner_image VARCHAR(500) NULL,
          start_time DATETIME NULL,
          end_time DATETIME NULL,
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Seed default deal if table is empty
      const [existingDeals] = await db.query('SELECT COUNT(*) as count FROM deals');
      if (existingDeals[0].count === 0) {
        const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
        await db.query(`
          INSERT INTO deals (title, subtitle, product_id, original_price, deal_price, discount_percentage, banner_image, end_time, is_active)
          VALUES 
          ('Pure Organic Himalayan Shilajit Resin 50g', 'Limited Time Flash Offer - Extra 25% Off', 1, 3500.00, 2500.00, 28, '/shilajit-surp.png', ?, 1),
          ('Gold Grade Himalayan Shilajit Liquid Drops', 'Special Wellness Deal - Boost Energy & Stamina', 1, 4200.00, 3150.00, 25, '/popular_gold_jar.png', ?, 1)
        `, [futureDate, futureDate]);
        console.log('✨ Seeded default Deals of the Day.');
      }
    } catch (dErr) {
      console.warn('Deals table init warning:', dErr.message);
    }

    await addColumnIfNotExist('product_images', 'image_url', 'TEXT NULL');
    await addColumnIfNotExist('product_images', 'imageUrl', 'TEXT NULL');
    try { await db.query(`UPDATE product_images SET image_url = imageUrl WHERE image_url IS NULL AND imageUrl IS NOT NULL`); } catch (e) { }
    try { await db.query(`UPDATE product_images SET imageUrl = image_url WHERE imageUrl IS NULL AND image_url IS NOT NULL`); } catch (e) { }

    // Auto-fix createdAt, updatedAt, and legacy camelCase column defaults across all database tables
    const allTables = ['products', 'product_images', 'product_details', 'inventory', 'categories', 'blogs', 'users', 'orders', 'order_items', 'coupons', 'coupon_usages', 'gallery', 'cart_items', 'wishlist'];
    for (const t of allTables) {
      try { await db.query(`ALTER TABLE ${t} MODIFY COLUMN createdAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP`); } catch (e) { }
      try { await db.query(`ALTER TABLE ${t} MODIFY COLUMN updatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`); } catch (e) { }
      try { await db.query(`ALTER TABLE ${t} MODIFY COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP`); } catch (e) { }
      try { await db.query(`ALTER TABLE ${t} MODIFY COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`); } catch (e) { }
    }

    const legacyCols = [
      { table: 'product_images', col: 'imageUrl', type: 'TEXT NULL DEFAULT NULL' },
      { table: 'product_images', col: 'image_url', type: 'TEXT NULL DEFAULT NULL' },
      { table: 'product_images', col: 'productId', type: 'INT NULL DEFAULT NULL' },
      { table: 'product_images', col: 'displayOrder', type: 'INT NULL DEFAULT 0' },
      { table: 'product_images', col: 'isPrimary', type: 'BOOLEAN NULL DEFAULT FALSE' },
      { table: 'product_details', col: 'productId', type: 'INT NULL DEFAULT NULL' },
      { table: 'inventory', col: 'productId', type: 'INT NULL DEFAULT NULL' },
      { table: 'products', col: 'categoryId', type: 'INT NULL DEFAULT 1' },
    ];
    for (const item of legacyCols) {
      try { await db.query(`ALTER TABLE ${item.table} MODIFY COLUMN ${item.col} ${item.type}`); } catch (e) { }
    }

    await addColumnIfNotExist('product_images', 'display_order', 'INT DEFAULT 0');
    await addColumnIfNotExist('product_images', 'is_primary', 'BOOLEAN DEFAULT FALSE');

    // Users table column compatibility
    await addColumnIfNotExist('users', 'first_name', 'VARCHAR(255) NULL');
    await addColumnIfNotExist('users', 'last_name', 'VARCHAR(255) NULL');
    await addColumnIfNotExist('users', 'street_address', 'VARCHAR(255) NULL');
    await addColumnIfNotExist('users', 'postal_code', 'VARCHAR(255) NULL');
    await addColumnIfNotExist('users', 'firstName', 'VARCHAR(255) NULL');
    await addColumnIfNotExist('users', 'lastName', 'VARCHAR(255) NULL');
    await addColumnIfNotExist('users', 'streetAddress', 'VARCHAR(255) NULL');
    await addColumnIfNotExist('users', 'postcode', 'VARCHAR(255) NULL');
    await addColumnIfNotExist('users', 'refresh_token', 'TEXT NULL');
    try { await db.query(`UPDATE users SET first_name = COALESCE(first_name, firstName)`); } catch (e) { }
    try { await db.query(`UPDATE users SET firstName = COALESCE(firstName, first_name)`); } catch (e) { }
    try { await db.query(`UPDATE users SET last_name = COALESCE(last_name, lastName)`); } catch (e) { }
    try { await db.query(`UPDATE users SET lastName = COALESCE(lastName, last_name)`); } catch (e) { }
    try { await db.query(`UPDATE users SET street_address = COALESCE(street_address, streetAddress)`); } catch (e) { }
    try { await db.query(`UPDATE users SET streetAddress = COALESCE(streetAddress, street_address)`); } catch (e) { }
    try { await db.query(`UPDATE users SET postal_code = COALESCE(postal_code, postcode)`); } catch (e) { }
    try { await db.query(`UPDATE users SET postcode = COALESCE(postcode, postal_code)`); } catch (e) { }

    console.log('✅ Database tables & schema migrations initialized successfully.');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
  }
};

module.exports = initDb;
