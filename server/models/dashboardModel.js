const db = require('../config/db');

class DashboardModel {
  static async getDashboardMetrics() {
    // 1. Total Revenue & Total Orders
    const [orderStats] = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(grand_total), 0) as total_revenue
      FROM orders
      WHERE order_status != 'cancelled'
    `);

    // 2. Total Customers
    const [userStats] = await db.query(`
      SELECT COUNT(*) as total_customers FROM users WHERE role = 'customer' OR role IS NULL
    `);

    // 3. Total Products & Stock
    const [stockStats] = await db.query(`
      SELECT 
        COUNT(p.id) as total_products,
        COALESCE(SUM(i.stock_quantity), 0) as total_stock
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
    `);

    // 4. Order Status Breakdown
    const [statusRows] = await db.query(`
      SELECT order_status, COUNT(*) as count 
      FROM orders 
      GROUP BY order_status
    `);

    const statusCounts = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    statusRows.forEach(row => {
      const s = (row.order_status || '').toLowerCase();
      if (statusCounts[s] !== undefined) {
        statusCounts[s] = Number(row.count);
      } else {
        statusCounts.pending += Number(row.count);
      }
    });

    // 5. Recent 5 Orders
    const [recentOrdersRows] = await db.query(`
      SELECT id, order_number, CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) as customer, email, grand_total as total, order_status as status, created_at as date
      FROM orders
      ORDER BY id DESC
      LIMIT 5
    `);

    // 6. Recent 5 Customers (using createdAt column for users table)
    const [recentCustomersRows] = await db.query(`
      SELECT id, COALESCE(name, CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))) as name, email, role, createdAt as joined_date
      FROM users
      ORDER BY id DESC
      LIMIT 5
    `);

    // 7. Top Locations (Grouped by City from orders)
    const [locationRows] = await db.query(`
      SELECT city as name, COUNT(*) as ordersCount, COALESCE(SUM(grand_total), 0) as totalSales
      FROM orders
      WHERE city IS NOT NULL AND city != ''
      GROUP BY city
      ORDER BY ordersCount DESC
      LIMIT 5
    `);

    // 8. Stock Overview (Products & inventory stock)
    const [stockOverviewRows] = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        p.sku, 
        c.name as category, 
        COALESCE(i.stock_quantity, 0) as stock, 
        COALESCE(i.reorder_level, 10) as minStock,
        p.price
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      ORDER BY stock ASC
      LIMIT 5
    `);

    // 9. Sales Overview Trend (Daily or Monthly)
    const [salesTrendRows] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%b %d') as date,
        COALESCE(SUM(grand_total), 0) as sales,
        COUNT(*) as orders
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at), DATE_FORMAT(created_at, '%b %d')
      ORDER BY DATE(created_at) ASC
      LIMIT 7
    `);

    return {
      revenue: Number(orderStats[0]?.total_revenue || 0),
      totalOrders: Number(orderStats[0]?.total_orders || 0),
      totalCustomers: Number(userStats[0]?.total_customers || 0),
      totalProducts: Number(stockStats[0]?.total_products || 0),
      totalStock: Number(stockStats[0]?.total_stock || 0),
      statusCounts,
      recentOrders: recentOrdersRows,
      recentCustomers: recentCustomersRows,
      topLocations: locationRows,
      stockOverview: stockOverviewRows,
      salesTrend: salesTrendRows
    };
  }
}

module.exports = DashboardModel;
