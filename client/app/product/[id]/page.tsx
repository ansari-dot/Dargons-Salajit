'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/product/ProductCard';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { addToCart, addToCartDb } from '@/lib/redux/slices/cartSlice';
import { toggleWishlist, toggleWishlistDb } from '@/lib/redux/slices/wishlistSlice';
import { fetchStorefrontProductByIdOrSlug, fetchStorefrontProducts } from '@/lib/redux/slices/productSlice';

export default function ProductDetailPage({ params }: { params?: { id?: string } }) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const productId = params?.id || '1';

  const products = useAppSelector((state) => state.products.products);
  const selectedProductFromStore = useAppSelector((state) => state.products.selectedProduct);
  const loading = useAppSelector((state) => state.products.loading);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // Fetch product from backend REST API
  useEffect(() => {
    if (productId) {
      dispatch(fetchStorefrontProductByIdOrSlug(productId));
      dispatch(fetchStorefrontProducts());
    }
  }, [dispatch, productId]);

  // Product resolution: selectedProduct > found from products list > fallback
  const product = selectedProductFromStore || products.find((p) => p.id === productId || (p as any).slug === productId) || {
    id: productId,
    name: 'SHILAJIT SURP 50ML',
    sku: 'SKU-SURP-50ML',
    price: 2500,
    oldPrice: 3500,
    image: '/shilajit-surp.png',
    galleryImages: ['/shilajit-surp.png', '/popular_gold_jar.png', '/popular_drops.png', '/popular_capsules.png'],
    category: 'Resin',
    vendor: 'Himalayan Surp',
    size: 'Medium',
    description: 'Pure Himalayan Shilajit Extract 50ml tube. Rich in 85+ trace minerals and fulvic acid for maximum vitality.',
    fullDescription: 'Purified at 18,000 feet in the Himalayan peaks, Shilajit Surp is a natural powerhouse formulation loaded with fulvic acid, humic minerals, and 85+ bioavailable trace nutrients.',
    featuresList: [
      '100% Pure High-Altitude Himalayan Extraction',
      '85+ Ionic Trace Minerals & Fulvic Acid',
      'Boosts Cellular ATP & Natural Stamina',
      'Third-Party Lab Tested for Heavy Metals & Purity',
    ],
    tags: ['Shilajit', 'Resin', 'Pure', 'Energy', 'Vitality'],
    rating: 5,
    stockQuantity: 50,
  };

  const isWishlisted = wishlistItems.some((item) => item.id === product.id);

  // Gallery Images resolution
  const galleryImages = product.galleryImages && product.galleryImages.length > 0
    ? product.galleryImages
    : [product.image || '/shilajit-surp.png', '/popular_gold_jar.png', '/popular_drops.png'];

  const [activeImage, setActiveImage] = useState(product.image || galleryImages[0]);

  useEffect(() => {
    if (product.image) {
      setActiveImage(product.image);
    } else if (galleryImages.length > 0) {
      setActiveImage(galleryImages[0]);
    }
  }, [product.image]);

  // Options & Tabs state
  const [selectedWeight, setSelectedWeight] = useState(product.size && product.size !== 'Medium' ? product.size : '50g');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'nameUpdate' | 'tags'>('description');

  const handleAddToCart = () => {
    if (isAuthenticated) {
      dispatch(addToCartDb({ id: String(product.id), quantity, size: selectedWeight }));
    } else {
      for (let i = 0; i < quantity; i++) {
        dispatch(
          addToCart({
            id: String(product.id),
            name: product.name,
            price: product.price,
            image: activeImage || product.image,
          })
        );
      }
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  const recommendedProducts = products.filter((p) => p.id !== product.id).slice(0, 4);

  // Features list resolution: specific features if entered in admin, else general benefits
  const featuresList = (product.featuresList && product.featuresList.length > 0)
    ? product.featuresList
    : [
      '100% Pure High-Altitude Himalayan Extraction',
      '85+ Ionic Trace Minerals & Fulvic Acid Matrix',
      'Boosts Cellular ATP Energy & Peak Stamina',
      'Third-Party Lab Tested for Purity & Heavy Metals',
      'Zero Chemical Additives, Fillers, or Preservatives',
    ];

  const tagsList = (product.tags && product.tags.length > 0)
    ? product.tags
    : ['Organic', 'Natural', 'Salajeet', 'Resin', 'Extract', 'Premium'];

  return (
    <div className="product-detail-page">
      {/* ── Top Breadcrumb ── */}
      <div className="shop-top-breadcrumb">
        <div className="shop-top-breadcrumb__container">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <Link href="/shop">Products</Link>
          <span className="sep">/</span>
          <span className="current">{product.name}</span>
        </div>
      </div>

      <div className="product-detail-container">
        {/* ── Main Product 2-Column Section ── */}
        <div className="product-detail-main">
          {/* Left Gallery Column with Multiple Images */}
          <div className="product-gallery">
            <div className="product-gallery__thumbs-col">
              <button
                type="button"
                className="product-gallery__arrow"
                aria-label="Previous image"
                onClick={() => {
                  const idx = galleryImages.indexOf(activeImage);
                  setActiveImage(galleryImages[(idx - 1 + galleryImages.length) % galleryImages.length]);
                }}
              >
                ▲
              </button>

              {galleryImages.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  className={`product-gallery__thumb-btn ${activeImage === img ? 'active' : ''}`}
                  onClick={() => setActiveImage(img)}
                >
                  <img
                    src={img}
                    alt={`Product image ${index + 1}`}
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                </button>
              ))}

              <button
                type="button"
                className="product-gallery__arrow"
                aria-label="Next image"
                onClick={() => {
                  const idx = galleryImages.indexOf(activeImage);
                  setActiveImage(galleryImages[(idx + 1) % galleryImages.length]);
                }}
              >
                ▼
              </button>
            </div>

            <div className="product-gallery__main-box">
              <img
                src={activeImage || product.image || '/shilajit-surp.png'}
                alt={product.name}
                className="product-gallery__main-img"
                style={{ maxHeight: '420px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
              />
            </div>
          </div>

          {/* Right Product Details Column */}
          <div className="product-info-col">
            <h1 className="product-info__title">{product.name}</h1>

            <div className="product-info__divider-top" />

            <div className="product-info__price" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>₨{product.price.toLocaleString()}.00</span>
              {product.oldPrice && (
                <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '1rem', fontWeight: 400 }}>
                  ₨{product.oldPrice.toLocaleString()}.00
                </span>
              )}
            </div>

            <div className="product-info__meta">
              <div className="product-info__meta-item">
                <strong>Brand:</strong> {product.vendor || 'Himalayan Surp'}
              </div>
              {product.sku && (
                <div className="product-info__meta-item">
                  <strong>SKU:</strong> <span style={{ fontFamily: 'monospace' }}>{product.sku}</span>
                </div>
              )}
              <div className="product-info__meta-item">
                <strong>Availability:</strong>{' '}
                <span className="product-info__meta-stock" style={{ color: (product.stockQuantity ?? 50) > 0 ? '#4e7a27' : '#d90429' }}>
                  {(product.stockQuantity ?? 50) > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>

            <p className="product-info__summary">
              {product.description || product.fullDescription || 'Pure Himalayan Shilajit resin extract formulation loaded with 85+ trace minerals and fulvic acid.'}
            </p>

            {/* Weight / Size Selector in Grams or ML */}
            {(() => {
              const weightOptions = (product as any).weightOptions || (product as any).weight_options;
              let weightsList = ['30g', '50g', '100g'];
              if (Array.isArray(weightOptions) && weightOptions.length > 0) {
                weightsList = weightOptions;
              } else if (product.size && product.size.toLowerCase().includes('ml')) {
                weightsList = ['50ml', '100ml'];
              } else if (product.size && !['Small', 'Medium', 'Large'].includes(product.size)) {
                weightsList = [product.size, '30g', '50g', '100g'].filter((v, i, a) => a.indexOf(v) === i);
              }

              return (
                <div className="product-variant-section">
                  <span className="product-variant__label">Pack Weight (Grams / ML)</span>
                  <div className="product-variant__options">
                    {weightsList.map((w) => (
                      <button
                        key={w}
                        type="button"
                        className={`product-variant__btn ${selectedWeight === w ? 'active' : ''}`}
                        onClick={() => setSelectedWeight(w)}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Action Row 1: Quantity + Add To Cart + Wishlist */}
            <div className="product-actions-row1">
              <div className="product-qty-control">
                <button
                  type="button"
                  className="product-qty__btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </button>
                <span className="product-qty__val">{quantity}</span>
                <button
                  type="button"
                  className="product-qty__btn"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>

              <button type="button" className="product-add-cart-btn" onClick={handleAddToCart}>
                ADD TO CART
              </button>

              <button
                type="button"
                className={`product-wishlist-btn ${isWishlisted ? 'active' : ''}`}
                aria-label="Add to Wishlist"
                onClick={() => {
                  if (isAuthenticated && product) {
                    dispatch(toggleWishlistDb(product));
                  } else if (product) {
                    dispatch(toggleWishlist(product));
                  }
                }}
              >
                <svg viewBox="0 0 24 24" fill={isWishlisted ? '#d90429' : 'none'} stroke="currentColor" strokeWidth="1.5" style={{ width: '18px', height: '18px' }}>
                  <path d="M12 21C12 21 3 13.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 12 5C12.09 3.81 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 13.5 12 21 12 21Z" />
                </svg>
              </button>
            </div>

            {/* Action Row 2: Buy It Now + Social Share */}
            <div className="product-actions-row2">
              <button type="button" className="product-buy-now-btn" onClick={handleBuyNow}>
                BUY IT NOW
              </button>

              <div className="product-social-share">
                <button type="button" className="product-social-btn" aria-label="Share on Facebook">f</button>
                <button type="button" className="product-social-btn" aria-label="Share on Twitter">
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '12px', height: '12px' }}>
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                  </svg>
                </button>
                <button type="button" className="product-social-btn" aria-label="Share on Pinterest">p</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs Section ── */}
        <div className="product-tabs-section">
          <div className="product-tabs-header">
            <button
              type="button"
              className={`product-tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Product Description
            </button>
            <button
              type="button"
              className={`product-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({product.rating || 5.0} ★)
            </button>
            <button
              type="button"
              className={`product-tab-btn ${activeTab === 'nameUpdate' ? 'active' : ''}`}
              onClick={() => setActiveTab('nameUpdate')}
            >
              Specifications
            </button>
            <button
              type="button"
              className={`product-tab-btn ${activeTab === 'tags' ? 'active' : ''}`}
              onClick={() => setActiveTab('tags')}
            >
              Tags
            </button>
          </div>

          <div className="product-tab-content-box">
            {activeTab === 'description' && (
              <div>
                <p style={{ marginBottom: '16px', lineHeight: '1.8' }}>
                  {product.fullDescription || product.description || 'Redefine your daily energy with pure Himalayan Shilajit extract.'}
                </p>

                <strong style={{ color: '#333', fontSize: '0.88rem', display: 'block', marginBottom: '8px' }}>
                  Key Product Features & Benefits:
                </strong>
                <ul className="product-features-list">
                  {featuresList.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#333', marginBottom: '12px' }}>
                  Customer Reviews ({product.rating || 5.0} ★★★★★)
                </h4>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  "Exceptional purity and quality! Delivered fast and beautifully packaged." - Verified Customer
                </p>
              </div>
            )}

            {activeTab === 'nameUpdate' && (
              <div>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  Category: {product.category || 'Resin'} | Vendor: {product.vendor || 'Himalayan Surp'} | Pack Weight: {product.size && product.size !== 'Medium' ? product.size : '50g'} | SKU: {product.sku || 'N/A'}
                </p>
              </div>
            )}

            {activeTab === 'tags' && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {tagsList.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '4px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '16px',
                      fontSize: '0.78rem',
                      color: '#555',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── "We Also Recommend" Section ── */}
        <div className="product-recommend-section">
          <h2 className="product-recommend-title">We Also Recommend</h2>
          <div className="product-recommend-grid">
            {recommendedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
