'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NewsletterContactBars from './NewsletterContactBars';

export default function Footer() {
  return (
    <>
      {/* ── Top Newsletter & Contact Info Bars ── */}
      <NewsletterContactBars />

      {/* ── Main Dark Footer ── */}
      <footer className="footer">
        <div className="footer__container">
          <div className="footer__col">
            <Link href="/" className="footer__logo">
              <Image
                src="/logo.png"
                alt="Palses Pure Salajeet"
                width={140}
                height={70}
                style={{ objectFit: 'contain' }}
              />
            </Link>
            <p className="footer__text">
              Pure Himalayan Salajeet sourced from organic mountain rocks. Natural vitality, energy, and peak wellness.
            </p>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Quick Links</h4>
            <ul className="footer__links">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/about">About Us</Link>
              </li>
              <li>
                <Link href="/shop">Shop Collection</Link>
              </li>
              <li>
                <Link href="/blogs">Blogs & Articles</Link>
              </li>
              <li>
                <Link href="/contact">Contact Us</Link>
              </li>
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Customer Care</h4>
            <ul className="footer__links">
              <li>
                <Link href="/cart">Shopping Cart</Link>
              </li>
              <li>
                <Link href="/checkout">Checkout</Link>
              </li>
              <li>
                <Link href="/contact">Support & FAQs</Link>
              </li>
              <li>
                <Link href="/about">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          <div className="footer__col">
            <h4 className="footer__heading">Contact Info</h4>
            <p className="footer__text">
              <i className="fa-solid fa-phone" style={{ marginRight: '8px' }}></i> +92 300 1234567
            </p>
            <p className="footer__text">
              <i className="fa-solid fa-envelope" style={{ marginRight: '8px' }}></i> info@palses.com
            </p>
            <p className="footer__text">
              <i className="fa-solid fa-location-dot" style={{ marginRight: '8px' }}></i> Skardu, Gilgit-Baltistan, Pakistan
            </p>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} Palses Pure Salajeet. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
