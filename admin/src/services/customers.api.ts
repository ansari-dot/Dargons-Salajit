import { api } from './api';
import { Customer } from '../types';

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getAvatar = (name: string, id: string | number) => {
  const avatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
  ];
  const idx = Math.abs(typeof id === 'number' ? id : String(id).length) % avatars.length;
  return avatars[idx];
};

export interface CreateCustomerPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  street_address?: string;
  city?: string;
  postal_code?: string;
  password?: string;
  role?: string;
}

// Maps a raw `users` row from the admin backend to the UI Customer type
const mapUserToCustomer = (u: any): Customer => {
  const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Customer';
  const id = u.id ?? u.userId ?? Date.now();
  return {
    id: String(id),
    name: fullName,
    email: u.email || '',
    ordersCount: Number(u.orders_count || 0),
    totalSpent: Number(u.total_spent || 0),
    joinedDate: formatDate(u.created_at),
    avatar: getAvatar(fullName, id),
    phone: u.phone || '',
    city: u.city || '',
    street_address: u.street_address || '',
    postal_code: u.postal_code || '',
    role: u.role || 'customer'
  };
};

export const customersApi = {
  getCustomers: async (): Promise<Customer[]> => {
    try {
      // Admin backend: GET /api/admin/customer (order stats included)
      const response = await api.get('/admin/customer');
      const rawData = response.data?.data || response.data || [];
      if (!Array.isArray(rawData)) {
        throw new Error('The customers API returned an invalid response.');
      }
      return rawData.map(mapUserToCustomer);
    } catch (error) {
      console.error('Failed to load customers:', error);
      return [];
    }
  },

  // Show a single customer: GET /api/admin/customer/:id
  getCustomer: async (id: string): Promise<Customer | null> => {
    try {
      const response = await api.get(`/admin/customer/${id}`);
      const raw = response.data?.data || response.data;
      if (!raw || typeof raw !== 'object') return null;
      return mapUserToCustomer(raw);
    } catch (error) {
      console.warn(`Backend /api/admin/customer/${id} unavailable:`, error);
      // Fallback: find the customer in the list / static data
      const list = await customersApi.getCustomers();
      return list.find((c) => String(c.id) === String(id)) || null;
    }
  },

  createCustomer: async (payload: CreateCustomerPayload): Promise<Customer> => {
    const response = await api.post('/users', payload);
    const created = response.data?.data || response.data;
    return mapUserToCustomer({ ...created, ...payload });
  },

  deleteCustomer: async (id: string): Promise<void> => {
    // Admin backend: DELETE /api/admin/customer/:id
    await api.delete(`/admin/customer/${id}`);
  }
};
