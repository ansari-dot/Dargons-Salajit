'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import TopBar from './TopBar';
import Header from './Header';
import NavDrawer from './NavDrawer';
import Footer from './Footer';
import QuickViewModal from '../product/QuickViewModal';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

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
