import React from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { StatCard } from '../../components/dashboard/StatCard';
import { ProductPromoCard } from '../../components/dashboard/ProductPromoCard';
import { SalesChart } from '../../components/dashboard/SalesChart';
import { OrderStatusChart } from '../../components/dashboard/OrderStatusChart';
import { QuickActions } from '../../components/dashboard/QuickActions';
import { TopSellingProducts } from '../../components/dashboard/TopSellingProducts';
import { RecentOrders } from '../../components/dashboard/RecentOrders';
import { RecentCustomers } from '../../components/dashboard/RecentCustomers';
import { StockOverview } from '../../components/dashboard/StockOverview';
import { TopLocations } from '../../components/dashboard/TopLocations';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { useAppSelector } from '../../store';

export const Dashboard: React.FC = () => {
  const user = useAppSelector((state) => state.adminAuth.user);
  const {
    stats,
    salesData,
    orderStatuses,
    topProducts,
    recentOrders,
    recentCustomers,
    stockItems,
    topLocations,
    activities,
    quickActions,
    error,
  } = useDashboard();
  const totalOrders = orderStatuses.reduce((total, item) => total + item.count, 0);

  return (
    <div className="space-y-6 pb-12 min-w-0">
      {/* 1. Header */}
      <DashboardHeader userName={user?.first_name || user?.email?.split('@')[0] || 'Admin'} />
      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Dashboard data could not be refreshed: {error}
        </div>
      )}

      {/* 2. Top Row: 4 Stat Cards (8 cols) + 1 Product Promo Card (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* The 4 Stat cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>

        {/* The Promotional Card */}
        <div className="lg:col-span-4">
          <ProductPromoCard />
        </div>
      </div>

      {/* 3. Row 2: Sales Overview (6 cols) + Order Status (3 cols) + Quick Actions (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-6">
          <SalesChart data={salesData} />
        </div>
        <div className="lg:col-span-3">
          <OrderStatusChart data={orderStatuses} totalOrders={totalOrders} />
        </div>
        <div className="lg:col-span-3">
          <QuickActions actions={quickActions} />
        </div>
      </div>

      {/* 4. Row 3: Top Selling Products (5 cols) + Recent Orders (4 cols) + Recent Activity (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5">
          <TopSellingProducts products={topProducts} />
        </div>
        <div className="lg:col-span-4">
          <RecentOrders orders={recentOrders} />
        </div>
        <div className="lg:col-span-3">
          <RecentActivity activities={activities} />
        </div>
      </div>

      {/* 5. Row 4: Recent Customers (5 cols) + Stock Overview (4 cols) + Top Locations (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5">
          <RecentCustomers customers={recentCustomers} />
        </div>
        <div className="lg:col-span-4">
          <StockOverview items={stockItems} />
        </div>
        <div className="lg:col-span-3">
          <TopLocations locations={topLocations} />
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
