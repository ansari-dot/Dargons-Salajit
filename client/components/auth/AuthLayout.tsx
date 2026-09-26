'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Leaf, ShieldCheck, Heart, Sparkles, ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, eyebrow, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="auth-split-wrapper">
      {/* ── Left Side: Hero Visual Panel ── */}
      <div className="auth-split-hero">
        {/* Background Image Overlay */}
        <div className="auth-hero-bg">
          <Image
            src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
            alt="Palses Natural Care"
            fill
            priority
          />
        </div>

        <div className="auth-hero-content">
          {/* Top Logo */}
          <Link href="/" className="auth-hero-logo">
            <Image
              src="/logo.png"
              alt="Palses Pure Wellness"
              width={160}
              height={70}
              priority
            />
          </Link>

          {/* Accent Line */}
          <div className="auth-hero-accent-line" />

          {/* Main Headline */}
          <h1 className="auth-hero-title">
            Natural <br />
            Care for a <br />
            Healthier You
          </h1>

          <p className="auth-hero-subtitle">
            Premium herbal products for a better, balanced and natural lifestyle.
          </p>

          {/* Feature Badges with Professional Lucide Icons */}
          <div className="auth-hero-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <Leaf className="w-5 h-5 text-[#636830]" />
              </div>
              <span className="auth-feature-text">100% Natural</span>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <ShieldCheck className="w-5 h-5 text-[#636830]" />
              </div>
              <span className="auth-feature-text">Trusted Quality</span>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <Heart className="w-5 h-5 text-[#636830]" />
              </div>
              <span className="auth-feature-text">A Healthier Tomorrow</span>
            </div>
          </div>
        </div>

        {/* Bottom Decorative Stamp & Tagline */}
        <div className="auth-hero-footer">
          <div className="auth-hero-tagline">
            <div style={{ width: '24px', height: '1.5px', backgroundColor: '#636830' }} />
            <span>PURE INGREDIENTS. REAL RESULTS.</span>
          </div>

          <div className="auth-hero-stamp" title="Certified Pure Herbal Product">
            <Sparkles className="w-5 h-5 text-[#636830]" />
          </div>
        </div>
      </div>

      {/* ── Right Side: Form Container ── */}
      <div className="auth-split-form">
        {/* Top Header Link */}
        <div className="auth-form-top-link">
          <Link href="/" className="auth-back-link">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Form Main Body */}
        <div className="auth-form-box">
          <span className="auth-eyebrow">{eyebrow}</span>
          <h2 className="auth-main-heading">{title}</h2>
          <p className="auth-subheading">{subtitle}</p>

          {children}
        </div>

        {/* Footer Copy */}
        <div className="auth-footer-copy">
          &copy; {new Date().getFullYear()} Palses Pure Wellness. All rights reserved.
        </div>
      </div>
    </div>
  );
}
