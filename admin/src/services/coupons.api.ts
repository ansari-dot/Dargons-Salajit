import { api } from './api';

export interface Coupon {
  id: string | number;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  used_count: number;
  usage_limit_per_user?: number;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean | number;
  created_at?: string;
}

export interface CreateCouponPayload {
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  usage_limit?: number | null;
  usage_limit_per_user?: number;
  end_date?: string | null;
  is_active?: boolean;
}

export const couponsApi = {
  getCoupons: async (): Promise<Coupon[]> => {
    try {
      const response = await api.get('/coupons');
      const rawData = response.data?.data || response.data || [];
      return rawData.map((c: any) => ({
        ...c,
        id: String(c.id),
        discount_value: Number(c.discount_value),
        min_order_amount: Number(c.min_order_amount || 0),
        max_discount_amount: c.max_discount_amount ? Number(c.max_discount_amount) : null,
        usage_limit: c.usage_limit ? Number(c.usage_limit) : null,
        used_count: Number(c.used_count || 0),
        is_active: Boolean(c.is_active)
      }));
    } catch (error) {
      console.warn('Backend /api/coupons error:', error);
      return [];
    }
  },

  createCoupon: async (payload: CreateCouponPayload): Promise<Coupon> => {
    const response = await api.post('/coupons', payload);
    const created = response.data?.data || response.data;
    return {
      ...created,
      id: String(created.id),
      discount_value: Number(created.discount_value),
      used_count: 0,
      is_active: Boolean(created.is_active)
    };
  },

  updateCoupon: async (id: string | number, payload: Partial<CreateCouponPayload>): Promise<Coupon> => {
    const response = await api.put(`/coupons/${id}`, payload);
    const updated = response.data?.data || response.data;
    return {
      ...updated,
      id: String(updated.id),
      discount_value: Number(updated.discount_value),
      is_active: Boolean(updated.is_active)
    };
  },

  toggleStatus: async (id: string | number): Promise<Coupon> => {
    const response = await api.patch(`/coupons/${id}/toggle`);
    const updated = response.data?.data || response.data;
    return {
      ...updated,
      id: String(updated.id),
      is_active: Boolean(updated.is_active)
    };
  },

  deleteCoupon: async (id: string | number): Promise<void> => {
    await api.delete(`/coupons/${id}`);
  }
};
