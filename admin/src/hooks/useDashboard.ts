import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../services/dashboard.api';
import { ordersApi } from '../services/orders.api';
import { productsApi } from '../services/products.api';
import { customersApi } from '../services/customers.api';
import {
  StatItem,
  SalesDataPoint,
  OrderStatusItem,
  TopProduct,
  Order,
  Customer,
  InventoryItem,
  TopLocation,
  RecentActivityItem,
  QuickActionItem,
} from '../types';

export function useDashboard() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatusItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [stockItems, setStockItems] = useState<InventoryItem[]>([]);
  const [topLocations, setTopLocations] = useState<TopLocation[]>([]);
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [quickActions, setQuickActions] = useState<QuickActionItem[]>([]);
  const [timeRange, setTimeRange] = useState<string>('Last 7 days');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        statsRes,
        salesRes,
        statusRes,
        topProdRes,
        ordersRes,
        customersRes,
        stockRes,
        locationsRes,
        activityRes,
        actionsRes,
      ] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getSalesOverview(timeRange),
        dashboardApi.getOrderStatuses(),
        productsApi.getTopSelling(),
        ordersApi.getOrders(),
        customersApi.getCustomers(),
        productsApi.getStockOverview(),
        dashboardApi.getTopLocations(),
        dashboardApi.getRecentActivity(),
        dashboardApi.getQuickActions(),
      ]);

      setStats(statsRes);
      setSalesData(salesRes);
      setOrderStatuses(statusRes);
      setTopProducts(topProdRes);
      setRecentOrders(ordersRes.slice(0, 5));
      setRecentCustomers(customersRes.slice(0, 5));
      setStockItems(stockRes.slice(0, 5));
      setTopLocations(locationsRes);
      setActivities(activityRes);
      setQuickActions(actionsRes);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    salesData,
    orderStatuses,
    topProducts,
    recentOrders,
    recentCustomers,
    stockItems,
    topLocations,
    activities,
    quickActions,
    timeRange,
    setTimeRange,
    searchQuery,
    setSearchQuery,
    isLoading,
    error,
    refresh: fetchDashboardData,
  };
}
