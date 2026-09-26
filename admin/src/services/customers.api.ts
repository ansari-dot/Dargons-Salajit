import { api } from './api';
import { Customer } from '../types';
import { customersData } from '../data/customers.data';

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Sep 20, 2025';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Sep 20, 2025';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return 'Sep 20, 2025';
  }
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

export const customersApi = {
  getCustomers: async (): Promise<Customer[]> => {
    try {
      const response = await api.get('/users');
      const rawData = response.data?.data || response.data || [];
      if (!Array.isArray(rawData) || rawData.length === 0) {
        return customersData;
      }
      return rawData.map((u: any) => {
        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Customer';
        return {
          id: String(u.id),
          name: fullName,
          email: u.email || '',
          ordersCount: Number(u.orders_count || 0),
          totalSpent: Number(u.total_spent || 0),
          joinedDate: formatDate(u.created_at),
          avatar: getAvatar(fullName, u.id),
          phone: u.phone || '',
          city: u.city || '',
          street_address: u.street_address || '',
          postal_code: u.postal_code || '',
          role: u.role || 'customer'
        };
      });
    } catch (error) {
      console.warn('Backend /api/users unavailable, falling back to static data:', error);
      return customersData;
    }
  },

  createCustomer: async (payload: CreateCustomerPayload): Promise<Customer> => {
    const response = await api.post('/users', payload);
    const created = response.data?.data || response.data;
    const fullName = `${created.first_name || payload.first_name} ${created.last_name || payload.last_name}`.trim();
    return {
      id: String(created.id || Date.now()),
      name: fullName,
      email: created.email || payload.email,
      ordersCount: 0,
      totalSpent: 0,
      joinedDate: 'Just now',
      avatar: getAvatar(fullName, created.id || Date.now()),
      phone: payload.phone || '',
      city: payload.city || '',
      street_address: payload.street_address || '',
      postal_code: payload.postal_code || '',
      role: payload.role || 'customer'
    };
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  }
};

