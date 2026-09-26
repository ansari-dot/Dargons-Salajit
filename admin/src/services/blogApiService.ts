import { api } from './api';

export interface BlogItem {
  id: number;
  title: string;
  slug: string;
  author: string;
  excerpt: string;
  content: string;
  image: string;
  tags?: string[] | string | null;
  is_published: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBlogPayload {
  title: string;
  slug: string;
  author?: string;
  excerpt: string;
  content: string;
  image: string;
  tags?: string[];
  is_published?: boolean;
}

export interface UpdateBlogPayload {
  title?: string;
  slug?: string;
  author?: string;
  excerpt?: string;
  content?: string;
  image?: string;
  tags?: string[];
  is_published?: boolean;
}

export const blogApiService = {
  // Fetch all blogs with optional search/isPublished filter
  getAll: async (params?: { search?: string; isPublished?: string }) => {
    const response = await api.get('/blogs', { params });
    // Response handler wraps payload in response.data.data
    return response.data.data || response.data;
  },

  // Get single blog by ID or Slug
  getById: async (idOrSlug: string | number) => {
    const response = await api.get(`/blogs/${idOrSlug}`);
    return response.data.data || response.data;
  },

  // Create new Blog post
  create: async (payload: CreateBlogPayload) => {
    const response = await api.post('/blogs', payload);
    return response.data.data || response.data;
  },

  // Update Blog post
  update: async (id: number, payload: UpdateBlogPayload) => {
    const response = await api.put(`/blogs/${id}`, payload);
    return response.data.data || response.data;
  },

  // Delete Blog post
  delete: async (id: number) => {
    const response = await api.delete(`/blogs/${id}`);
    return response.data;
  },
};
