import {
  StatItem,
  SalesDataPoint,
  OrderStatusItem,
  TopLocation,
  RecentActivityItem,
  QuickActionItem,
} from '../types';

export const statsData: StatItem[] = [
  {
    id: 'orders',
    title: 'Total Orders',
    value: '248',
    change: '12%',
    isPositive: true,
    comparisonText: 'vs. last 7 days',
    iconName: 'orders',
    accentColor: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
  },
  {
    id: 'revenue',
    title: 'Total Revenue',
    value: '$12,845',
    change: '18%',
    isPositive: true,
    comparisonText: 'vs. last 7 days',
    iconName: 'revenue',
    accentColor: 'text-sky-600',
    bgLight: 'bg-sky-50',
  },
  {
    id: 'customers',
    title: 'Total Customers',
    value: '1,230',
    change: '9%',
    isPositive: true,
    comparisonText: 'vs. last 7 days',
    iconName: 'customers',
    accentColor: 'text-indigo-600',
    bgLight: 'bg-indigo-50',
  },
  {
    id: 'products',
    title: 'Total Products',
    value: '36',
    change: '6%',
    isPositive: true,
    comparisonText: 'vs. last 7 days',
    iconName: 'products',
    accentColor: 'text-amber-600',
    bgLight: 'bg-amber-50',
  },
];

export const salesOverviewData: SalesDataPoint[] = [
  { date: '2025-09-14', displayDate: 'Sep 14', revenue: 700 },
  { date: '2025-09-15', displayDate: 'Sep 15', revenue: 1050 },
  { date: '2025-09-16', displayDate: 'Sep 16', revenue: 950 },
  { date: '2025-09-17', displayDate: 'Sep 17', revenue: 1450 },
  { date: '2025-09-18', displayDate: 'Sep 18', revenue: 1380 },
  { date: '2025-09-19', displayDate: 'Sep 19', revenue: 1820 },
  { date: '2025-09-20', displayDate: 'Sep 20', revenue: 2250 },
];

export const orderStatusData: OrderStatusItem[] = [
  { status: 'Delivered', count: 142, percentage: 57, color: '#10B981' },
  { status: 'Processing', count: 54, percentage: 22, color: '#3B82F6' },
  { status: 'Shipped', count: 32, percentage: 13, color: '#06B6D4' },
  { status: 'Cancelled', count: 12, percentage: 5, color: '#EF4444' },
  { status: 'Refunded', count: 8, percentage: 3, color: '#94A3B8' },
];

export const quickActionsData: QuickActionItem[] = [
  { id: 'add-product', label: 'Add Product', icon: 'PackagePlus', actionKey: 'add_product', route: '/products' },
  { id: 'create-coupon', label: 'Create Coupon', icon: 'Ticket', actionKey: 'create_coupon', route: '/coupons' },
  { id: 'bulk-upload', label: 'Bulk Upload', icon: 'FileUp', actionKey: 'bulk_upload', route: '/inventory' },
  { id: 'view-orders', label: 'View Orders', icon: 'ShoppingBag', actionKey: 'view_orders', route: '/orders' },
  { id: 'shipping-labels', label: 'Shipping Labels', icon: 'Tag', actionKey: 'shipping_labels', route: '/shipping' },
  { id: 'generate-report', label: 'Generate Report', icon: 'FileText', actionKey: 'generate_report', route: '/reports' },
  { id: 'manage-customers', label: 'Manage Customers', icon: 'Users', actionKey: 'manage_customers', route: '/customers' },
  { id: 'store-settings', label: 'Store Settings', icon: 'Settings', actionKey: 'store_settings', route: '/settings' },
];

export const topLocationsData: TopLocation[] = [
  { id: 'pk', country: 'Pakistan', percentage: 18, color: '#10B981' },
  { id: 'sa', country: 'Saudi Arabia', percentage: 18, color: '#10B981' },
  { id: 'ae', country: 'UAE', percentage: 18, color: '#06B6D4' },
  { id: 'other', country: 'Other', percentage: 46, color: '#94A3B8' },
];

export const recentActivityData: RecentActivityItem[] = [
  {
    id: 'act-1',
    type: 'order',
    title: 'New order #ORD-2489',
    subtitle: '$89.00 · 2 min ago',
    time: '2 min ago',
    amount: '$89.00',
  },
  {
    id: 'act-2',
    type: 'delivery',
    title: 'Order #ORD-2488 delivered',
    subtitle: '$124.00 · 12 min ago',
    time: '12 min ago',
    amount: '$124.00',
  },
  {
    id: 'act-3',
    type: 'customer',
    title: 'New customer registered',
    subtitle: 'Ayesha Khan · 25 min ago',
    time: '25 min ago',
  },
  {
    id: 'act-4',
    type: 'stock',
    title: 'Product out of stock',
    subtitle: 'Himalayan Shilajit (100g) · 1 hour ago',
    time: '1 hour ago',
  },
  {
    id: 'act-5',
    type: 'coupon',
    title: 'Coupon used',
    subtitle: 'SAVE10 · 2 hours ago',
    time: '2 hours ago',
  },
];
