import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Boxes,
  Ticket,
  Truck,
  BarChart2,
  Megaphone,
  FileText,
  Settings,
  Image as ImageIcon,
  Store,
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onNavigate?: () => void;
}

interface NavItemConfig {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
}

const mainNavItems: NavItemConfig[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', path: '/orders', icon: ShoppingBag, badge: 12 },
  { name: 'Products', path: '/products', icon: Package },
  { name: 'Deals & Offers', path: '/deals', icon: Flame },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Inventory', path: '/inventory', icon: Boxes },
  { name: 'Coupons', path: '/coupons', icon: Ticket },
  { name: 'Gallery Showcase', path: '/gallery', icon: ImageIcon },
  { name: 'Shipping', path: '/shipping', icon: Truck },
  { name: 'Reports', path: '/reports', icon: BarChart2 },
  { name: 'Marketing', path: '/marketing', icon: Megaphone },
  { name: 'Blog / CMS', path: '/blog', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const salesChannels = [
  { name: 'Online Store', icon: Store, color: 'text-slate-600' },
  { name: 'Amazon', icon: 'amazon', color: 'text-amber-600' },
  { name: 'eBay', icon: 'ebay', color: 'text-blue-500' },
  { name: 'Shopify', icon: 'shopify', color: 'text-emerald-600' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  onNavigate,
}) => {
  return (
    <aside
      className={`relative flex flex-col h-full bg-white border-r border-slate-100/90 transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header / Logo */}
      <div className="h-18 px-5 flex items-center justify-between border-b border-slate-50">
        <NavLink to="/dashboard" onClick={onNavigate} className="flex items-center">
          <BrandLogo collapsed={collapsed} />
        </NavLink>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1 scrollbar-thin">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all group ${
                  isActive
                    ? 'bg-[#EEF5FF] text-[#2563EB] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? item.name : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                      isActive ? 'text-[#2563EB]' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                  {!collapsed && item.badge && (
                    <span className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E2EDFB] text-[#2563EB]">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {/* Divider & Sales Channels */}
        <div className="pt-4 pb-2">
          {!collapsed ? (
            <p className="px-3 text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">
              Sales Channels
            </p>
          ) : (
            <div className="h-px bg-slate-100 mx-2 my-2" />
          )}
        </div>

        {salesChannels.map((channel) => (
          <button
            key={channel.name}
            type="button"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer ${
              collapsed ? 'justify-center px-0' : ''
            }`}
            title={collapsed ? channel.name : undefined}
            onClick={() => {
              alert(`Channel: ${channel.name}`);
            }}
          >
            {channel.icon === 'amazon' ? (
              <span className="w-[18px] h-[18px] flex items-center justify-center font-bold text-xs text-amber-700 font-serif">
                a
              </span>
            ) : channel.icon === 'ebay' ? (
              <span className="w-[18px] h-[18px] flex items-center justify-center font-black text-[10px] text-blue-500 tracking-tighter">
                eb
              </span>
            ) : channel.icon === 'shopify' ? (
              <span className="w-[18px] h-[18px] flex items-center justify-center font-black text-[11px] text-emerald-600">
                S
              </span>
            ) : (
              <Store className="w-[18px] h-[18px] text-slate-400" />
            )}
            {!collapsed && <span className="truncate">{channel.name}</span>}
          </button>
        ))}

        <button
          type="button"
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-blue-600 hover:bg-blue-50/70 transition-colors cursor-pointer ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title={collapsed ? 'Add Channel' : undefined}
          onClick={() => alert('Add new sales channel')}
        >
          <Plus className="w-[18px] h-[18px] text-blue-600 shrink-0" />
          {!collapsed && <span>Add Channel</span>}
        </button>

        {/* Promotional Brand Card at Sidebar Bottom */}
        {!collapsed && (
          <div className="pt-6 pb-2">
            <div className="relative overflow-hidden rounded-2xl p-4 text-white shadow-sm group">
              {/* Background mountain image with dark gradient overlay */}
              <img
                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80"
                alt="Himalayan Mountain Peaks"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-slate-900/70 to-slate-900/50" />

              <div className="relative z-10 space-y-2">
                <h4 className="text-[13px] font-bold text-white tracking-tight">
                  Natural. Pure. Authentic.
                </h4>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  Premium Himalayan Shilajit for a healthier tomorrow.
                </p>
                <a
                  href="#store"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open('https://example.com', '_blank');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-1 text-[11px] font-semibold bg-white/95 text-slate-900 rounded-lg hover:bg-white transition-all shadow-xs"
                >
                  <span>View Store</span>
                  <ArrowRight className="w-3 h-3 text-slate-700" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
