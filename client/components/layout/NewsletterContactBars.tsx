'use client';

import React from 'react';

export default function NewsletterContactBars() {
  return (
    <div className="bottom-bars">
      {/* ── 1. Newsletter & Social Bar ── */}
      <section className="newsletter-bar">
        <div className="newsletter-bar__container">
          {/* Social Icons */}
          <div className="newsletter-bar__socials">
            <a href="#" aria-label="Facebook" className="newsletter-bar__social-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a href="#" aria-label="Twitter" className="newsletter-bar__social-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
              </svg>
            </a>
            <a href="#" aria-label="Pinterest" className="newsletter-bar__social-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.42 7.63 11.17-.11-.95-.2-2.41.04-3.45.22-.94 1.4-5.94 1.4-5.94s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.02 0 1.52.77 1.52 1.69 0 1.03-.66 2.57-.99 3.99-.28 1.19.6 2.16 1.77 2.16 2.13 0 3.77-2.25 3.77-5.49 0-2.87-2.06-4.88-5.01-4.88-3.41 0-5.42 2.56-5.42 5.2 0 1.03.4 2.13.89 2.73a.36.36 0 0 1 .08.34c-.1.4-.3.1.23-.4.18-.08.33-.14.28-.5-.24-1.02-.75-3.32-2.07-3.32-1.68 0-3.05 1.37-3.05 3.05 0 .67.22 1.3.6 1.81z" />
              </svg>
            </a>
            <a href="#" aria-label="Google Plus" className="newsletter-bar__social-icon">
              <span className="gplus-text">G+</span>
            </a>
            <a href="#" aria-label="Instagram" className="newsletter-bar__social-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="#" aria-label="YouTube" className="newsletter-bar__social-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 1.96A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.37z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#fff" />
              </svg>
            </a>
          </div>

          <div className="newsletter-bar__divider"></div>

          {/* Form & Label */}
          <div className="newsletter-bar__form-group">
            <span className="newsletter-bar__label">Sign up for our Newsletter!</span>
            <form className="newsletter-bar__form" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder=""
                className="newsletter-bar__input"
                required
              />
              <button type="submit" className="newsletter-bar__btn">
                <span>SIGN UP</span>
                <span className="arrow">&rarr;</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── 2. Contact Info Bar ── */}
      <section className="contact-info-bar">
        <div className="contact-info-bar__container">
          {/* Column 1: Phone */}
          <div className="contact-info-bar__item">
            <div className="contact-info-bar__icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div className="contact-info-bar__details">
              <span className="contact-info-bar__label">DO YOU HAVE A QUESTION?</span>
              <span className="contact-info-bar__value contact-info-bar__value--phone">+0123 456 789</span>
            </div>
          </div>

          {/* Column 2: Offer Email */}
          <div className="contact-info-bar__item">
            <div className="contact-info-bar__icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div className="contact-info-bar__details">
              <span className="contact-info-bar__label">OFFER QUESTION?</span>
              <a href="mailto:Contact@posthemes.com" className="contact-info-bar__value">Contact@posthemes.com</a>
            </div>
          </div>

          {/* Column 3: Support Email */}
          <div className="contact-info-bar__item">
            <div className="contact-info-bar__icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
                <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
                <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
                <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
                <line x1="14.83" y1="9.17" x2="18.36" y2="5.64" />
                <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
              </svg>
            </div>
            <div className="contact-info-bar__details">
              <span className="contact-info-bar__label">SUPPORT QUESTION?</span>
              <a href="mailto:support@posthemes.com" className="contact-info-bar__value">support@posthemes.com</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
