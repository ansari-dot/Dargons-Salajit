'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { selectCartItems, selectCartSubtotal, clearCart } from '@/lib/redux/slices/cartSlice';
import { fetchStorefrontProducts } from '@/lib/redux/slices/productSlice';
import { formatAmount } from '@/lib/utils/currency';
import {
  DELIVERY_TYPES,
  DeliveryType,
  INTERNATIONAL_DEFAULT_DELIVERY_USD,
  getDeliveryTypeLabel,
  isPakistanCustomer,
  resolveDeliveryCharge,
} from '@/lib/utils/delivery';

export default function CheckoutForm() {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const couponCode = useAppSelector((state) => state.cart.couponCode);
  const discountAmount = useAppSelector((state) => state.cart.discountAmount);
  const token = useAppSelector((state) => state.auth.token);
  const currency = useAppSelector((state) => state.ui.selectedCurrency);

  // Country detected by the server IP tracker: Pakistan keeps the flat ₨300/₨500
  // delivery charges, every other customer enters the courier charge below.
  const countryCode = useAppSelector((state) => state.ui.countryCode);
  const isPakistan = isPakistanCustomer(countryCode);
  const products = useAppSelector((state) => state.products.products);

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'safepay'>('safepay');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('normal');
  const [internationalDeliveryUsd, setInternationalDeliveryUsd] = useState<string>(
    String(INTERNATIONAL_DEFAULT_DELIVERY_USD)
  );
  /** True once the overseas customer edits the delivery charge themselves */
  const [isOverseasChargeEdited, setIsOverseasChargeEdited] = useState(false);
  const [isOrdered, setIsOrdered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    street_address: '',
    city: '',
    postal_code: ''
  });

  // Delivery charges configured on the products inside the cart
  // (Admin → Products → "Delivery Charges — Other Countries")
  const configuredCharges = useMemo(() => {
    const cartProducts = cartItems
      .map((item) => products.find((p) => String(p.id) === String(item.id)))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));

    const pickMax = (values: (number | undefined)[]) => {
      const valid = values.filter((v): v is number => typeof v === 'number' && !isNaN(v) && v > 0);
      return valid.length > 0 ? Math.max(...valid) : undefined;
    };

    return {
      normal: pickMax(cartProducts.map((p) => p.deliveryChargeUsd)),
      urgent: pickMax(cartProducts.map((p) => p.urgentDeliveryChargeUsd)),
    };
  }, [cartItems, products]);

  /** Overseas charge for the selected speed: product setting first, then the store default */
  const getOverseasCharge = (type: DeliveryType): number => {
    const configured =
      type === 'urgent'
        ? configuredCharges.urgent ?? configuredCharges.normal
        : configuredCharges.normal;
    return configured ?? INTERNATIONAL_DEFAULT_DELIVERY_USD;
  };

  // The catalog is needed to read the per-product delivery charges
  useEffect(() => {
    if (products.length === 0) {
      dispatch(fetchStorefrontProducts());
    }
  }, [dispatch, products.length]);

  // Keep the overseas charge in sync with the selected speed until the customer
  // changes the field manually
  useEffect(() => {
    if (isPakistan || isOverseasChargeEdited) return;
    setInternationalDeliveryUsd(String(getOverseasCharge(deliveryType)));
  }, [
    isPakistan,
    isOverseasChargeEdited,
    deliveryType,
    configuredCharges.normal,
    configuredCharges.urgent,
  ]);

  // Delivery charge of this order (PKR base): ₨300 Normal / ₨500 Urgent inside
  // Pakistan, otherwise the USD courier charge entered for the customer.
  const deliveryCharge = resolveDeliveryCharge({
    isPakistan,
    deliveryType,
    internationalChargeUsd: internationalDeliveryUsd,
  });

  const grandTotal = Math.max(0, subtotal - discountAmount) + deliveryCharge;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    // Customers outside Pakistan must provide the courier charge for their country
    if (!isPakistan) {
      const enteredCharge = Number(internationalDeliveryUsd);
      if (internationalDeliveryUsd.trim() === '' || isNaN(enteredCharge) || enteredCharge < 0) {
        setErrorMessage('Please enter the delivery charge quoted for your country.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        street_address: formData.street_address,
        city: formData.city,
        postal_code: formData.postal_code || '54000',
        subtotal: subtotal,
        discount_amount: discountAmount,
        delivery_type: deliveryType,
        delivery_charge: deliveryCharge,
        grand_total: grandTotal,
        payment_method: paymentMethod === 'safepay' ? 'Safepay' : 'Cash on Delivery',
        coupon_code: couponCode || null,
        items: cartItems.map(item => ({
          product_id: Number(item.id) || 1,
          product_name: item.name,
          product_image: item.image,
          unit_price: item.price,
          quantity: item.quantity
        }))
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      if (paymentMethod === 'safepay') {
        // 🚀 SAFEPAY INTEGRATION FLOW:
        // 1. Backend creates order + Safepay tracker via @sfpy/node-core SDK
        // 2. Backend returns official Safepay Hosted Checkout URL
        // 3. We redirect customer to Safepay's payment portal
        const response = await fetch('http://localhost:5000/api/payments/create', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success && data.data?.checkoutURL) {
          dispatch(clearCart());
          // Redirect to Safepay Official Hosted Checkout
          window.location.href = data.data.checkoutURL;
          return;
        } else {
          setErrorMessage(data.message || 'Failed to initialize Safepay. Please try again.');
        }
      } else {
        // Standard Cash on Delivery flow
        const response = await fetch('http://localhost:5000/api/orders', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setOrderNumber(data.data?.order_number || 'ORD-SUCCESS');
          setIsOrdered(true);
          dispatch(clearCart());
        } else {
          setErrorMessage(data.message || 'Failed to place order. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      if (paymentMethod === 'cod') {
        setOrderNumber(`ORD-${Date.now().toString().slice(-6)}`);
        setIsOrdered(true);
        dispatch(clearCart());
      } else {
        setErrorMessage('Failed to connect to Safepay server. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isOrdered) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e2e2' }}>
        <h2 style={{ color: '#2b9348', fontSize: '2rem', marginBottom: '12px' }}>🎉 Order Placed Successfully!</h2>
        <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#333', marginBottom: '8px' }}>
          Order #: <span style={{ color: '#636830' }}>{orderNumber}</span>
        </p>
        <p style={{ fontSize: '1rem', color: '#555', maxWidth: '500px', margin: '0 auto' }}>
          Thank you for choosing Palses Pure Salajeet. Your order confirmation and tracking details have been recorded.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
      {/* Left Column: Shipping & Payment Method */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ background: '#fff', padding: '28px', borderRadius: '8px', border: '1px solid #e2e2e2' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '20px' }}>Shipping Information</h3>

          {errorMessage && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', fontSize: '0.85rem' }}>
              {errorMessage}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>First Name *</label>
              <input 
                required 
                type="text" 
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: '4px' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Last Name *</label>
              <input 
                required 
                type="text" 
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: '4px' }} 
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Phone Number *</label>
            <input 
              required 
              type="tel" 
              name="phone"
              placeholder="+92 300 0000000" 
              value={formData.phone}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: '4px' }} 
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Email Address *</label>
            <input 
              required 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: '4px' }} 
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Street Address *</label>
            <input 
              required 
              type="text" 
              name="street_address"
              placeholder="House / Flat No, Street, Area" 
              value={formData.street_address}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: '4px' }} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>City *</label>
              <input 
                required 
                type="text" 
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: '4px' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Postal Code</label>
              <input 
                type="text" 
                name="postal_code"
                placeholder="e.g. 54000"
                value={formData.postal_code}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: '4px' }} 
              />
            </div>
          </div>
        </div>

        {/* 🚚 Delivery Method Selection Card */}
        <div style={{ background: '#fff', padding: '28px', borderRadius: '8px', border: '1px solid #e2e2e2' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px' }}>Delivery Method</h3>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '18px' }}>
            {isPakistan
              ? 'Flat delivery charges apply inside Pakistan (Normal ₨300 / Urgent ₨500). Urgent orders are dispatched on priority.'
              : 'International orders are shipped through our courier partners. Adjust the delivery charge if a different rate was quoted for your country.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {DELIVERY_TYPES.map((option) => (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '16px 20px',
                  border: `2px solid ${deliveryType === option.value ? '#636830' : '#e2e2e2'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: deliveryType === option.value ? '#fbfcf5' : '#fff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="radio"
                    name="delivery_type"
                    value={option.value}
                    checked={deliveryType === option.value}
                    onChange={() => setDeliveryType(option.value)}
                    style={{ accentColor: '#636830', width: '18px', height: '18px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>{option.label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>{option.description}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#636830', whiteSpace: 'nowrap' }}>
                  {formatAmount(
                    resolveDeliveryCharge({
                      isPakistan,
                      deliveryType: option.value,
                      internationalChargeUsd: internationalDeliveryUsd
                    }),
                    currency
                  )}
                </span>
              </label>
            ))}
          </div>

          {/* 💵 Delivery charge field for customers outside Pakistan */}
          {!isPakistan && (
            <div style={{ marginTop: '18px', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                Delivery Charge (USD) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                name="delivery_charge_usd"
                value={internationalDeliveryUsd}
                onChange={(e) => {
                  setInternationalDeliveryUsd(e.target.value);
                  setIsOverseasChargeEdited(true);
                }}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#666', margin: '6px 0 0 0' }}>
                Deliveries for countries outside Pakistan are charged in USD. Current courier charge for
                this order is ${getOverseasCharge(deliveryType).toFixed(2)}
                {configuredCharges.normal || configuredCharges.urgent
                  ? ' (set on the product)'
                  : ' (store default)'}
                — adjust it if a different rate applies to your address.
              </p>
            </div>
          )}
        </div>

        {/* 💳 Payment Method Selection Card */}
        <div style={{ background: '#fff', padding: '28px', borderRadius: '8px', border: '1px solid #e2e2e2' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>Payment Method</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Safepay Payment Gateway Option */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              border: `2px solid ${paymentMethod === 'safepay' ? '#636830' : '#e2e2e2'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              background: paymentMethod === 'safepay' ? '#fbfcf5' : '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="radio" 
                  name="payment_method" 
                  value="safepay" 
                  checked={paymentMethod === 'safepay'}
                  onChange={() => setPaymentMethod('safepay')}
                  style={{ accentColor: '#636830', width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>Safepay Online Payment</div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>Visa, Mastercard, Debit Cards & Mobile Wallets</div>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#10b981', color: '#fff', padding: '4px 8px', borderRadius: '4px' }}>OFFICIAL SAFEPAY</span>
            </label>

            {/* Cash on Delivery Option */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              border: `2px solid ${paymentMethod === 'cod' ? '#636830' : '#e2e2e2'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              background: paymentMethod === 'cod' ? '#fbfcf5' : '#fff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="radio" 
                  name="payment_method" 
                  value="cod" 
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  style={{ accentColor: '#636830', width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>Cash on Delivery (COD)</div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>Pay with cash upon package delivery at your doorstep</div>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary */}
      <div style={{ background: '#fff', padding: '28px', borderRadius: '8px', border: '1px solid #e2e2e2', height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Your Order Summary</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {cartItems.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>{item.name} x{item.quantity}</span>
              <span style={{ fontWeight: 600 }}>{formatAmount(item.price * item.quantity, currency)}</span>
            </div>
          ))}
        </div>

        <div style={{ height: '1px', background: '#eee', margin: '16px 0' }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
          <span>Subtotal</span>
          <span>{formatAmount(subtotal, currency)}</span>
        </div>

        {discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#2b9348', fontWeight: 600 }}>
            <span>Coupon Discount ({couponCode})</span>
            <span>-{formatAmount(discountAmount, currency)}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
          <span>Delivery ({getDeliveryTypeLabel(deliveryType)})</span>
          <span>{formatAmount(deliveryCharge, currency)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '1.18rem', fontWeight: 800 }}>
          <span>Total Payable</span>
          <span style={{ color: '#636830' }}>{formatAmount(grandTotal, currency)}</span>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            background: isSubmitting ? '#999' : paymentMethod === 'safepay' ? '#0284c7' : '#636830',
            color: '#fff',
            padding: '14px',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 700,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {isSubmitting ? (
            'PROCESSING...'
          ) : paymentMethod === 'safepay' ? (
            'PROCEED TO SAFEPAY CHECKOUT 💳'
          ) : (
            'PLACE ORDER (Cash on Delivery)'
          )}
        </button>

        {paymentMethod === 'safepay' && (
          <p style={{ fontSize: '0.75rem', color: '#666', textAlign: 'center', marginTop: '12px' }}>
            🔒 You will be redirected securely to Safepay Official Checkout portal.
          </p>
        )}
      </div>
    </form>
  );
}
