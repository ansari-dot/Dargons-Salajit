'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function NewArrivals() {
  return (
    <section className="new-arrivals">
      <div className="new-arrivals__container">
        {/* Left Side Product Splash Image */}
        <div className="new-arrivals__img-col">
          <Image
            src="/new-arrivals.png"
            alt="New Arrivals Organic Skincare"
            width={650}
            height={500}
            className="new-arrivals__img"
            priority
          />
        </div>

        {/* Right Side Content */}
        <div className="new-arrivals__content-col">
          <div className="new-arrivals__eyebrow">
            <span>N e w &nbsp; A r r i v a l s</span>
          </div>

          <h2 className="new-arrivals__title">Organic</h2>

          <div className="new-arrivals__sale-badge">
            SALE UP TO 70%
          </div>

          <p className="new-arrivals__description">
            When you feel like going for a bold eye look, glitter will always do the trick and
            make you feel like the raddest unicorn at the party. But as all beauty girls know,
            the downside of glitter is that it gets everywhere
          </p>

          <Link href="/shop" className="new-arrivals__cta">
            <span>SHOPPING NOW</span>
            <span className="arrow">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
