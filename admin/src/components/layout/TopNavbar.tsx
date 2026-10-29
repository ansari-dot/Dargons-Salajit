import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Search,
  Bell,
  Maximize2,
  Minimize2,
  ChevronDown,
  Menu,
  CheckCircle,
  Package,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { logoutLocally } from '../../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import { useToast } from '../common/Toast';
import {
  markRead,
  markAllRead,
  selectNotifications,
  selectUnreadCount,
} from '../../store/slices/notificationsSlice';
import type { NotificationType } from '../../store/slices/notificationsSlice';

interface TopNavbarProps {
  onMobileMenuToggle: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onMobileMenuToggle,
  searchQuery = '',
  onSearchChange,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const adminUser = useAppSelector((state) => state.adminAuth.user);
  const adminName = adminUser
    ? `${adminUser.first_name || ''} ${adminUser.last_name || ''}`.trim() || adminUser.email
    : 'Admin';
  const adminEmail = adminUser?.email || '';
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-20 h-18 bg-white border-b border-slate-100/90 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={onMobileMenuToggle}
        className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 focus:outline-none"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Left: Large Search Input */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products, orders, customers..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-xs sm:text-[13px] text-slate-800 placeholder-slate-400 border border-slate-200/70 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-[19px] h-[19px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Notifications</span>
                <button
                  type="button"
                  onClick={() => {
                    dispatch(markAllRead());
                    setShowNotifications(false);
                  }}
                  className="text-[11px] text-blue-600 cursor-pointer hover:underline focus:outline-none"
                >
                  Mark all read
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No notifications</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications
                    .slice()
                    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
                    .map((n) => {
                      const isUnread = !n.read;
                      const iconMap: Record<NotificationType, React.ReactNode> = {
                        order: <Package className="w-4 h-4 text-blue-600 mt-0.5" />,
                        delivery: <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />,
                        customer: <User className="w-4 h-4 text-indigo-600 mt-0.5" />,
                        system: <Bell className="w-4 h-4 text-slate-600 mt-0.5" />,
                      };
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            dispatch(markRead(n.id));
                            setShowNotifications(false);
                            if (n.href) navigate(n.href);
                          }}
                          className={`w-full p-2 rounded-xl flex items-start gap-2.5 ${
                            isUnread ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                          } transition-colors`}
                        >
                          <span className="flex-shrink-0">{iconMap[n.type]}</span>
                          {isUnread && (
                            <span className="w-1.5 h-1.5 mt-0.5 bg-blue-600 rounded-full flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold ${isUnread ? 'text-slate-800' : 'text-slate-600'}`}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-500">{n.body}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fullscreen Icon */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="hidden sm:flex p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle Fullscreen"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="w-[18px] h-[18px]" />
          ) : (
            <Maximize2 className="w-[18px] h-[18px]" />
          )}
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-1 pr-1.5 py-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
          >
            <Avatar
              name={adminName}
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
              size="md"
              className="ring-2 ring-slate-100"
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-[13px] font-bold text-slate-800 leading-tight">
                {adminName}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Admin</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden lg:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{adminName}</p>
                <p className="text-[11px] text-slate-500 truncate">{adminEmail}</p>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profile details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account settings</span>
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    dispatch(logoutLocally());
                    toast.success('You have been signed out.', 'Signed out');
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
