import { api } from './api';
import { quickActionsData } from '../data/dashboard.data';
import {
  StatItem,
  SalesDataPoint,
  OrderStatusItem,
  TopLocation,
  RecentActivityItem,
  QuickActionItem,
} from '../types';

const getDashboardData = async () => {
  const response = await api.get('/dashboard/stats');
  const data = response.data?.data;
  if (!data) {
    throw new Error('The dashboard API returned an empty response.');
  }
  return data;
};

const statStyles: Record<StatItem['iconName'], { accentColor: string; bgLight: string }> = {
  orders: { accentColor: 'text-emerald-600', bgLight: 'bg-emerald-50' },
  revenue: { accentColor: 'text-sky-600', bgLight: 'bg-sky-50' },
  customers: { accentColor: 'text-indigo-600', bgLight: 'bg-indigo-50' },
  products: { accentColor: 'text-amber-600', bgLight: 'bg-amber-50' },
};

const getStatIcon = (title: string): StatItem['iconName'] => {
  const normalizedTitle = title.toLowerCase();
  if (normalizedTitle.includes('revenue')) return 'revenue';
  if (normalizedTitle.includes('customer')) return 'customers';
  if (normalizedTitle.includes('product') || normalizedTitle.includes('stock')) return 'products';
  return 'orders';
};

export const dashboardApi = {
  getStats: async (): Promise<StatItem[]> => {
    const data = await getDashboardData();
    if (!Array.isArray(data.stats)) {
      throw new Error('The dashboard API did not return statistics.');
    }

    return data.stats.map((stat: Record<string, unknown>) => {
      const title = String(stat.title || 'Store statistic');
      const iconName = getStatIcon(title);
      return {
        id: String(stat.id || title),
        title,
        value: String(stat.value ?? '0'),
        change: String(stat.change ?? '0%'),
        isPositive: stat.changeType !== 'negative',
        comparisonText: String(stat.timeframe || ''),
        iconName,
        ...statStyles[iconName],
      };
    });
  },

  getSalesOverview: async (_range: string = '7d'): Promise<SalesDataPoint[]> => {
    const data = await getDashboardData();
    if (!Array.isArray(data.salesData)) {
      throw new Error('The dashboard API did not return sales data.');
    }
    return data.salesData.map((point: Record<string, unknown>) => ({
      date: String(point.date || ''),
      displayDate: String(point.date || ''),
      revenue: Number(point.sales ?? point.revenue ?? 0),
    }));
  },

  getOrderStatuses: async (): Promise<OrderStatusItem[]> => {
    const data = await getDashboardData();
    if (!Array.isArray(data.orderStatuses)) {
      throw new Error('The dashboard API did not return order statuses.');
    }
    return data.orderStatuses.map((item: Record<string, unknown>) => ({
      status: String(item.status || 'Pending') as OrderStatusItem['status'],
      count: Number(item.count || 0),
      percentage: Number(item.percentage || 0),
      color: String(item.color || '#94a3b8'),
    }));
  },

  getTopLocations: async (): Promise<TopLocation[]> => {
    const data = await getDashboardData();
    if (!Array.isArray(data.topLocations)) {
      throw new Error('The dashboard API did not return location data.');
    }
    const locations = data.topLocations as Array<Record<string, unknown>>;
    const totalOrders = locations.reduce((total, location) => total + Number(location.ordersCount || 0), 0);
    const colors = ['#10B981', '#06B6D4', '#6366F1', '#F59E0B', '#94A3B8'];

    return locations.map((location, index) => {
      const name = String(location.name || 'Unknown');
      const ordersCount = Number(location.ordersCount || 0);
      return {
        id: name,
        country: name,
        percentage: totalOrders ? Math.round((ordersCount / totalOrders) * 100) : 0,
        color: colors[index % colors.length],
      };
    });
  },

  getRecentActivity: async (): Promise<RecentActivityItem[]> => {
    const data = await getDashboardData();
    if (!Array.isArray(data.recentOrders)) {
      throw new Error('The dashboard API did not return recent orders.');
    }
    return data.recentOrders.map((order: Record<string, unknown>) => {
      const customer = String(order.customer || 'Guest Customer');
      const orderId = String(order.order_number || order.id || '');
      return {
        id: String(order.id || orderId),
        type: 'order',
        title: `New order ${orderId}`,
        subtitle: `${customer} · ₨${Number(order.total || 0).toLocaleString()}`,
        time: String(order.date || ''),
      };
    });
  },

  getQuickActions: async (): Promise<QuickActionItem[]> => quickActionsData,
};
