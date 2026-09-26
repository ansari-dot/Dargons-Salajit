import { api } from './api';

export interface GalleryItem {
  id: string | number;
  title: string;
  category: string;
  image_url: string;
  caption?: string;
  display_order?: number;
  is_active: boolean | number;
  created_at?: string;
}

export interface CreateGalleryPayload {
  title: string;
  category: string;
  image_url: string;
  caption?: string;
  display_order?: number;
  is_active?: boolean;
}

export const galleryApi = {
  getGalleryItems: async (): Promise<GalleryItem[]> => {
    try {
      const response = await api.get('/gallery');
      const rawData = response.data?.data || response.data || [];
      return rawData.map((g: any) => ({
        ...g,
        id: String(g.id),
        display_order: Number(g.display_order || 0),
        is_active: Boolean(g.is_active)
      }));
    } catch (error) {
      console.warn('Backend /api/gallery error:', error);
      return [];
    }
  },

  createGalleryItem: async (payload: CreateGalleryPayload): Promise<GalleryItem> => {
    const response = await api.post('/gallery', payload);
    const created = response.data?.data || response.data;
    return {
      ...created,
      id: String(created.id),
      is_active: Boolean(created.is_active)
    };
  },

  updateGalleryItem: async (id: string | number, payload: Partial<CreateGalleryPayload>): Promise<GalleryItem> => {
    const response = await api.put(`/gallery/${id}`, payload);
    const updated = response.data?.data || response.data;
    return {
      ...updated,
      id: String(updated.id),
      is_active: Boolean(updated.is_active)
    };
  },

  toggleStatus: async (id: string | number): Promise<GalleryItem> => {
    const response = await api.patch(`/gallery/${id}/toggle`);
    const updated = response.data?.data || response.data;
    return {
      ...updated,
      id: String(updated.id),
      is_active: Boolean(updated.is_active)
    };
  },

  deleteGalleryItem: async (id: string | number): Promise<void> => {
    await api.delete(`/gallery/${id}`);
  }
};
