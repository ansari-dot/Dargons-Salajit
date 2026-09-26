'use client';

import React from 'react';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  selectCartItems,
  updateQuantity,
  removeFromCart,
} from '@/lib/redux/slices/cartSlice';

export default function CartTable() {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);

  if (cartItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Your Shopping Cart is Empty</h2>
        <p style={{ marginTop: '12px', color: '#666' }}>
          Explore our premium Himalayan Salajeet collection and add items to your cart.
        </p>
      </div>
    );
  }

  return (
    <div className="cart-table-wrapper">
      <table className="cart-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item) => (
            <tr key={item.id}>
              <td className="cart-table__product">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={64}
                    height={64}
                    style={{ objectFit: 'contain' }}
                  />
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                </div>
              </td>
              <td>₨{item.price.toLocaleString()}.00</td>
              <td>
                <div className="cart-qty-control" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() =>
                      dispatch(
                        updateQuantity({ id: item.id, quantity: item.quantity - 1 })
                      )
                    }
                    style={{ padding: '4px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      dispatch(
                        updateQuantity({ id: item.id, quantity: item.quantity + 1 })
                      )
                    }
                    style={{ padding: '4px 10px', border: '1px solid #ccc', borderRadius: '4px' }}
                  >
                    +
                  </button>
                </div>
              </td>
              <td style={{ fontWeight: 700, color: '#636830' }}>
                ₨{(item.price * item.quantity).toLocaleString()}.00
              </td>
              <td>
                <button
                  onClick={() => dispatch(removeFromCart(item.id))}
                  style={{ color: '#d90429', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  &times;
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
