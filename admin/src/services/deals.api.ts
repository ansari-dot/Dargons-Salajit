import { api } from './api';

export interface Deal {
  id: number;
  title: string;
  subtitle?: string;
  product_id?: number | null;
  product_name?: string;
  product_image?: string;
  original_price: number;
  deal_price: number;
  discount_percentage?: number;
  banner_image?: string;
  start_time?: string;
  end_time?: string;
  is_active: boolean | number;
  created_at?: string;
}

export const dealsApi = {
  getDeals: async (): Promise<Deal[]> => {
    try {
      const response = await api.get('/deals');
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching deals:', err);
      return [];
    }
  },

  createDeal: async (data: Partial<Deal>): Promise<Deal | null> => {
    try {
      const response = await api.post('/deals', data);
      return response.data?.data || null;
    } catch (err) {
      console.error('Error creating deal:', err);
      throw err;
    }
  },

  updateDeal: async (id: number, data: Partial<Deal>): Promise<Deal | null> => {
    try {
      const response = await api.put(`/deals/${id}`, data);
      return response.data?.data || null;
    } catch (err) {
      console.error('Error updating deal:', err);
      throw err;
    }
  },

  toggleDealStatus: async (id: number): Promise<boolean> => {
    try {
      await api.patch(`/deals/${id}/toggle`);
      return true;
    } catch (err) {
      console.error('Error toggling deal status:', err);
      return false;
    }
  },

  deleteDeal: async (id: number): Promise<boolean> => {
    try {
      await api.delete(`/deals/${id}`);
      return true;
    } catch (err) {
      console.error('Error deleting deal:', err);
      return false;
    }
  }
};
