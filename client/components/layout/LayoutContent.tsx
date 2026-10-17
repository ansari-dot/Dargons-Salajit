'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import TopBar from './TopBar';
import Header from './Header';
import NavDrawer from './NavDrawer';
import Footer from './Footer';
import QuickViewModal from '../product/QuickViewModal';

// Full-screen auth pages (AuthLayout) render WITHOUT the site header & footer
const AUTH_ROUTES = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  return (
    <>
      <TopBar />
      <Header />
      <NavDrawer />
      <QuickViewModal />
      <main>{children}</main>
      <Footer />
    </>
  );
}
