'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ShoppingBag } from 'lucide-react';

function CheckoutSuccessContent() {
  const searchParams  = useSearchParams();
  const orderNumber   = searchParams.get('order_number') || searchParams.get('orderNumber') || '';
  const tracker       = searchParams.get('tracker') || '';

  const [verifying,     setVerifying]     = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('paid');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (orderNumber) {
          const res = await fetch('http://localhost:5000/api/payments/verify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ order_number: orderNumber }),
          });
          const data = await res.json();
          if (data.success) {
            setPaymentStatus(data.data?.payment_status || 'paid');
          }
        }
      } catch (err) {
        console.warn('Payment verification error:', err);
      } finally {
        setVerifying(false);
      }
    };
    verifyPayment();
  }, [orderNumber]);

  return (
    <div style={{ minHeight: '70vh', padding: '60px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf9f6' }}>
      <div style={{ background: '#fff', padding: '48px 36px', borderRadius: '16px', border: '1px solid #e8e5de', textAlign: 'center', maxWidth: '540px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <CheckCircle2 style={{ width: '36px', height: '36px' }} />
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111', marginBottom: '8px' }}>Payment Completed!</h1>
        <p style={{ fontSize: '0.95rem', color: '#666', marginBottom: '24px' }}>
          Thank you for choosing <strong>Palses Pure Salajeet</strong>. Your order has been placed and verified via Safepay.
        </p>

        <div style={{ backgroundColor: '#f8f6f0', padding: '16px 20px', borderRadius: '10px', textAlign: 'left', marginBottom: '28px', fontSize: '0.88rem' }}>
          {orderNumber && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#777' }}>Order Number:</span>
              <span style={{ fontWeight: 800, color: '#636830' }}>{orderNumber}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#777' }}>Payment Status:</span>
            <span style={{ fontWeight: 700, color: '#10b981', textTransform: 'capitalize' }}>
              {verifying ? 'Verifying...' : paymentStatus}
            </span>
          </div>
          {tracker && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#777' }}>Safepay Tracker:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#444' }}>{tracker}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/account" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#636830', color: '#fff', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
            <ShoppingBag style={{ width: '16px', height: '16px' }} />
            View Account & Orders
          </Link>
          <Link href="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: '#222', color: '#fff', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * useSearchParams() must live inside a Suspense boundary so the page can still
 * be prerendered (Next.js CSR bailout requirement).
 */
export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
          Loading your order...
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
