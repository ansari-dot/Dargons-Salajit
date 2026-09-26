'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import FeaturedSlider from '@/components/product/FeaturedSlider';
import NewArrivals from '@/components/product/NewArrivals';
import DealDays from '@/components/product/DealDays';
import BrandLogos from '@/components/product/BrandLogos';
import HomeBlogPosts from '@/components/product/HomeBlogPosts';

export default function HomePage() {
  return (
    <>
      {/* ── Hero Section ── */}
      <section className="hero">
        <Image
          src="/herosection.png"
          alt="Premium Salajeet Background"
          fill
          className="hero__banner"
          priority
        />
        <div className="hero__content">
          <div className="hero__eyebrow">
            <span>Pure. Natural. Powerful.</span>
            <span className="hero__eyebrow-line"></span>
          </div>

          <h1 className="hero__title">
            <span className="hero__title-premium">Premium</span>
            <span className="hero__title-salajeet">Salajeet</span>
          </h1>

          <p className="hero__description">
            Sourced from the highest mountains, our pure Salajeet is a natural powerhouse of minerals and nutrients,
            crafted for your strength, energy and overall well-being.
          </p>

          <Link href="/shop" className="hero__cta">
            View Collection
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
              <path d="M5 12H19M19 12L13 6M19 12L13 18" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Value Proposition / Features Bar ── */}
      <section className="features-bar">
        <div className="features-bar__container">
          <div className="features-bar__item">
            <div className="features-bar__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M1 3H15V16H1Z" />
                <path d="M15 8H19L22 12V16H15V8Z" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div className="features-bar__content">
              <h3 className="features-bar__title">Free Shipping</h3>
              <p className="features-bar__text">Free nationwide delivery on orders above ₨2,500</p>
            </div>
          </div>

          <div className="features-bar__item">
            <div className="features-bar__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M21 12A9 9 0 0 0 6 5.3L3 8" />
                <path d="M3 3V8H8" />
                <path d="M3 12A9 9 0 0 0 18 18.7L21 16" />
                <path d="M21 21V16H16" />
              </svg>
            </div>
            <div className="features-bar__content">
              <h3 className="features-bar__title">Refund Policy</h3>
              <p className="features-bar__text">Returns made easy – send back within 30 days</p>
            </div>
          </div>

          <div className="features-bar__item">
            <div className="features-bar__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              </svg>
            </div>
            <div className="features-bar__content">
              <h3 className="features-bar__title">Customer Support</h3>
              <p className="features-bar__text">24/7 dedicated support team</p>
            </div>
          </div>

          <div className="features-bar__item">
            <div className="features-bar__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="8" width="18" height="4" rx="1" />
                <path d="M12 8V21" />
              </svg>
            </div>
            <div className="features-bar__content">
              <h3 className="features-bar__title">Gift Packaging</h3>
              <p className="features-bar__text">Premium organic wooden box packaging</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Products Slider ── */}
      <FeaturedSlider title="Featured products" />

      {/* ── New Arrivals Component ── */}
      <NewArrivals />

      {/* ── Dual Promo Banners (Matching Reference Image) ── */}
      <section className="dual-promo-section">
        <div className="dual-promo-container">
          <div className="dual-banner">
            <Link href="/shop">
              <Image
                src="/shop-banner-orange.png"
                alt="We love Orange Cream"
                width={680}
                height={220}
                className="dual-banner__img"
              />
            </Link>
          </div>

          <div className="dual-banner--right">
            <Link href="/shop" style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}>
              <div className="dual-banner--right__content">
                <h3 className="dual-banner--right__title">Organic cream</h3>
                <span className="dual-banner--right__subtitle">SALE UPTO 50% OFF</span>
              </div>
              <Image
                src="/shilajit-surp.png"
                alt="Organic cream Shilajit Surp"
                width={180}
                height={180}
                className="dual-banner--right__prod-img"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Deal of the Days Section ── */}
      <DealDays />

      {/* ── Continuous Infinite Brand Logos Marquee ── */}
      <BrandLogos />

      {/* ── Home Blog Posts Section (Matching Reference Screenshot) ── */}
      <HomeBlogPosts />
    </>
  );
}
