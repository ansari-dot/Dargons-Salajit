import { api } from './api';

export interface Trademark {
  id: string | number;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  document_url: string | null;
  display_order: number;
  is_active: boolean | number;
  created_at?: string;
}

export type TrademarkPayload = Omit<Trademark, 'id' | 'created_at'>;

const normalize = (item: Trademark): Trademark => ({
  ...item,
  id: String(item.id),
  display_order: Number(item.display_order || 0),
  is_active: Boolean(item.is_active),
});

export const trademarksApi = {
  async getAll(): Promise<Trademark[]> {
    const response = await api.get('/trademarks/admin');
    const items = response.data?.data;
    if (!Array.isArray(items)) throw new Error('Invalid trademarks response from the server.');
    return items.map(normalize);
  },

  async create(payload: TrademarkPayload): Promise<Trademark> {
    const response = await api.post('/trademarks/admin', payload);
    return normalize(response.data?.data);
  },

  async update(id: string | number, payload: TrademarkPayload): Promise<Trademark> {
    const response = await api.put(`/trademarks/admin/${id}`, payload);
    return normalize(response.data?.data);
  },

  async remove(id: string | number): Promise<void> {
    await api.delete(`/trademarks/admin/${id}`);
  },
};
