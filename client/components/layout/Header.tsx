'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  toggleNavDrawer,
  setCurrency,
  setSearchQuery,
} from '@/lib/redux/slices/uiSlice';
import { selectCartCount } from '@/lib/redux/slices/cartSlice';
import { SUPPORTED_CURRENCIES, getCurrencyName } from '@/lib/utils/currency';
import NavMenu from './NavMenu';
import MiniCartDropdown from '../cart/MiniCartDropdown';

export default function Header() {
  const dispatch = useAppDispatch();
  const cartCount = useAppSelector(selectCartCount);
  const currency = useAppSelector((state) => state.ui.selectedCurrency);
  const currencyName = useAppSelector((state) => state.ui.currencyName);
  const searchQuery = useAppSelector((state) => state.ui.searchQuery);
  const user = useAppSelector((state) => state.auth.user);

  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [currencyQuery, setCurrencyQuery] = useState('');

  // The picker lists every world currency (150+), so type-to-filter by code
  // or name keeps it usable.
  const visibleCurrencies = SUPPORTED_CURRENCIES.filter((code) => {
    const query = currencyQuery.trim().toLowerCase();
    if (!query) return true;

    return (
      code.toLowerCase().includes(query) ||
      getCurrencyName(code).toLowerCase().includes(query)
    );
  });

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
              {/* Currency picker — shows the detected currency AND its name */}
              <div className="header__dropdown" style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => {
                    const willOpen = !isCurrencyMenuOpen;
                    if (willOpen) setCurrencyQuery('');
                    setIsCurrencyMenuOpen(willOpen);
                  }}
                  aria-haspopup="listbox"
                  aria-expanded={isCurrencyMenuOpen}
                  aria-label={`Currency: ${currency} (${currencyName})`}
                  title={`${currency} — ${currencyName}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    font: 'inherit',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                  }}
                >
                  <span>{currency}</span> <i className="fa-solid fa-chevron-down"></i>
                </button>

                {isCurrencyMenuOpen && (
                  <>
                    <div
                      onClick={() => setIsCurrencyMenuOpen(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    />

                    <ul
                      role="listbox"
                      aria-label="Select currency"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        zIndex: 50,
                        minWidth: '250px',
                        maxHeight: '330px',
                        overflowY: 'auto',
                        margin: 0,
                        padding: '6px',
                        listStyle: 'none',
                        background: '#fff',
                        border: '1px solid #e2e2e2',
                        borderRadius: '8px',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
                      }}
                    >
                      <li
                        style={{
                          padding: '8px 10px 6px',
                          fontSize: '0.68rem',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          color: '#8a8a8a',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Current: {currency} · {currencyName}
                      </li>

                      {/* Type-to-filter — the list holds every world currency */}
                      <li style={{ padding: '6px 6px 8px' }}>
                        <input
                          type="search"
                          value={currencyQuery}
                          onChange={(event) => setCurrencyQuery(event.target.value)}
                          placeholder="Search currency…"
                          aria-label="Search currency"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '6px 8px',
                            fontSize: '0.8rem',
                            border: '1px solid #e2e2e2',
                            borderRadius: '6px',
                            outline: 'none',
                          }}
                        />
                      </li>

                      {visibleCurrencies.map((code) => {
                        const isActive = code === currency;
                        return (
                          <li key={code}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={isActive}
                              onClick={() => {
                                dispatch(setCurrency(code));
                                setIsCurrencyMenuOpen(false);
                              }}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                padding: '8px 10px',
                                border: 'none',
                                borderRadius: '6px',
                                background: isActive ? '#f4f6ea' : 'transparent',
                                color: isActive ? '#636830' : '#333',
                                fontWeight: isActive ? 700 : 500,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              <span>{code}</span>
                              <span style={{ color: '#777', fontWeight: 400 }}>
                                {getCurrencyName(code)}
                              </span>
                            </button>
                          </li>
                        );
                      })}

                      {visibleCurrencies.length === 0 && (
                        <li
                          style={{
                            padding: '10px',
                            fontSize: '0.8rem',
                            color: '#8a8a8a',
                            textAlign: 'center',
                          }}
                        >
                          No currency matches “{currencyQuery.trim()}”
                        </li>
                      )}
                    </ul>
                  </>
                )}
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
