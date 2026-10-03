'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { setQuickViewProduct } from '@/lib/redux/slices/uiSlice';
import { addToCart } from '@/lib/redux/slices/cartSlice';
import { formatAmount } from '@/lib/utils/currency';

export default function QuickViewModal() {
  const dispatch = useAppDispatch();
  const product = useAppSelector((state) => state.ui.quickViewProduct);
  const currency = useAppSelector((state) => state.ui.selectedCurrency);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleClose = () => {
    dispatch(setQuickViewProduct(null));
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      dispatch(
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        })
      );
    }
    handleClose();
  };

  return (
    <div className="quickview-modal quickview-modal--open">
      <div className="quickview-modal__backdrop" onClick={handleClose} />
      
      <div className="quickview-modal__dialog">
        <button className="quickview-modal__close" onClick={handleClose} aria-label="Close modal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="quickview-modal__body">
          <div className="quickview-modal__image">
            <Image
              src={product.image}
              alt={product.name}
              width={240}
              height={240}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>

          <div className="quickview-modal__details">
            <h2 className="quickview-modal__name">{product.name}</h2>
            
            <div className="quickview-modal__price">
              {formatAmount(
                product.price,
                currency,
                currency === 'USD' ? product.usdPrice : undefined
              )}
            </div>

            <Link href="/shop" className="quickview-modal__features" onClick={handleClose}>
              See all features
            </Link>

            <div className="quickview-modal__cart-row">
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="quickview-modal__qty-input"
              />

              <button className="quickview-modal__add-btn" onClick={handleAddToCart}>
                ADD TO CART
              </button>
            </div>

            <div className="quickview-modal__divider" />

            <p className="quickview-modal__desc">
              {product.description ||
                'The 30-inch Apple Cinema HD Display delivers an amazing 2560 x 1600 pixel resolution. Designed specifically for the creative professional, this display...'}
            </p>

            <div className="quickview-modal__divider" />

            <div className="quickview-modal__share">
              <span className="quickview-modal__share-label">Share this product</span>
              <div className="quickview-modal__share-icons">
                <button type="button" className="quickview-modal__social" aria-label="Share on Facebook">
                  f
                </button>
                <button type="button" className="quickview-modal__social" aria-label="Share on Twitter">
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '12px', height: '12px' }}>
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                  </svg>
                </button>
                <button type="button" className="quickview-modal__social" aria-label="Share on Pinterest">
                  p
                </button>
                <button type="button" className="quickview-modal__social" aria-label="Share on Google Plus">
                  G+
                </button>
                <button type="button" className="quickview-modal__social" aria-label="Share on LinkedIn">
                  in
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
