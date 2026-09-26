const db = require('../config/db');

// Helper function to save primary and secondary gallery photos for a product
const saveProductGalleryImages = async (connection, productId, mainImage, galleryImages) => {
  const pId = Number(productId);
  if (!pId) return;

  // 1. Delete existing images for this product ID
  try {
    await connection.query(`DELETE FROM product_images WHERE product_id = ?`, [pId]);
  } catch (e) {
    try {
      await connection.query(`DELETE FROM product_images WHERE productId = ?`, [pId]);
    } catch (e2) {}
  }

  // 2. Normalize and collect unique URLs
  const rawUrls = [];
  if (mainImage) rawUrls.push(mainImage);
  if (Array.isArray(galleryImages)) {
    for (const g of galleryImages) {
      const url = typeof g === 'string' ? g : (g?.image_url || g?.url);
      if (url) rawUrls.push(url);
    }
  }

  const uniqueUrls = Array.from(new Set(rawUrls.map((u) => String(u).trim()).filter(Boolean)));
  if (uniqueUrls.length === 0) return;

  // 3. Insert each image into product_images table
  let order = 1;
  for (const imgUrl of uniqueUrls) {
    const isPrimary = order === 1 ? 1 : 0;
    try {
      await connection.query(
        `INSERT INTO product_images (product_id, image_url, display_order, is_primary) VALUES (?, ?, ?, ?)`,
        [pId, imgUrl, order, isPrimary]
      );
    } catch (err) {
      try {
        await connection.query(
          `INSERT INTO product_images (product_id, imageUrl, display_order, is_primary) VALUES (?, ?, ?, ?)`,
          [pId, imgUrl, order, isPrimary]
        );
      } catch (err2) {
        try {
          await connection.query(
            `INSERT INTO product_images (product_id, image_url, imageUrl, display_order, is_primary) VALUES (?, ?, ?, ?, ?)`,
            [pId, imgUrl, imgUrl, order, isPrimary]
          );
        } catch (err3) {
          try {
            await connection.query(
              `INSERT INTO product_images (product_id, productId, image_url, imageUrl, display_order, is_primary) VALUES (?, ?, ?, ?, ?, ?)`,
              [pId, pId, imgUrl, imgUrl, order, isPrimary]
            );
          } catch (err4) {
            console.error(`❌ All image inserts failed for product ${pId}:`, err4.message);
          }
        }
      }
    }
    order++;
  }
};

