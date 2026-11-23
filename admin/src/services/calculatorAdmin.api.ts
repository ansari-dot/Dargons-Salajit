import { api } from './api';

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  unit_type: string;
  moq: number;
  min_product_cost: number;
  description: string;
  image_url?: string | null;
  is_active: number | boolean;
}

export interface AdminPackaging {
  id: number;
  name: string;
  code: string;
  type: string;
  moq: number;
  max_quantity: number | null;
  unit_price: number | null;
  image_url: string | null;
  estimated_weight?: string | null;
  material_cost: number;
  printing_cost: number;
  setup_cost: number;
  printing_moq: number;
  other_cost: number;
  dieline_url: string | null;
  dimensions: string | null;
  capacity: string | null;
  technical_specs: string | null;
  is_active: number | boolean;
  effective_from: string | null;
  effective_until: string | null;
  pricing_version: number;
}

export interface AdminPricingTier {
  id: number;
  entity_type: 'product' | 'packaging';
  entity_id: number;
  min_quantity: number;
  max_quantity: number | null;
  rate: number;
  estimated_weight?: number | null;
  is_open_ended: number | boolean;
  is_active: number | boolean;
  effective_from: string | null;
  effective_until: string | null;
  pricing_version: number;
}

export interface AdminCalculatorCurrency {
  code: string;
  name: string;
  isEnabled: boolean;
  rateMode: 'base' | 'automatic' | 'manual';
  ratePkrPerUnit: number;
  rateSource: string;
  rateUpdatedAt: string | null;
  manualRatePkrPerUnit: number | null;
}

export const calculatorAdminApi = {
  getProducts: async (): Promise<AdminProduct[]> => {
    const res = await api.get('/calculator/admin/products');
    return res.data.data;
  },

  updateProduct: async (id: number, data: Partial<AdminProduct>): Promise<void> => {
    await api.put(`/calculator/admin/products/${id}`, data);
  },

  createProduct: async (data: Omit<AdminProduct, 'id' | 'slug'> & { slug?: string }): Promise<void> => {
    await api.post('/calculator/admin/products', data);
  },

  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`/calculator/admin/products/${id}`);
  },

  getPackaging: async (): Promise<AdminPackaging[]> => {
    const res = await api.get('/calculator/admin/packaging');
    return res.data.data;
  },

  updatePackaging: async (id: number, data: Partial<AdminPackaging>): Promise<void> => {
    await api.put(`/calculator/admin/packaging/${id}`, data);
  },

  createPackaging: async (data: Omit<AdminPackaging, 'id'>): Promise<void> => {
    await api.post('/calculator/admin/packaging', data);
  },

  deletePackaging: async (id: number): Promise<void> => {
    await api.delete(`/calculator/admin/packaging/${id}`);
  },

  getPricingTiers: async (): Promise<AdminPricingTier[]> => {
    const res = await api.get('/calculator/admin/pricing-tiers');
    return res.data.data;
  },

  createPricingTier: async (data: Omit<AdminPricingTier, 'id'>): Promise<void> => {
    await api.post('/calculator/admin/pricing-tiers', data);
  },

  updatePricingTier: async (id: number, data: Partial<AdminPricingTier>): Promise<void> => {
    await api.put(`/calculator/admin/pricing-tiers/${id}`, data);
  },

  deletePricingTier: async (id: number): Promise<void> => {
    await api.delete(`/calculator/admin/pricing-tiers/${id}`);
  },

  getCalculatorCurrencies: async (): Promise<AdminCalculatorCurrency[]> => {
    const res = await api.get('/calculator/admin/currencies');
    return res.data.data;
  },

  updateCalculatorCurrency: async (
    code: string,
    data: { is_enabled: boolean; rate_mode: 'automatic' | 'manual'; manual_rate_pkr_per_unit?: number | null }
  ): Promise<void> => {
    await api.put(`/calculator/admin/currencies/${code}`, data);
  },
};
