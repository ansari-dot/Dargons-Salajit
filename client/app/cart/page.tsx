'use client';

import React from 'react';
import Link from 'next/link';
import CartTable from '@/components/cart/CartTable';
import CartSummary from '@/components/cart/CartSummary';

export default function CartPage() {
  return (
    <>
      <div className="shop-top-breadcrumb">
        <div className="shop-top-breadcrumb__container">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <span className="current">Shopping Cart</span>
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '40px 32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>Shopping Cart</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
          <CartTable />
          <CartSummary />
        </div>
      </div>
    </>
  );
}