class ProductModel {
  // Find all products with search, category filtering, inventory status, and gallery images
  static async findAll(filters = {}) {
    const { category, search } = filters;

    try {
      let query = `
        SELECT p.*, 
               COALESCE(c.name, 'Resin') as category_name, 
               COALESCE(c.slug, 'resin') as category_slug,
               pd.short_description, pd.full_description, pd.features_list, pd.tags,
               COALESCE(i.stock_quantity, 50) as stock_quantity, 
               COALESCE(i.availability_status, 'In Stock') as availability_status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_details pd ON p.id = pd.product_id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE 1=1
      `;
      const params = [];

      if (category && category !== 'All') {
        query += ` AND (c.slug = ? OR c.name = ? OR p.category_id = ?)`;
        params.push(category, category, isNaN(Number(category)) ? 0 : Number(category));
      }

      if (search) {
        query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.vendor LIKE ?)`;
        const pattern = `%${search}%`;
        params.push(pattern, pattern, pattern);
      }

      query += ` ORDER BY p.id DESC`;

      const [rows] = await db.query(query, params);

      // Attach gallery images for all fetched products
      if (rows.length > 0) {
        const productIds = rows.map((r) => r.id);
        try {
          let images = [];
          try {
            const [imgs] = await db.query(
              `SELECT product_id, COALESCE(image_url, imageUrl) as image_url, display_order, is_primary FROM product_images WHERE product_id IN (?) ORDER BY display_order ASC`,
              [productIds]
            );
            images = imgs;
          } catch (e) {
            try {
              const [imgs] = await db.query(
                `SELECT productId as product_id, COALESCE(image_url, imageUrl) as image_url, display_order, is_primary FROM product_images WHERE productId IN (?) ORDER BY display_order ASC`,
                [productIds]
              );
              images = imgs;
            } catch (e2) {}
          }

          const imagesByProduct = {};
          for (const img of images) {
            const pId = Number(img.product_id || img.productId);
            if (pId) {
              if (!imagesByProduct[pId]) {
                imagesByProduct[pId] = [];
              }
              imagesByProduct[pId].push(img);
            }
          }

          for (const product of rows) {
            const pNum = Number(product.id);
            const productImgs = imagesByProduct[pNum] || [];
            product.gallery_images = productImgs.length > 0
              ? productImgs
              : (product.main_image ? [{ id: 0, image_url: product.main_image, display_order: 1, is_primary: true }] : []);
          }
        } catch (e) {
          for (const product of rows) {
            product.gallery_images = product.main_image ? [{ id: 0, image_url: product.main_image, display_order: 1, is_primary: true }] : [];
          }
        }
      }

      return rows;
    } catch (error) {
      console.error('❌ Error fetching products in ProductModel.findAll:', error.message);
      try {
        const [simpleRows] = await db.query(`SELECT * FROM products ORDER BY id DESC`);
        return simpleRows;
      } catch (e) {
        return [];
      }
    }
  }

  // Find single product by ID or Slug with complete details and image gallery
  static async findByIdOrSlug(idOrSlug) {
    if (!idOrSlug) return null;
    const isId = !isNaN(Number(idOrSlug));
    const whereClause = isId ? `p.id = ?` : `p.slug = ?`;

    try {
      const [rows] = await db.query(
        `SELECT p.*, 
                COALESCE(c.name, 'Resin') as category_name, 
                COALESCE(c.slug, 'resin') as category_slug,
                pd.short_description, pd.full_description, pd.features_list, 
                pd.weight_options, pd.tags, pd.name_update_notice, 
                pd.usage_instructions, pd.ingredients,
                COALESCE(i.stock_quantity, 50) as stock_quantity, 
                COALESCE(i.availability_status, 'In Stock') as availability_status
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN product_details pd ON p.id = pd.product_id
         LEFT JOIN inventory i ON p.id = i.product_id
         WHERE ${whereClause}`,
        [idOrSlug]
      );

      if (rows.length === 0) return null;

      const product = rows[0];

      // Fetch gallery images
      try {
        let images = [];
        try {
          const [imgs] = await db.query(
            `SELECT id, COALESCE(image_url, imageUrl) as image_url, display_order, is_primary FROM product_images WHERE product_id = ? ORDER BY display_order ASC`,
            [product.id]
          );
          images = imgs;
        } catch (e) {
          try {
            const [imgs] = await db.query(
              `SELECT id, COALESCE(image_url, imageUrl) as image_url, display_order, is_primary FROM product_images WHERE productId = ? ORDER BY display_order ASC`,
              [product.id]
            );
            images = imgs;
          } catch (e2) {}
        }

        product.gallery_images = images.length > 0
          ? images
          : (product.main_image ? [{ id: 0, image_url: product.main_image, display_order: 1, is_primary: true }] : []);
      } catch (e) {
        product.gallery_images = product.main_image ? [{ id: 0, image_url: product.main_image, display_order: 1, is_primary: true }] : [];
      }

      return product;
    } catch (error) {
      console.error('❌ Error fetching product in ProductModel.findByIdOrSlug:', error.message);
      try {
        const [simpleRows] = await db.query(
          `SELECT * FROM products WHERE ${isId ? 'id = ?' : 'slug = ?'}`,
          [idOrSlug]
        );
        return simpleRows[0] || null;
      } catch (e) {
        return null;
      }
    }
  }

  // Create new Product with transaction (inserts products, product_details, product_images, inventory)
  static async create(productData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const {
        category_id = 1,
        sku,
        name,
        slug,
        price,
        old_price = null,
        vendor = 'Himalayan Surp',
        size = 'Medium',
        rating = 5.0,
        main_image,
        gallery_images = [],
        short_description = null,
        full_description = null,
        features_list = null,
        weight_options = null,
        tags = null,
        stock_quantity = 50
      } = productData;

      // 1. Insert Base Product
      const [pRes] = await connection.query(
        `INSERT INTO products (category_id, sku, name, slug, price, old_price, vendor, size, rating, main_image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [category_id, sku, name, slug, price, old_price, vendor, size, rating, main_image]
      );
      const productId = pRes.insertId;

      // 2. Insert Product Details
      try {
        await connection.query(
          `INSERT INTO product_details (product_id, short_description, full_description, features_list, weight_options, tags)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            productId,
            short_description,
            full_description,
            features_list ? (typeof features_list === 'string' ? features_list : JSON.stringify(features_list)) : null,
            weight_options ? (typeof weight_options === 'string' ? weight_options : JSON.stringify(weight_options)) : null,
            tags ? (typeof tags === 'string' ? tags : JSON.stringify(tags)) : null
          ]
        );
      } catch (e) {
        console.error('Notice: product_details insert skipped:', e.message);
      }

      // 3. Save Product Main & Gallery Images
      await saveProductGalleryImages(connection, productId, main_image, gallery_images);

      // 4. Insert Inventory
      try {
        const status = stock_quantity > 0 ? 'In Stock' : 'Out of Stock';
        await connection.query(
          `INSERT INTO inventory (product_id, variantId, stock_quantity, availability_status)
           VALUES (?, ?, ?, ?)`,
          [productId, productId, stock_quantity, status]
        );
      } catch (e) {
        // Non-fatal if inventory row already exists
        console.warn('Inventory insert notice:', e.message);
      }

      await connection.commit();
      return productId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update existing Product
  static async update(id, productData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const allowedFields = ['category_id', 'sku', 'name', 'slug', 'price', 'old_price', 'vendor', 'size', 'rating', 'main_image', 'is_active'];
      const fields = [];
      const values = [];

      for (const key of allowedFields) {
        if (productData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(productData[key]);
        }
      }

      if (fields.length > 0) {
        values.push(id);
        await connection.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
      }

      // Ensure product_details row exists
      try {
        const [existingDetails] = await connection.query(`SELECT product_id FROM product_details WHERE product_id = ?`, [id]);
        if (existingDetails.length === 0) {
          await connection.query(`INSERT INTO product_details (product_id) VALUES (?)`, [id]);
        }
      } catch (e) {}

      // Update Details if provided
      const { short_description, full_description, features_list, tags } = productData;
      if (short_description !== undefined || full_description !== undefined || features_list !== undefined || tags !== undefined) {
        const detailFields = [];
        const detailValues = [];

        if (short_description !== undefined) {
          detailFields.push(`short_description = ?`);
          detailValues.push(short_description);
        }
        if (full_description !== undefined) {
          detailFields.push(`full_description = ?`);
          detailValues.push(full_description);
        }
        if (features_list !== undefined) {
          detailFields.push(`features_list = ?`);
          detailValues.push(typeof features_list === 'string' ? features_list : JSON.stringify(features_list));
        }
        if (tags !== undefined) {
          detailFields.push(`tags = ?`);
          detailValues.push(typeof tags === 'string' ? tags : JSON.stringify(tags));
        }

        if (detailFields.length > 0) {
          detailValues.push(id);
          try {
            await connection.query(
              `UPDATE product_details SET ${detailFields.join(', ')} WHERE product_id = ?`,
              detailValues
            );
          } catch (e) {}
        }
      }

      // Ensure inventory row exists & update
      if (productData.stock_quantity !== undefined) {
        try {
          const qty = Number(productData.stock_quantity);
          const status = qty === 0 ? 'Out of Stock' : (qty < 10 ? 'Low Stock' : 'In Stock');
          const [existingInv] = await connection.query(`SELECT product_id FROM inventory WHERE product_id = ? OR productId = ?`, [id, id]);
          if (existingInv.length === 0) {
            try {
              await connection.query(
                `INSERT INTO inventory (product_id, stock_quantity, availability_status) VALUES (?, ?, ?)`,
                [id, qty, status]
              );
            } catch (e) {
              try {
                await connection.query(
                  `INSERT INTO inventory (productId, stock_quantity, availability_status) VALUES (?, ?, ?)`,
                  [id, qty, status]
                );
              } catch (e2) {}
            }
          } else {
            try {
              await connection.query(
                `UPDATE inventory SET stock_quantity = ?, availability_status = ? WHERE product_id = ? OR productId = ?`,
                [qty, status, id, id]
              );
            } catch (e) {}
          }
        } catch (e) {}
      }

      // Update Product Main & Gallery Images if provided
      if (productData.gallery_images !== undefined || productData.main_image !== undefined) {
        await saveProductGalleryImages(connection, id, productData.main_image, productData.gallery_images);
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Delete Product
  static async delete(id) {
    const [result] = await db.query(`DELETE FROM products WHERE id = ?`, [id]);
    return result;
  }
}

module.exports = ProductModel;
