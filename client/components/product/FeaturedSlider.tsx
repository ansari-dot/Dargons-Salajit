'use client';

import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchStorefrontProducts } from '@/lib/redux/slices/productSlice';

export default function FeaturedSlider({ title = 'Featured products' }: { title?: string }) {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.products.products);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleItems, setVisibleItems] = useState(4);

  useEffect(() => {
    dispatch(fetchStorefrontProducts());
  }, [dispatch]);

  // Responsive items count calculation
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 560) {
        setVisibleItems(1);
      } else if (window.innerWidth < 840) {
        setVisibleItems(2);
      } else if (window.innerWidth < 1100) {
        setVisibleItems(3);
      } else {
        setVisibleItems(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, products.length - visibleItems);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
  };

  const gap = 24; // px

  return (
    <section className="featured" id="featuredProducts">
      <h2 className="featured__title">{title}</h2>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#666', fontSize: '0.95rem' }}>
          <p style={{ fontWeight: 700, color: '#333', margin: '0 0 4px 0' }}>No Products Found</p>
          <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>
            There are currently no products in the catalog. Add products from the Admin Panel to display them here.
          </p>
        </div>
      ) : (
        <div
          className="featured__wrapper"
          style={{
            position: 'relative',
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 56px',
          }}
        >
        {/* Left Arrow Button */}
        {products.length > visibleItems && (
          <button
            className="featured__arrow featured__arrow--prev"
            aria-label="Previous products"
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              cursor: 'pointer',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 18L9 12L15 6" />
            </svg>
          </button>
        )}

        {/* Viewport & Slider Track */}
        <div className="featured__viewport" style={{ overflow: 'hidden', width: '100%' }}>
          <div
            className="featured__track"
            style={{
              display: 'flex',
              gap: `${gap}px`,
              transition: 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
              transform: `translateX(-${currentIndex * (100 / visibleItems)}%)`,
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  flex: `0 0 calc((100% - ${(visibleItems - 1) * gap}px) / ${visibleItems})`,
                  minWidth: 0,
                }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow Button */}
        {products.length > visibleItems && (
          <button
            className="featured__arrow featured__arrow--next"
            aria-label="Next products"
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              cursor: 'pointer',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 6L15 12L9 18" />
            </svg>
          </button>
        )}
      </div>
      )}
    </section>
  );
}
