'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ShopSidebar from '@/components/shop/ShopSidebar';
import ShopToolbar from '@/components/shop/ShopToolbar';
import ProductCard from '@/components/product/ProductCard';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchStorefrontProducts, setCategory } from '@/lib/redux/slices/productSlice';

export default function ShopPage() {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.products.products);
  const activeCategory = useAppSelector((state) => state.products.activeCategory);

  useEffect(() => {
    dispatch(fetchStorefrontProducts());
  }, [dispatch]);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortByState, setSortByState] = useState<string>('alphabetical');
  const [selectedVendor, setSelectedVendor] = useState<string>('All Brands');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);

  const handleToggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    setCurrentPage(1);
  };

  const handleSelectVendor = (vendor: string) => {
    setSelectedVendor(vendor);
    setCurrentPage(1);
  };

  const handlePriceChange = (min: number, max: number) => {
    setMinPrice(min);
    setMaxPrice(max);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    dispatch(setCategory('All'));
    setSelectedVendor('All Brands');
    setSelectedSizes([]);
    setMinPrice(0);
    setMaxPrice(10000);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1);
  };

  const handleSortByChange = (sort: string) => {
    setSortByState(sort);
    setCurrentPage(1);
  };

  // ── Dynamic Product Filtering ──
  let filtered = products.filter((product) => {
    const matchesCategory =
      activeCategory === 'All' || product.category.toLowerCase() === activeCategory.toLowerCase();

    const matchesVendor =
      selectedVendor === 'All Brands' ||
      selectedVendor === 'All Vendors' ||
      product.vendor === selectedVendor;

    const matchesSize =
      selectedSizes.length === 0 || (product.size && selectedSizes.includes(product.size));

    const matchesPrice =
      product.price >= minPrice && product.price <= maxPrice;

    return matchesCategory && matchesVendor && matchesSize && matchesPrice;
  });

  // ── Dynamic Sorting ──
  if (sortByState === 'alphabetical') {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortByState === 'low-to-high') {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  } else if (sortByState === 'high-to-low') {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  }

  // ── Dynamic Pagination ──
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const displayedProducts = filtered.slice(startIndex, endIndex);

  return (
    <div className="shop-page-wrapper">
      {/* ── Top Breadcrumb Bar ── */}
      <div className="shop-top-breadcrumb">
        <div className="shop-top-breadcrumb__container">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <span className="current">Products Catalog</span>
        </div>
      </div>

      {/* ── Main Layout Container ── */}
      <div className="shop-page-container">
        <div className="shop-grid-layout">
          {/* ── Left Sidebar (Dynamic Filters) ── */}
          <ShopSidebar
            selectedSizes={selectedSizes}
            onToggleSize={handleToggleSize}
            selectedVendor={selectedVendor}
            onSelectVendor={handleSelectVendor}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={handlePriceChange}
            onResetFilters={handleResetFilters}
          />

          {/* ── Right Content Area ── */}
          <div>
            {/* Top Promotional Hero Banner */}
            <div className="shop-top-banner">
              <Image
                src="/shop-banner-orange.png"
                alt="Palses Pure Salajeet Products"
                width={960}
                height={200}
                className="shop-top-banner__img"
                priority
              />
            </div>

            {/* Page Title & Active Filter Summary */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h1 className="shop-page-title" style={{ margin: 0 }}>Products Catalog</h1>
              <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>
                {totalItems} {totalItems === 1 ? 'Product Available' : 'Products Available'}
              </span>
            </div>

            {/* View Mode & Sorting Control Toolbar */}
            <ShopToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              sortBy={sortByState}
              onSortByChange={handleSortByChange}
            />

            {/* Products Listing */}
            {displayedProducts.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 20px', 
                background: '#fff', 
                borderRadius: '8px', 
                border: '1px solid #eee', 
                color: '#666', 
                fontSize: '0.95rem' 
              }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#333', marginBottom: '8px' }}>
                  {products.length === 0 ? 'No Products Found in Database' : 'No products match your active filter criteria'}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#777', marginBottom: '20px' }}>
                  {products.length === 0 
                    ? 'The product catalog is currently empty. Add products from the Admin Panel to show them here.'
                    : 'Try changing your brand, size, price range, or category filters.'}
                </p>
                {products.length > 0 && (
                  <button
                    onClick={handleResetFilters}
                    style={{
                      padding: '10px 20px',
                      background: '#636830',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'shop-product-grid' : 'shop-product-list'}>
                  {displayedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} viewMode={viewMode} />
                  ))}
                </div>

                {/* ── Pagination Bar ── */}
                <div className="shop-pagination">
                  <div className="shop-pagination__buttons">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`shop-pagination__btn ${validCurrentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    {validCurrentPage < totalPages && (
                      <button
                        type="button"
                        className="shop-pagination__btn shop-pagination__btn--next"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        aria-label="Next page"
                      >
                        &gt;
                      </button>
                    )}
                  </div>
                  <div className="shop-pagination__info">
                    Showing {totalItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalItems} items
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
