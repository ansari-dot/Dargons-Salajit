'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* ── Top Breadcrumb Bar ── */}
      <div className="shop-top-breadcrumb">
        <div className="shop-top-breadcrumb__container">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <span className="current">About Us</span>
        </div>
      </div>

      {/* ── 1. Hero Banner ── */}
      <section className="about-hero-banner">
        <div className="about-hero__content">
          <span className="about-eyebrow">ABOUT SALAJIT</span>
          <h1 className="about-hero__heading">Nature’s Power, Our Purpose</h1>
          <p className="about-hero__desc">
            At Salajit, we bring you the purest form of Himalayan Shilajit — a time-honored natural treasure,
            sourced from the highest mountains and crafted for a healthier, stronger you.
          </p>
        </div>
      </section>

      {/* ── 2. Our Story Section ── */}
      <section className="about-story-section">
        <div className="about-story__grid">
          {/* Left Dual Overlapping Images */}
          <div className="about-story__images-wrap">
            <Image
              src="/herosection2.png"
              alt="Hiker in Himalayan Mountains"
              width={600}
              height={340}
              className="about-story__main-img"
              priority
            />
            <div className="about-story__inset-img-wrap">
              <Image
                src="/b1.png"
                alt="Hands holding pure Shilajit resin"
                width={220}
                height={170}
                className="about-story__inset-img"
              />
            </div>
          </div>

          {/* Right Info Content */}
          <div className="about-story__info">
            <span className="about-eyebrow">OUR STORY</span>
            <h2 className="about-story__heading">A Legacy from The Himalayas</h2>
            <p className="about-story__desc">
              Salajit’s journey begins in the pristine, high-altitude regions of the Himalayas, where nature has
              preserved this rare resin for centuries. We discovered the true potential of Shilajit while exploring these
              untouched mountains, and our mission is to make this ancient wellness secret accessible to the world — in
              its purest and most natural form.
            </p>
            <Link href="/shop" className="about-journey-btn">
              <span>Our Journey</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. 4-Value Pillars Bar ── */}
      <section className="about-pillars-section">
        <div className="about-pillars__container">
          {/* Pillar 1 */}
          <div className="about-pillar-item">
            <div className="about-pillar__icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M8 3L4 9l4 4M16 3l4 9-4 4M12 21V3M3 13h18" />
                <path d="M3 20l9-10 9 10" />
              </svg>
            </div>
            <h3 className="about-pillar__title">Pure Himalayan Source</h3>
            <p className="about-pillar__desc">Sourced from 16,000+ ft high-altitude mountains.</p>
          </div>

          {/* Pillar 2 */}
          <div className="about-pillar-item">
            <div className="about-pillar__icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 2C6.5 2 2 6.5 2 12c0 3.5 1.8 6.6 4.5 8.4C8.2 21.6 10 22 12 22s3.8-.4 5.5-1.6c2.7-1.8 4.5-4.9 4.5-8.4 0-5.5-4.5-10-10-10z" />
                <path d="M12 6v12M8 10c2-1 6-1 8 0M8 14c2 1 6 1 8 0" />
              </svg>
            </div>
            <h3 className="about-pillar__title">100% Natural</h3>
            <p className="about-pillar__desc">No fillers, no additives, no shortcuts.</p>
          </div>

          {/* Pillar 3 */}
          <div className="about-pillar-item">
            <div className="about-pillar__icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M10 2v7.5L4.5 18A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3L14 9.5V2" />
                <path d="M8.5 2h7M7 14h10" />
              </svg>
            </div>
            <h3 className="about-pillar__title">Lab Tested</h3>
            <p className="about-pillar__desc">Quality and purity you can trust.</p>
          </div>

          {/* Pillar 4 */}
          <div className="about-pillar-item">
            <div className="about-pillar__icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h3 className="about-pillar__title">Your Wellbeing First</h3>
            <p className="about-pillar__desc">Backed by nature, made for a healthier you.</p>
          </div>
        </div>
      </section>

      {/* ── 4. Why Choose Salajit Section ── */}
      <section className="about-why-section">
        <div className="about-why__grid">
          {/* Left Text & Checklist */}
          <div>
            <span className="about-eyebrow">WHY CHOOSE SALAJIT</span>
            <h2 className="about-why__heading">Purity You Can Feel</h2>
            <p className="about-why__desc">
              We don't just sell Shilajit — we deliver trust. Every batch is carefully sourced, meticulously purified
              and rigorously tested to ensure you get the highest quality and maximum benefits, naturally.
            </p>

            <div className="about-checklist">
              <div className="about-checklist__item">
                <span className="about-checklist__check">&#10003;</span>
                <span>Wild Harvested</span>
              </div>
              <div className="about-checklist__item">
                <span className="about-checklist__check">&#10003;</span>
                <span>Rich in Fulvic Acid</span>
              </div>
              <div className="about-checklist__item">
                <span className="about-checklist__check">&#10003;</span>
                <span>Sustainably Sourced</span>
              </div>
              <div className="about-checklist__item">
                <span className="about-checklist__check">&#10003;</span>
                <span>No Heavy Metals</span>
              </div>
              <div className="about-checklist__item">
                <span className="about-checklist__check">&#10003;</span>
                <span>Lab Certified</span>
              </div>
              <div className="about-checklist__item">
                <span className="about-checklist__check">&#10003;</span>
                <span>Authentic Himalayan Origin</span>
              </div>
            </div>
          </div>

          {/* Right Image Feature */}
          <div className="about-why__image-wrap">
            <Image
              src="/b2.png"
              alt="Pure Himalayan Shilajit Resin"
              width={600}
              height={360}
              className="about-why__img"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
