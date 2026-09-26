'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 4000);
  };

  const faqs = [
    {
      q: 'How can I verify the purity of Himalayan Shilajit Surp?',
      a: 'Every batch of our Himalayan Shilajit Surp is third-party lab tested for heavy metals, microbial safety, and high fulvic acid content (over 85%). We provide a certified CoA (Certificate of Analysis) with every order.',
    },
    {
      q: 'What is the recommended daily dosage?',
      a: 'We recommend taking a pea-sized amount (approx. 300mg - 500mg) once or twice daily dissolved in warm water, milk, or green tea first thing in the morning.',
    },
    {
      q: 'How long does nationwide shipping take?',
      a: 'Orders are processed within 24 hours. Nationwide express delivery takes 2 to 4 business days. Free shipping is available on orders above ₨2,500.',
    },
    {
      q: 'Do you offer bulk wholesale or private label orders?',
      a: 'Yes, we supply pure mountain resin in bulk quantities for health brands, pharmacies, and exporters. Please contact us via phone or email for custom quotes.',
    },
  ];

  return (
    <div className="contact-page">
      {/* ── Top Breadcrumb Bar ── */}
      <div className="shop-top-breadcrumb">
        <div className="shop-top-breadcrumb__container">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <span className="current">Contact Us</span>
        </div>
      </div>

      {/* ── Hero Title Section ── */}
      <section className="contact-hero">
        <h1 className="contact-hero__title">Get in Touch With Us</h1>
        <p className="contact-hero__subtitle">
          Have questions about our pure Himalayan Salajeet certificates, dosage, or order status?
          Our dedicated team is available 24/7 to assist you.
        </p>
      </section>

      {/* ── 3 Contact Info Cards ── */}
      <section className="contact-cards-grid">
        <div className="contact-card">
          <div className="contact-card__icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <h3 className="contact-card__title">Phone & WhatsApp</h3>
          <a href="tel:+923001234567" className="contact-card__value">+92 300 1234567</a>
          <span className="contact-card__subtext">24/7 Immediate Customer Support</span>
        </div>

        <div className="contact-card">
          <div className="contact-card__icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h3 className="contact-card__title">Email Support</h3>
          <a href="mailto:support@himalayansurp.com" className="contact-card__value">support@himalayansurp.com</a>
          <span className="contact-card__subtext">Response within 2 business hours</span>
        </div>

        <div className="contact-card">
          <div className="contact-card__icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h3 className="contact-card__title">Origins & Headquarters</h3>
          <span className="contact-card__value" style={{ color: '#333' }}>Skardu Valley, GB</span>
          <span className="contact-card__subtext">Authentic High-Altitude Mountain Origin</span>
        </div>
      </section>

      {/* ── Main Contact Form & Map Section ── */}
      <section className="contact-main-grid">
        {/* Left Form Card */}
        <div className="contact-form-card">
          <h2 className="contact-form__title">Send Us a Message</h2>
          <p className="contact-form__subtitle">
            Fill out the form below and our team will respond back shortly.
          </p>

          {submitted && (
            <div className="contact-form__alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Thank you! Your message has been sent successfully. We will reply within 2 hours.</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="contact-form__group">
              <label className="contact-form__label">Your Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ali Ahmed"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="contact-form__input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="contact-form__group">
                <label className="contact-form__label">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="ali@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="contact-form__input"
                />
              </div>

              <div className="contact-form__group">
                <label className="contact-form__label">Phone / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+92 300 0000000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="contact-form__input"
                />
              </div>
            </div>

            <div className="contact-form__group">
              <label className="contact-form__label">Subject</label>
              <input
                type="text"
                placeholder="Order Inquiry / Purity Certificate"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="contact-form__input"
              />
            </div>

            <div className="contact-form__group">
              <label className="contact-form__label">Message *</label>
              <textarea
                required
                rows={5}
                placeholder="How can we help you today?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="contact-form__textarea"
              />
            </div>

            <button type="submit" className="contact-form__submit-btn">
              SEND MESSAGE
            </button>
          </form>
        </div>

        {/* Right Embedded Map Card */}
        <div className="contact-map-card">
          <iframe
            title="Skardu Valley Himalayan Location Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d105260.10091890333!2d75.56885348398438!3d35.297926868847656!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38e463a56e7ef4c5%3A0x6b13e15f4a7c1b52!2sSkardu%2C%20Gilgit-Baltistan!5e0!3m2!1sen!2spk!4v1700000000000!5m2!1sen!2spk"
            className="contact-map-iframe"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      {/* ── FAQ Accordion Section ── */}
      <section className="contact-faq-section">
        <h2 className="contact-faq__title">Frequently Asked Questions</h2>
        <div className="contact-faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className={`contact-faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="contact-faq__question"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: '1.2rem', color: 'var(--olive, #93a936)' }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && <div className="contact-faq__answer">{faq.a}</div>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
