import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Dashboard } from '../pages/Dashboard/Dashboard';
import { OrdersPage } from '../pages/Orders/Orders';
import { ProductsPage } from '../pages/Products/Products';
import { CustomersPage } from '../pages/Customers/Customers';
import { InventoryPage } from '../pages/Inventory/Inventory';
import { CouponsPage } from '../pages/Coupons/Coupons';
import { GalleryPage } from '../pages/Gallery/GalleryPage';
import { ShippingPage } from '../pages/Shipping/Shipping';
import { ReportsPage } from '../pages/Reports/Reports';
import { MarketingPage } from '../pages/Marketing/Marketing';
import { BlogPage } from '../pages/Blog/Blog';
import { SettingsPage } from '../pages/Settings/Settings';
import { DealsPage } from '../pages/Deals/DealsPage';
import { UploadBrandPage } from '../pages/Brands/UploadBrandPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="brands/upload" element={<UploadBrandPage />} />
        <Route path="deals" element={<DealsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="shipping" element={<ShippingPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="marketing" element={<MarketingPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
