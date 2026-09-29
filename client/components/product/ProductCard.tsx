'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { addToCart, addToCartDb } from '@/lib/redux/slices/cartSlice';
import { toggleWishlist, toggleWishlistDb } from '@/lib/redux/slices/wishlistSlice';
import { setQuickViewProduct } from '@/lib/redux/slices/uiSlice';
import { Product } from '@/lib/redux/slices/productSlice';
import { formatAmount } from '@/lib/utils/currency';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const currency = useAppSelector((state) => state.ui.selectedCurrency);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isWishlisted = wishlistItems.some((item) => String(item.id) === String(product.id));

  const isList = viewMode === 'list';
  const productUrl = `/product/${product.id}`;

  return (
    <article className={`product-card ${isList ? 'product-card--list' : ''}`}>
      <div className="product-card__image-wrap">
        <Link href={productUrl} style={{ display: 'block', width: '100%', height: '100%' }}>
          <Image
            src={product.image}
            alt={product.name}
            width={240}
            height={240}
            className="product-card__img"
            style={{
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'block',
              margin: '0 auto',
              transform: 'translateX(18px)',
            }}
          />
        </Link>
        <div className="product-card__overlay">
          <button
            type="button"
            className="product-card__quickview"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dispatch(setQuickViewProduct(product));
            }}
          >
            QUICK VIEW
          </button>
        </div>
      </div>

      <div className="product-card__info">
        <h3 className="product-card__name">
          <Link href={productUrl} style={{ color: 'inherit', textDecoration: 'none' }}>
            {product.name}
          </Link>
        </h3>
        {product.description && isList && (
          <p className="product-card__description">{product.description}</p>
        )}
        <p className="product-card__price">
          {product.oldPrice && (
            <span style={{ textDecoration: 'line-through', color: '#999999', marginRight: '6px', fontWeight: 400 }}>
              {formatAmount(product.oldPrice, currency)}
            </span>
          )}
          <span style={{ color: 'var(--olive, #636830)', fontWeight: 600 }}>
            {formatAmount(product.price, currency)}
          </span>
        </p>

        <div className="product-card__bottom product-card__bottom--with-icons">
          <button
            className={`product-card__icon-btn ${isWishlisted ? 'active' : ''}`}
            aria-label="Add to wishlist"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isAuthenticated) {
                dispatch(toggleWishlistDb(product));
              } else {
                dispatch(toggleWishlist(product));
              }
            }}
            style={{ color: isWishlisted ? '#d90429' : 'inherit' }}
          >
            <svg viewBox="0 0 24 24" fill={isWishlisted ? '#d90429' : 'none'} stroke="currentColor" strokeWidth="1.5">
              <path d="M12 21C12 21 3 13.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 12 5C12.09 3.81 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 13.5 12 21 12 21Z" />
            </svg>
          </button>

          <button
            className="product-card__cart"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isAuthenticated) {
                dispatch(addToCartDb({ id: String(product.id), quantity: 1 }));
              } else {
                dispatch(
                  addToCart({
                    id: String(product.id),
                    name: product.name,
                    price: product.price,
                    image: product.image,
                  })
                );
              }
            }}
          >
            ADD TO CART
          </button>

          <button
            className="product-card__icon-btn"
            aria-label="Quick search"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dispatch(setQuickViewProduct(product));
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20L16.5 16.5" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
