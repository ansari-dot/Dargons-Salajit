'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { setCategory } from '@/lib/redux/slices/productSlice';

interface ShopSidebarProps {
  selectedSizes: string[];
  onToggleSize: (size: string) => void;
  selectedVendor: string;
  onSelectVendor: (vendor: string) => void;
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  onResetFilters: () => void;
}

export default function ShopSidebar({
  selectedSizes,
  onToggleSize,
  selectedVendor,
  onSelectVendor,
  minPrice,
  maxPrice,
  onPriceChange,
  onResetFilters,
}: ShopSidebarProps) {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.products.products);
  const activeCategory = useAppSelector((state) => state.products.activeCategory);

  // ── 1. Dynamic Category Counts ──
  const categoryList = useMemo(() => {
    const countsMap: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category ? p.category.trim() : 'Resin';
      countsMap[cat] = (countsMap[cat] || 0) + 1;
    });

    const list = [{ name: 'All', count: products.length }];
    Object.keys(countsMap).forEach((catName) => {
      list.push({ name: catName, count: countsMap[catName] });
    });
    return list;
  }, [products]);

  // ── 2. Dynamic Brands / Vendors list with counts ──
  const vendorList = useMemo(() => {
    const countsMap: Record<string, number> = {};
    products.forEach((p) => {
      const v = p.vendor ? p.vendor.trim() : 'Himalayan Surp';
      countsMap[v] = (countsMap[v] || 0) + 1;
    });

    const list = [{ name: 'All Brands', count: products.length }];
    Object.keys(countsMap).forEach((vName) => {
      list.push({ name: vName, count: countsMap[vName] });
    });
    return list;
  }, [products]);

  // ── 3. Dynamic Sizes list with counts ──
  const sizeList = useMemo(() => {
    const countsMap: Record<string, number> = {};
    products.forEach((p) => {
      if (p.size) {
        const s = p.size.trim();
        countsMap[s] = (countsMap[s] || 0) + 1;
      }
    });

    const list = Object.keys(countsMap).map((sName) => ({
      name: sName,
      count: countsMap[sName],
    }));

    if (list.length === 0) {
      return [
        { name: '50g', count: products.length },
        { name: '30g', count: products.length },
        { name: '100g', count: products.length },
        { name: '50ml', count: products.length },
      ];
    }
    return list;
  }, [products]);

  // ── 4. Dynamic Premium Listings (Top 3 rated/popular products) ──
  const premiumListings = useMemo(() => {
    if (!products || products.length === 0) return [];
    return [...products]
      .sort((a, b) => (b.rating || 5) - (a.rating || 5) || b.price - a.price)
      .slice(0, 3);
  }, [products]);

  const hasActiveFilters =
    activeCategory !== 'All' ||
    selectedVendor !== 'All Brands' ||
    selectedSizes.length > 0 ||
    minPrice > 0 ||
    maxPrice < 10000;

  return (
    <aside className="shop-sidebar">
      {/* ── Active Filters Reset Bar ── */}
      {hasActiveFilters && (
        <div 
          className="shop-sidebar__section"
          style={{ 
            background: '#f9fafb', 
            padding: '16px', 
            borderRadius: '8px', 
            border: '1px solid #e5e7eb',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              Active Filters
            </h4>
            <button
              onClick={onResetFilters}
              style={{
                fontSize: '0.75rem',
                color: '#dc2626',
                fontWeight: 700,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Clear All
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {activeCategory !== 'All' && (
              <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                Cat: {activeCategory}
              </span>
            )}
            {selectedVendor !== 'All Brands' && (
              <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                Brand: {selectedVendor}
              </span>
            )}
            {selectedSizes.map((s) => (
              <span key={s} style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                Weight: {s}
              </span>
            ))}
            {(minPrice > 0 || maxPrice < 10000) && (
              <span style={{ fontSize: '0.75rem', background: '#f3e8ff', color: '#6b21a8', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                ₨{minPrice} - ₨{maxPrice}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── 1. Dynamic Categories ── */}
      <div className="shop-sidebar__section">
        <h3 className="shop-sidebar__title">Categories</h3>
        <ul className="shop-sidebar__list">
          {categoryList.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <li key={cat.name} className="shop-sidebar__item">
                <button
                  type="button"
                  onClick={() => dispatch(setCategory(cat.name))}
                  className={`shop-sidebar__link ${isActive ? 'active' : ''}`}
                >
                  <span>{cat.name}</span>
                  <span className="shop-sidebar__count">({cat.count})</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── 2. Dynamic Product Brands / Vendors ── */}
      <div className="shop-sidebar__section">
        <h3 className="shop-sidebar__title">Product Brands</h3>
        <ul className="shop-sidebar__list">
          {vendorList.map((vendor) => {
            const isActive = selectedVendor === vendor.name;
            return (
              <li key={vendor.name} className="shop-sidebar__item">
                <button
                  type="button"
                  onClick={() => onSelectVendor(vendor.name)}
                  className={`shop-sidebar__link ${isActive ? 'active' : ''}`}
                >
                  <span>{vendor.name}</span>
                  <span className="shop-sidebar__count">({vendor.count})</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── 3. Dynamic Price Range Filter ── */}
      <div className="shop-sidebar__section">
        <h3 className="shop-sidebar__title">Price Range</h3>
        <div style={{ padding: '4px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
            <span>₨{minPrice.toLocaleString()}</span>
            <span>₨{maxPrice.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={maxPrice}
            onChange={(e) => onPriceChange(minPrice, Number(e.target.value))}
            style={{ width: '100%', accentColor: '#636830', cursor: 'pointer' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>Min (₨)</label>
              <input
                type="number"
                min="0"
                max={maxPrice}
                value={minPrice}
                onChange={(e) => onPriceChange(Number(e.target.value), maxPrice)}
                style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', color: '#6b7280', fontWeight: 600 }}>Max (₨)</label>
              <input
                type="number"
                min={minPrice}
                max="10000"
                value={maxPrice}
                onChange={(e) => onPriceChange(minPrice, Number(e.target.value))}
                style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Dynamic Pack Weight / Volume ── */}
      <div className="shop-sidebar__section">
        <h3 className="shop-sidebar__title">Pack Weight (g / ml)</h3>
        <div className="shop-sidebar__checkbox-group">
          {sizeList.map((item) => {
            const isChecked = selectedSizes.includes(item.name);
            return (
              <label key={item.name} className="shop-sidebar__checkbox-label">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleSize(item.name)}
                  className="shop-sidebar__checkbox"
                />
                <span className="shop-sidebar__checkbox-custom"></span>
                <span className="shop-sidebar__checkbox-text">
                  {item.name} <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>({item.count})</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── 5. Sale Banner Widget ── */}
      <div className="shop-sidebar__sale-card">
        <Image
          src="/shop-sale-banner.png"
          alt="Sale -25%"
          width={280}
          height={380}
          className="shop-sidebar__sale-img"
        />
        <div className="shop-sidebar__sale-badge">
          <span>Sale <strong>-25%</strong></span>
        </div>
      </div>

      {/* ── 6. Dynamic Premium Listings Widget ── */}
      {premiumListings.length > 0 && (
        <div className="shop-sidebar__section shop-sidebar__premium-section">
          <h3 className="shop-sidebar__title shop-sidebar__title--script">Premium Listings</h3>
          <div className="shop-sidebar__premium-list">
            {premiumListings.map((item) => (
              <Link key={item.id} href={`/product/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="shop-sidebar__premium-item">
                  <div className="shop-sidebar__premium-img-wrap">
                    <Image
                      src={item.image || '/shilajit-surp.png'}
                      alt={item.name}
                      width={56}
                      height={56}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <div className="shop-sidebar__premium-info">
                    <h4 className="shop-sidebar__premium-name">{item.name}</h4>
                    <p className="shop-sidebar__premium-price">₨{item.price.toLocaleString()}.00</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
