import { api } from './api';

export interface ProductItem {
  id: number;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  sku: string;
  name: string;
  slug: string;
  price: number;
  old_price?: number | null;
  usd_price?: number | null;
  delivery_charge_usd?: number | null;
  urgent_delivery_charge_usd?: number | null;
  vendor?: string;
  size?: string;
  rating?: number;
  main_image: string;
  gallery_images?: any[];
  is_active?: boolean | number;
  stock_quantity?: number;
  availability_status?: string;
  short_description?: string;
  full_description?: string;
  features_list?: string[] | string | null;
  tags?: string[] | string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductPayload {
  name: string;
  slug: string;
  sku: string;
  category_id: number;
  price: number;
  old_price?: number;
  usd_price?: number;
  delivery_charge_usd?: number;
  urgent_delivery_charge_usd?: number;
  vendor?: string;
  size?: string;
  rating?: number;
  main_image: string;
  gallery_images?: string[];
  stock_quantity?: number;
  short_description?: string;
  full_description?: string;
  features_list?: string[];
  tags?: string[];
}

export interface UpdateProductPayload {
  name?: string;
  slug?: string;
  sku?: string;
  category_id?: number;
  price?: number;
  old_price?: number;
  usd_price?: number;
  delivery_charge_usd?: number;
  urgent_delivery_charge_usd?: number;
  vendor?: string;
  size?: string;
  rating?: number;
  main_image?: string;
  gallery_images?: string[];
  stock_quantity?: number;
  short_description?: string;
  full_description?: string;
  features_list?: string[];
  tags?: string[];
  is_active?: boolean;
}

export const productApiService = {
  // Fetch all products
  getAll: async (params?: { category?: string; search?: string; minPrice?: number; maxPrice?: number }) => {
    const response = await api.get('/products', { params });
    return response.data.data || response.data;
  },

  // Get single product by ID or Slug
  getById: async (idOrSlug: string | number) => {
    const response = await api.get(`/products/${idOrSlug}`);
    return response.data.data || response.data;
  },

  // Create Product
  create: async (payload: CreateProductPayload) => {
    const response = await api.post('/products', payload);
    return response.data.data || response.data;
  },

  // Update Product
  update: async (id: number, payload: UpdateProductPayload) => {
    const response = await api.put(`/products/${id}`, payload);
    return response.data.data || response.data;
  },

  // Delete Product
  delete: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};
