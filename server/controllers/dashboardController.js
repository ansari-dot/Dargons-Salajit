const DashboardModel = require('../models/dashboardModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const getDashboardStats = async (req, res) => {
  try {
    const rawMetrics = await DashboardModel.getDashboardMetrics();

    // 1. Format Stat Cards
    const stats = [
      {
        id: 'stat-revenue',
        title: 'Total Revenue',
        value: `₨ ${rawMetrics.revenue.toLocaleString()}`,
        change: '+14.2%',
        changeType: 'positive',
        timeframe: 'vs last month',
        icon: 'DollarSign',
      },
      {
        id: 'stat-orders',
        title: 'Total Orders',
        value: rawMetrics.totalOrders.toString(),
        change: '+9.5%',
        changeType: 'positive',
        timeframe: 'vs last month',
        icon: 'ShoppingBag',
      },
      {
        id: 'stat-customers',
        title: 'Total Customers',
        value: rawMetrics.totalCustomers.toString(),
        change: '+6.1%',
        changeType: 'positive',
        timeframe: 'vs last month',
        icon: 'Users',
      },
      {
        id: 'stat-stock',
        title: 'Products in Stock',
        value: rawMetrics.totalStock.toString(),
        change: '0.0%',
        changeType: 'neutral',
        timeframe: 'live inventory',
        icon: 'Package',
      },
    ];

    // 2. Format Sales Trend (Fallback to past 7 days defaults if empty)
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const salesData = rawMetrics.salesTrend.length > 0
      ? rawMetrics.salesTrend.map(row => ({
          date: row.date,
          sales: Number(row.sales),
          orders: Number(row.orders)
        }))
      : daysOfWeek.map(day => ({ date: day, sales: 0, orders: 0 }));

    // 3. Format Order Status Chart Data
    const orderStatuses = [
      { status: 'Pending', count: rawMetrics.statusCounts.pending, color: '#f59e0b', percentage: 0 },
      { status: 'Processing', count: rawMetrics.statusCounts.processing, color: '#3b82f6', percentage: 0 },
      { status: 'Shipped', count: rawMetrics.statusCounts.shipped, color: '#8b5cf6', percentage: 0 },
      { status: 'Delivered', count: rawMetrics.statusCounts.delivered, color: '#10b981', percentage: 0 },
      { status: 'Cancelled', count: rawMetrics.statusCounts.cancelled, color: '#ef4444', percentage: 0 },
    ];

    const totalStatusOrders = orderStatuses.reduce((acc, curr) => acc + curr.count, 0);
    orderStatuses.forEach(item => {
      item.percentage = totalStatusOrders > 0 ? Math.round((item.count / totalStatusOrders) * 100) : 0;
    });

    // 4. Format Recent Orders
    const recentOrders = rawMetrics.recentOrders.map(ord => ({
      id: ord.order_number || `#ORD-${ord.id}`,
      customer: ord.customer || 'Guest Customer',
      email: ord.email || 'customer@salajit.com',
      date: ord.date ? new Date(ord.date).toLocaleDateString() : 'Today',
      total: Number(ord.total),
      status: ord.status || 'pending'
    }));

    // 5. Format Recent Customers
    const recentCustomers = rawMetrics.recentCustomers.map(cust => ({
      id: String(cust.id),
      name: cust.name || 'Anonymous User',
      email: cust.email || '',
      role: cust.role || 'Customer',
      joinedDate: cust.joined_date ? new Date(cust.joined_date).toLocaleDateString() : 'Recently'
    }));

    // 6. Format Top Locations
    const topLocations = rawMetrics.topLocations;

    // 7. Format Stock Overview
    const stockItems = rawMetrics.stockOverview.map(st => ({
      id: String(st.id),
      name: st.name,
      sku: st.sku || `SKU-${st.id}`,
      category: st.category || 'General',
      stock: Number(st.stock),
      minStock: Number(st.minStock),
      status: Number(st.stock) <= 5 ? 'out_of_stock' : Number(st.stock) <= 15 ? 'low_stock' : 'in_stock'
    }));

    const responsePayload = {
      stats,
      salesData,
      orderStatuses,
      totalOrdersCount: totalStatusOrders,
      recentOrders,
      recentCustomers,
      topLocations,
      topProducts: rawMetrics.topProducts.map(product => ({
        id: String(product.id),
        name: product.name,
        sold: Number(product.sold),
        revenue: Number(product.revenue),
        image: product.main_image || '',
        category: product.category || 'General'
      })),
      stockItems,
      rawMetrics
    };

    return sendSuccess(res, responsePayload, 'Dashboard metrics retrieved successfully');
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return sendError(res, error.message || 'Failed to retrieve dashboard metrics', 500);
  }
};

module.exports = {
  getDashboardStats,
};
