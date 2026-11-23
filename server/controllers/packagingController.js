const db = require('../config/db');
const { sendSuccess } = require('../utils/responseHandler');

const getPackagingItems = async (req, res, next) => {
  try {
    const [items] = await db.query(
      `SELECT id, name, description, price_pkr, image_url, display_order
       FROM packaging_items WHERE is_active = 1 ORDER BY display_order ASC`
    );
    return sendSuccess(res, items, 'Packaging items retrieved');
  } catch (error) {
    next(error);
  }
};

const getBulkTiers = async (req, res, next) => {
  try {
    const [tiers] = await db.query(
      `SELECT id, min_qty, discount_pct, label
       FROM bulk_order_tiers WHERE is_active = 1 ORDER BY min_qty ASC`
    );
    return sendSuccess(res, tiers, 'Bulk tiers retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = { getPackagingItems, getBulkTiers };
