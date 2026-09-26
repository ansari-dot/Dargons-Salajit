'use client';

import React from 'react';

const brandLogos = [
  {
    name: 'Louis Vuitton',
    svg: (
      <svg viewBox="0 0 100 40" width="90" height="36" fill="#888888">
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fontFamily="serif" fontSize="22" fontWeight="700">LV</text>
        <text x="50%" y="82%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="7" letterSpacing="1">LOUIS VUITTON</text>
      </svg>
    ),
  },
  {
    name: 'Chanel',
    svg: (
      <svg viewBox="0 0 100 40" width="100" height="36" fill="#888888">
        <circle cx="44" cy="14" r="10" fill="none" stroke="#888888" strokeWidth="2.5" />
        <circle cx="56" cy="14" r="10" fill="none" stroke="#888888" strokeWidth="2.5" />
        <text x="50%" y="82%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="8" fontWeight="700" letterSpacing="2">CHANEL</text>
      </svg>
    ),
  },
  {
    name: 'Wilson',
    svg: (
      <svg viewBox="0 0 100 40" width="100" height="36" fill="#888888">
        <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" fontFamily="serif" fontStyle="italic" fontSize="22" fontWeight="700" letterSpacing="-1">Wilson</text>
      </svg>
    ),
  },
  {
    name: 'Dolce & Gabbana',
    svg: (
      <svg viewBox="0 0 110 40" width="110" height="36" fill="#888888">
        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="20" fontWeight="800">D&amp;G</text>
        <text x="50%" y="82%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="6" letterSpacing="1.5">DOLCE &amp; GABBANA</text>
      </svg>
    ),
  },
  {
    name: 'Hermes Paris',
    svg: (
      <svg viewBox="0 0 110 40" width="110" height="36" fill="#888888">
        <path d="M45 10 h20 v2 h-20 z M48 6 h14 v2 h-14 z" fill="#888888" />
        <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fontFamily="serif" fontSize="12" fontWeight="700" letterSpacing="1.5">HERMÈS</text>
        <text x="50%" y="85%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="6" letterSpacing="2">PARIS</text>
      </svg>
    ),
  },
  {
    name: 'Organica',
    svg: (
      <svg viewBox="0 0 110 40" width="110" height="36" fill="#888888">
        <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fontFamily="serif" fontStyle="italic" fontSize="18" fontWeight="700">Organica</text>
      </svg>
    ),
  },
  {
    name: 'Himalayan Pure',
    svg: (
      <svg viewBox="0 0 120 40" width="120" height="36" fill="#888888">
        <path d="M50 16 L60 4 L70 16 Z" fill="none" stroke="#888888" strokeWidth="2" />
        <text x="50%" y="78%" textAnchor="middle" dominantBaseline="middle" fontFamily="sans-serif" fontSize="7" fontWeight="700" letterSpacing="1.5">HIMALAYAN PURE</text>
      </svg>
    ),
  },
];

export default function BrandLogos() {
  // Duplicated list for seamless infinite marquee scrolling loop
  const doubleLogos = [...brandLogos, ...brandLogos];

  return (
    <section className="brand-logos-section">
      <div className="brand-logos-viewport">
        <div className="brand-logos-track">
          {doubleLogos.map((brand, index) => (
            <div key={`${brand.name}-${index}`} className="brand-logo-item" title={brand.name}>
              {brand.svg}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
