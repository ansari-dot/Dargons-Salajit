'use client';

import React from 'react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { closeTopBar } from '@/lib/redux/slices/uiSlice';

export default function TopBar() {
  const dispatch = useAppDispatch();
  const isVisible = useAppSelector((state) => state.ui.isTopBarVisible);

  if (!isVisible) return null;

  return (
    <div className="top-bar">
      <div className="top-bar__container">
        <div className="top-bar__text">
          MID-SEASON SALE UP TO 70% OFF. USE CODE: &quot;SALE70&quot;.{' '}
          <Link href="/shop" className="top-bar__shop-link">
            SHOP NOW
          </Link>
        </div>
        <button
          className="top-bar__close"
          onClick={() => dispatch(closeTopBar())}
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
