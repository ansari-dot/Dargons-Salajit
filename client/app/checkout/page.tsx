'use client';

import React from 'react';
import Link from 'next/link';
import CheckoutForm from '@/components/checkout/CheckoutForm';

export default function CheckoutPage() {
  return (
    <>
      <div className="shop-top-breadcrumb">
        <div className="shop-top-breadcrumb__container">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <Link href="/cart">Cart</Link>
          <span className="sep">/</span>
          <span className="current">Checkout</span>
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '40px 32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px' }}>Checkout</h1>
        <CheckoutForm />
      </div>
    </>
  );
}
