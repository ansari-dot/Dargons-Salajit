'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { 
  selectCartSubtotal, 
  setAppliedCouponSuccess, 
  setAppliedCouponError, 
  removeCoupon 
} from '@/lib/redux/slices/cartSlice';
import { formatAmount } from '@/lib/utils/currency';
import { PAKISTAN_DELIVERY_CHARGE, isPakistanCustomer } from '@/lib/utils/delivery';

export default function CartSummary() {
  const dispatch = useAppDispatch();
  const subtotal = useAppSelector(selectCartSubtotal);
  const couponCode = useAppSelector((state) => state.cart.couponCode);
  const discountAmount = useAppSelector((state) => state.cart.discountAmount);
  const couponError = useAppSelector((state) => state.cart.couponError);
  const couponMessage = useAppSelector((state) => state.cart.couponMessage);

  const [inputCoupon, setInputCoupon] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const currency = useAppSelector((state) => state.ui.selectedCurrency);
  const countryCode = useAppSelector((state) => state.ui.countryCode);
  const isPakistan = isPakistanCustomer(countryCode);

  // The cart shows the standard (Normal) ₨300 delivery charge for Pakistan —
  // the final charge, including Urgent delivery, is confirmed on checkout.
  const deliveryCharge = isPakistan ? PAKISTAN_DELIVERY_CHARGE : 0;

  const grandTotal = Math.max(0, subtotal - discountAmount) + deliveryCharge;

  const handleApplyCoupon = async () => {
    if (!inputCoupon.trim()) return;
    setIsValidating(true);

    try {
      const response = await fetch('http://localhost:5000/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: inputCoupon.trim(),
          subtotal: subtotal
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch(setAppliedCouponSuccess({
          code: data.data.coupon.code,
          discountAmount: data.data.discount_amount,
          message: data.message || `Coupon '${data.data.coupon.code}' applied!`
        }));
        setInputCoupon('');
      } else {
        dispatch(setAppliedCouponError(data.message || 'Invalid or expired promo code.'));
      }
    } catch (error) {
      console.error('Coupon validation network error:', error);
      dispatch(setAppliedCouponError('Unable to connect to server to validate coupon.'));
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="cart-summary" style={{ background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e2e2' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Cart Summary</h3>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span>Subtotal</span>
        <span style={{ fontWeight: 600 }}>{formatAmount(subtotal, currency)}</span>
      </div>

      {discountAmount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#2b9348' }}>
          <span>Discount ({couponCode})</span>
          <span style={{ fontWeight: 600 }}>-{formatAmount(discountAmount, currency)}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span>Delivery (Normal)</span>
        {isPakistan ? (
          <span style={{ fontWeight: 600 }}>{formatAmount(deliveryCharge, currency)}</span>
        ) : (
          <span style={{ fontWeight: 600, color: '#666' }}>Calculated at checkout</span>
        )}
      </div>

      <div style={{ height: '1px', background: '#eee', margin: '16px 0' }}></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '1.1rem', fontWeight: 800 }}>
        <span>Total</span>
        <span style={{ color: '#636830' }}>{formatAmount(grandTotal, currency)}</span>
      </div>

      {/* Coupon Application Box */}
      {couponCode ? (
        <div style={{ 
          background: '#f0fdf4', 
          border: '1px solid #bbf7d0', 
          padding: '12px 14px', 
          borderRadius: '6px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534', margin: 0 }}>
              🎉 Coupon '{couponCode}' Applied!
            </p>
            <p style={{ fontSize: '0.75rem', color: '#15803d', margin: '2px 0 0 0' }}>
              You saved {formatAmount(discountAmount, currency)}
            </p>
          </div>
          <button
            onClick={() => dispatch(removeCoupon())}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Promo code (e.g. WELCOME10)"
              value={inputCoupon}
              onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
              style={{ flex: 1, padding: '10px 14px', border: '1px solid #ccc', borderRadius: '4px', textTransform: 'uppercase' }}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={isValidating}
              style={{ 
                padding: '10px 16px', 
                background: '#333', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '4px', 
                fontWeight: 600, 
                cursor: isValidating ? 'not-allowed' : 'pointer' 
              }}
            >
              {isValidating ? '...' : 'Apply'}
            </button>
          </div>

          {couponError && (
            <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '6px', fontWeight: 600 }}>
              {couponError}
            </p>
          )}

          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#888' }}>
            Available codes: <span style={{ fontWeight: 600, color: '#333' }}>WELCOME10, SAVE500, HIMALAYA20</span>
          </div>
        </div>
      )}

      <Link
        href="/checkout"
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'center',
          background: '#636830',
          color: '#fff',
          padding: '14px',
          borderRadius: '4px',
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        PROCEED TO CHECKOUT
      </Link>
    </div>
  );
}
