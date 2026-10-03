'use client';

import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchActiveBrands,
  selectBrands,
} from '@/lib/redux/slices/brandSlice';

/**
 * How many logos one half of the marquee should hold.
 * The track is duplicated and animated with `translateX(-50%)`, so one half
 * must be wide enough to overflow the viewport — otherwise the strip would run
 * out of logos and show a gap on wide screens.
 */
const MIN_LOGOS_PER_HALF = 8;

/**
 * Continuous brand-logo marquee for the home page.
 *
 * The logos are the images the admin uploaded in
 * *Admin → Brands → Upload Brand* (`POST /api/brands`, `GET /api/brands?active=true`).
 * Inactive brands are filtered out on the API, so hiding/deleting a brand in the
 * admin panel removes it from the slider automatically.
 */
export default function BrandLogos() {
  const dispatch = useAppDispatch();
  const brands = useAppSelector(selectBrands);

  useEffect(() => {
    dispatch(fetchActiveBrands());
  }, [dispatch]);

  /**
   * The CSS animates the track from 0 to -50%, so the list is repeated to fill
   * one half and then duplicated — that makes the loop perfectly seamless
   * whether there is 1 uploaded logo or 20.
   */
  const marqueeLogos = useMemo(() => {
    if (brands.length === 0) return [];

    const repeats = Math.max(1, Math.ceil(MIN_LOGOS_PER_HALF / brands.length));
    const half = Array.from({ length: repeats }, () => brands).flat();

    return [...half, ...half];
  }, [brands]);

  // No brands uploaded yet → keep the section out of the layout entirely.
  if (marqueeLogos.length === 0) return null;

  return (
    <section className="brand-logos-section" aria-label="Our brands">
      <div className="brand-logos-viewport">
        <div className="brand-logos-track">
          {marqueeLogos.map((brand, index) => (
            <div
              key={`${brand.id}-${index}`}
              className="brand-logo-item"
              title={brand.name}
            >
              {/* Plain <img>: the logo lives on the API host, which is not part
                  of next.config's image domains. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.logoUrl}
                alt={brand.name || 'Brand logo'}
                className="brand-logo-item__img"
                loading="lazy"
                draggable={false}
                onError={(event) => {
                  // Hide a logo that fails to load instead of showing a
                  // broken-image placeholder in the slider.
                  event.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}