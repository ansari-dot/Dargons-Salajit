import { api } from './api';

export interface Brand {
  id: string | number;
  name: string;
  description?: string;
  logo_url: string;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBrandPayload {
  name: string;
  description?: string;
  logo: File;
}

// Uploaded files are stored as relative '/uploads/...' paths, so resolve them against the API origin
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export const resolveBrandLogoUrl = (url?: string | null): string => {
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
};

const normalizeBrand = (brand: any): Brand => ({
  ...brand,
  id: String(brand.id),
  name: brand.name || '',
  description: brand.description || '',
  logo_url: resolveBrandLogoUrl(brand.logo_url),
  is_active: Boolean(brand.is_active)
});

const buildBrandFormData = ({ name, description, logo }: CreateBrandPayload): FormData => {
  const formData = new FormData();
  formData.append('name', name.trim());
  formData.append('description', (description || '').trim());
  formData.append('logo', logo);
  return formData;
};

export const brandsApi = {
  getBrands: async (): Promise<Brand[]> => {
    const response = await api.get('/brands');
    const rawData = response.data?.data || response.data || [];
    return Array.isArray(rawData) ? rawData.map(normalizeBrand) : [];
  },

  getBrandById: async (id: string | number): Promise<Brand> => {
    const response = await api.get(`/brands/${id}`);
    return normalizeBrand(response.data?.data || response.data);
  },

  createBrand: async (payload: CreateBrandPayload): Promise<Brand> => {
    const response = await api.post('/brands', buildBrandFormData(payload), {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return normalizeBrand(response.data?.data || response.data);
  },

  deleteBrand: async (id: string | number): Promise<void> => {
    await api.delete(`/brands/${id}`);
  }
};
