'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavMenu() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'HOME' },
    { href: '/about', label: 'ABOUT' },
    { href: '/shop', label: 'SHOP' },
    { href: '/gallery', label: 'GALLERY' },
    { href: '/blogs', label: 'BLOGS' },
    { href: '/contact', label: 'CONTACT US' },
  ];

  return (
    <nav className="header__nav-menu" aria-label="Main Navigation">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`header__nav-link ${isActive ? 'header__nav-link--active' : ''}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
