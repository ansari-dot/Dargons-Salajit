'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  toggleNavDrawer,
  setCurrency,
  setSearchQuery,
} from '@/lib/redux/slices/uiSlice';
import { selectCartCount } from '@/lib/redux/slices/cartSlice';
import NavMenu from './NavMenu';
import MiniCartDropdown from '../cart/MiniCartDropdown';

export default function Header() {
  const dispatch = useAppDispatch();
  const cartCount = useAppSelector(selectCartCount);
  const currency = useAppSelector((state) => state.ui.selectedCurrency);
  const searchQuery = useAppSelector((state) => state.ui.searchQuery);
  const user = useAppSelector((state) => state.auth.user);

  return (
    <header className="header">
      <div className="header__container">
        {/* Left Column: Brand Logo */}
        <div className="header__logo-col">
          <button
            className="header__menu"
            id="headerMenu"
            aria-label="Open menu"
            onClick={() => dispatch(toggleNavDrawer())}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <Link href="/" className="header__logo">
            <Image
              src="/logo.png"
              alt="Palses Pure Wellness"
              width={160}
              height={82}
              style={{ objectFit: 'contain' }}
              priority
            />
          </Link>
        </div>

        {/* Center Column: 2 Rows */}
        <div className="header__center-col">
          {/* Top Row: Call info, currency/account dropdowns, search pill */}
          <div className="header__center-top">
            <div className="header__phone-info">
              Order online or call us <span>+92 300 1234567</span>
            </div>
            <div className="header__meta-links">
              <div
                className="header__dropdown"
                onClick={() => dispatch(setCurrency(currency === 'PKR' ? 'USD' : 'PKR'))}
              >
                <span>{currency}</span> <i className="fa-solid fa-chevron-down"></i>
              </div>
              <div className="header__dropdown">
                <Link href={user ? '/account' : '/login'}>
                  <i className="fa-regular fa-user" style={{ marginRight: '4px' }}></i>
                  {user ? (user.first_name || user.name || user.email.split('@')[0]) : 'Account'}
                </Link>{' '}
                <i className="fa-solid fa-chevron-down"></i>
              </div>
            </div>
            <div className="header__search-pill">
              <input
                type="text"
                placeholder="Search all products..."
                aria-label="Search all products"
                value={searchQuery}
                onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              />
              <button type="button" aria-label="Search">
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </div>
          </div>

          {/* Divider Line */}
          <div className="header__divider"></div>

          {/* Bottom Row: Navigation Menu Links */}
          <div className="header__center-bottom">
            <NavMenu />
          </div>
        </div>

        {/* Right Column: Shopping Basket */}
        <div className="header__cart-col">
          <div className="header__cart-wrap" id="headerCartWrap">
            <Link href="/cart" className="header__basket-btn" aria-label="Shopping Cart">
              <div className="header__basket-icon-wrap">
                <svg
                  className="header__basket-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M4 10h16l-1.5 9.5a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5L4 10z"></path>
                  <path d="M9 10V6a3 3 0 0 1 6 0v4"></path>
                </svg>
                <span className="header__cart-badge">{cartCount}</span>
              </div>
            </Link>

            <MiniCartDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
