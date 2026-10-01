import { api } from './api';
import { ordersData } from '../data/orders.data';
import { Order, OrderStatus } from '../types';

function mapStatus(status: string): OrderStatus {
  const s = (status || '').toLowerCase();
  if (s === 'delivered') return 'Delivered';
  if (s === 'shipped') return 'Shipped';
  if (s === 'cancelled') return 'Cancelled';
  if (s === 'refunded') return 'Refunded';
  return 'Processing';
}

export const ordersApi = {
  getOrders: async (): Promise<Order[]> => {
    try {
      const response = await api.get('/orders');
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data.map((ord: any) => {
          const custName = `${ord.first_name || ''} ${ord.last_name || ''}`.trim() || ord.email || 'Customer';
          const amt = Number(ord.grand_total || ord.subtotal || 0);
          return {
            id: String(ord.id),
            orderNumber: ord.order_number || `ORD-${ord.id}`,
            customerName: custName,
            customer: custName,
            email: ord.email || '',
            phone: ord.phone || '',
            shippingAddress: [ord.street_address, ord.city, ord.postal_code].filter(Boolean).join(', '),
            itemsCount: ord.items ? ord.items.length : 1,
            amount: amt,
            total: amt,
            paymentMethod: ord.payment_method || 'Cash on Delivery',
            paymentStatus: ord.payment_status || 'unpaid',
            deliveryType: ord.delivery_type || 'normal',
            deliveryCharge: Number(ord.delivery_charge || 0),
            subtotal: Number(ord.subtotal || 0),
            status: mapStatus(ord.order_status),
            date: ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString(),
            createdAt: ord.created_at || new Date().toISOString(),
            items: ord.items ? ord.items.map((it: any) => ({
              id: String(it.id),
              productName: it.product_name,
              quantity: it.quantity,
              price: Number(it.unit_price),
              image: it.product_image
            })) : []
          };
        });
      }
      return ordersData;
    } catch (err) {
      console.warn('Error fetching orders, using local fallback:', err);
      return ordersData;
    }
  },

  getOrderById: async (id: string): Promise<Order | undefined> => {
    try {
      const orders = await ordersApi.getOrders();
      return orders.find((o) => o.id === id || o.orderNumber === id);
    } catch (err) {
      return ordersData.find((o) => o.id === id);
    }
  },

  updateOrderStatus: async (id: string, status: string): Promise<boolean> => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      return true;
    } catch (err) {
      console.error('Failed to update order status:', err);
      return false;
    }
  }
};
