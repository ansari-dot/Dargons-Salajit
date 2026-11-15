import { api } from './api';

export interface Certification {
  id: string | number;
  title: string;
  issuer: string | null;
  certificate_number: string | null;
  description: string | null;
  image_url: string | null;
  document_url: string | null;
  issued_at: string | null;
  expires_at: string | null;
  display_order: number;
  is_active: boolean | number;
  created_at?: string;
}

export type CertificationPayload = Omit<Certification, 'id' | 'created_at'>;

const normalize = (item: Certification): Certification => ({
  ...item,
  id: String(item.id),
  display_order: Number(item.display_order || 0),
  is_active: Boolean(item.is_active),
});

export const certificationsApi = {
  async getAll(): Promise<Certification[]> {
    const response = await api.get('/certifications/admin');
    const items = response.data?.data;
    if (!Array.isArray(items)) throw new Error('Invalid certifications response from the server.');
    return items.map(normalize);
  },

  async create(payload: CertificationPayload): Promise<Certification> {
    const response = await api.post('/certifications/admin', payload);
    return normalize(response.data?.data);
  },

  async update(id: string | number, payload: CertificationPayload): Promise<Certification> {
    const response = await api.put(`/certifications/admin/${id}`, payload);
    return normalize(response.data?.data);
  },

  async remove(id: string | number): Promise<void> {
    await api.delete(`/certifications/admin/${id}`);
  },
};
