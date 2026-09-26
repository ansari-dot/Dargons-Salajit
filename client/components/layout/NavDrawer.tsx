'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { closeNavDrawer } from '@/lib/redux/slices/uiSlice';

export default function NavDrawer() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isNavDrawerOpen);
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About Us' },
    { href: '/shop', label: 'Shop' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/blogs', label: 'Blogs' },
    { href: '/contact', label: 'Contact Us' },
  ];

  if (!isOpen) return null;

  return (
    <div className="nav-drawer active" aria-hidden={!isOpen}>
      <div
        className="nav-drawer__backdrop"
        onClick={() => dispatch(closeNavDrawer())}
      />
      <div className="nav-drawer__panel">
        <div className="nav-drawer__header">
          <button
            className="nav-drawer__close"
            onClick={() => dispatch(closeNavDrawer())}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6L18 18" />
            </svg>
          </button>
        </div>

        <nav className="nav-drawer__menu">
          <ul className="nav-drawer__list">
            {links.map((link, i) => {
              const isActive = pathname === link.href;
              return (
                <li
                  className="nav-drawer__item"
                  style={{ '--i': i + 1 } as React.CSSProperties}
                  key={link.href}
                >
                  <Link
                    href={link.href}
                    className={`nav-drawer__link ${isActive ? 'nav-drawer__link--active' : ''}`}
                    onClick={() => dispatch(closeNavDrawer())}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
