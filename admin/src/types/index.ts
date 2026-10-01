export interface StatItem {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  comparisonText: string;
  iconName: 'orders' | 'revenue' | 'customers' | 'products';
  accentColor: string;
  bgLight: string;
}

export interface SalesDataPoint {
  date: string;
  displayDate: string;
  revenue: number;
}

export interface OrderStatusItem {
  status: 'Delivered' | 'Processing' | 'Shipped' | 'Cancelled' | 'Refunded';
  count: number;
  percentage: number;
  color: string;
}

export interface TopProduct {
  id: string;
  name: string;
  sold: number;
  revenue: number;
  image: string;
  category?: string;
}

export type OrderStatus = 'Delivered' | 'Processing' | 'Shipped' | 'Cancelled' | 'Refunded';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  email?: string;
  amount: number;
  status: OrderStatus;
  date: string;
  itemsCount?: number;
  /** Delivery speed picked by the customer: 'normal' | 'urgent' */
  deliveryType?: string;
  /** Delivery charge collected with the order (PKR) */
  deliveryCharge?: number;
  /** Order total before the delivery charge was added (PKR) */
  subtotal?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  ordersCount: number;
  joinedDate: string;
  avatar: string;
  totalSpent?: number;
  phone?: string;
  city?: string;
  street_address?: string;
  postal_code?: string;
  role?: string;
}

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  status: StockStatus;
  sku: string;
  image: string;
  price: number;
}

export interface TopLocation {
  id: string;
  country: string;
  percentage: number;
  color: string;
}

export interface RecentActivityItem {
  id: string;
  type: 'order' | 'delivery' | 'customer' | 'stock' | 'coupon';
  title: string;
  subtitle: string;
  time: string;
  amount?: string;
}

export interface QuickActionItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  actionKey: string;
}

export interface NavItem {
  name: string;
  path: string;
  icon: string;
  badge?: string | number;
}
