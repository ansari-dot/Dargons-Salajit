'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  selectCartItems,
  selectCartSubtotal,
  removeFromCart,
} from '@/lib/redux/slices/cartSlice';

export default function MiniCartDropdown() {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);

  return (
    <div className="header__cart-dropdown" id="cartDropdown">
      {cartItems.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', color: '#666' }}>
          Your cart is currently empty.
        </div>
      ) : (
        <>
          <div className="cart-dropdown__items">
            {cartItems.map((item) => (
              <div className="cart-dropdown__item" key={item.id}>
                <div className="cart-dropdown__img-box">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={58}
                    height={58}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <div className="cart-dropdown__info">
                  <h4 className="cart-dropdown__title">{item.name}</h4>
                  <p className="cart-dropdown__qty-price">
                    x{item.quantity} - <span>₨{item.price.toLocaleString()}</span>
                  </p>
                </div>
                <button
                  className="cart-dropdown__remove"
                  onClick={() => dispatch(removeFromCart(item.id))}
                  aria-label="Remove item"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="cart-dropdown__divider"></div>

          <div className="cart-dropdown__subtotal">
            <span>SUBTOTAL :</span>
            <span className="amount">₨{subtotal.toLocaleString()}</span>
          </div>

          <div className="cart-dropdown__actions">
            <Link href="/cart" className="cart-dropdown__btn cart-dropdown__btn--view">
              VIEW CART
            </Link>
            <Link href="/checkout" className="cart-dropdown__btn cart-dropdown__btn--checkout">
              CHECKOUT
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
