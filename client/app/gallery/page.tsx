'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface GalleryItem {
  id: number | string;
  title: string;
  category: string;
  image_url: string;
  caption?: string;
  display_order?: number;
  is_active?: boolean;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/gallery?active=true');
      if (!res.ok) throw new Error('Failed to load gallery items');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.warn('Gallery API fetch error:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Derive dynamic categories list
  const dynamicCategories = ['All', ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))];

  const filteredItems = activeCategory === 'All'
    ? items
    : items.filter((item) => item.category === activeCategory);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : filteredItems.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! < filteredItems.length - 1 ? prev! + 1 : 0));
  };

  const formatImageUrl = (url: string) => {
    if (!url) return '/product.png';
    if (url.startsWith('http') || url.startsWith('/')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="gallery-page">
      {/* ── Top Breadcrumb Bar ── */}
      <div className="shop-top-breadcrumb">
        <div className="shop-top-breadcrumb__container">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <span className="current">Gallery</span>
        </div>
      </div>

      {/* ── Hero Banner ── */}
      <section className="gallery-hero-banner">
        <div className="gallery-hero__content">
          <span className="gallery-hero__eyebrow">PURE HIMALAYAN GOODNESS</span>
          <h1 className="gallery-hero__heading">Our Showcase Gallery</h1>
          <p className="gallery-hero__desc">
            Explore the purity, nature, and authentic essence of Salajit through our official gallery.
            From high-altitude sourcing in the Himalayas to our laboratory-tested final products.
          </p>
        </div>
      </section>

      {/* ── Category Filter Pills ── */}
      <div className="gallery-filter-bar">
        {dynamicCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`gallery-filter-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(cat);
              setLightboxIndex(null);
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── 4-Column Image Grid ── */}
      <div className="gallery-grid-container">
        {loading ? (
          <div className="flex justify-center items-center py-24 text-amber-800 font-medium animate-pulse">
            Loading dynamic showcase gallery...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-white rounded-xl border border-slate-100 max-w-2xl mx-auto shadow-xs">
            <p className="text-lg font-bold text-slate-800">
              {items.length === 0 ? 'No Gallery Photos Found in Database' : `No photos found in category "${activeCategory}"`}
            </p>
            <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              {items.length === 0 
                ? 'The showcase gallery is currently empty. Add showcase photos from the Admin Panel to display them here.' 
                : 'Try selecting a different category filter.'}
            </p>
          </div>
        ) : (
          <div className="gallery-grid">
            {filteredItems.map((item, idx) => (
              <div
                key={item.id}
                className="gallery-card group"
                onClick={() => setLightboxIndex(idx)}
              >
                <img
                  src={formatImageUrl(item.image_url)}
                  alt={item.title}
                  className="gallery-card__img object-cover w-full h-[240px] transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/popular_gold_jar.png';
                  }}
                />
                <div className="gallery-card__overlay">
                  <div className="gallery-card__zoom-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                      <circle cx="11" cy="11" r="7" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </div>
                  <span className="gallery-card__title">{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Fullscreen Lightbox Modal ── */}
      {lightboxIndex !== null && filteredItems[lightboxIndex] && (
        <div className="gallery-lightbox" onClick={() => setLightboxIndex(null)}>
          <button
            type="button"
            className="gallery-lightbox__close"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close Lightbox"
          >
            &times;
          </button>

          <button
            type="button"
            className="gallery-lightbox__nav gallery-lightbox__nav--prev"
            onClick={handlePrev}
            aria-label="Previous Image"
          >
            &#10094;
          </button>

          <div className="gallery-lightbox__content" onClick={(e) => e.stopPropagation()}>
            <img
              src={formatImageUrl(filteredItems[lightboxIndex].image_url)}
              alt={filteredItems[lightboxIndex].title}
              className="gallery-lightbox__img max-h-[75vh] object-contain rounded-lg shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/popular_gold_jar.png';
              }}
            />
            <div className="gallery-lightbox__caption">
              <span className="font-semibold">{filteredItems[lightboxIndex].title}</span>
              {filteredItems[lightboxIndex].category && (
                <span className="ml-2 text-amber-400">({filteredItems[lightboxIndex].category})</span>
              )}
              {filteredItems[lightboxIndex].caption && (
                <p className="text-xs text-slate-300 mt-1">{filteredItems[lightboxIndex].caption}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            className="gallery-lightbox__nav gallery-lightbox__nav--next"
            onClick={handleNext}
            aria-label="Next Image"
          >
            &#10095;
          </button>
        </div>
      )}
    </div>
  );
}
