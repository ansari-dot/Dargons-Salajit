import { api } from './api';
import { statsData, salesOverviewData, orderStatusData, topLocationsData, recentActivityData, quickActionsData } from '../data/dashboard.data';
import { StatItem, SalesDataPoint, OrderStatusItem, TopLocation, RecentActivityItem, QuickActionItem } from '../types';

export const dashboardApi = {
  getStats: async (): Promise<StatItem[]> => {
    try {
      const response = await api.get('/dashboard/stats');
      if (response.data?.data?.stats) {
        return response.data.data.stats;
      }
      return statsData;
    } catch (e) {
      console.warn('Using fallback stats:', e);
      return statsData;
    }
  },

  getSalesOverview: async (range: string = '7d'): Promise<SalesDataPoint[]> => {
    try {
      const response = await api.get('/dashboard/stats');
      if (response.data?.data?.salesData) {
        return response.data.data.salesData;
      }
      return salesOverviewData;
    } catch (e) {
      return salesOverviewData;
    }
  },

  getOrderStatuses: async (): Promise<OrderStatusItem[]> => {
    try {
      const response = await api.get('/dashboard/stats');
      if (response.data?.data?.orderStatuses) {
        return response.data.data.orderStatuses;
      }
      return orderStatusData;
    } catch (e) {
      return orderStatusData;
    }
  },

  getTopLocations: async (): Promise<TopLocation[]> => {
    try {
      const response = await api.get('/dashboard/stats');
      if (response.data?.data?.topLocations) {
        return response.data.data.topLocations;
      }
      return topLocationsData;
    } catch (e) {
      return topLocationsData;
    }
  },

  getRecentActivity: async (): Promise<RecentActivityItem[]> => {
    try {
      const response = await api.get('/dashboard/stats');
      if (response.data?.data?.recentOrders) {
        return response.data.data.recentOrders.map((ord: any) => ({
          id: String(ord.id),
          type: 'order',
          title: `New Order ${ord.id}`,
          description: `${ord.customer} placed an order worth ₨${Number(ord.total).toLocaleString()}`,
          timestamp: ord.date || 'Just now',
          status: ord.status,
        }));
      }
      return recentActivityData;
    } catch (e) {
      return recentActivityData;
    }
  },

  getQuickActions: async (): Promise<QuickActionItem[]> => {
    return Promise.resolve(quickActionsData);
  },
};
