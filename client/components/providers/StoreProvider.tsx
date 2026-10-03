'use client';

import React, { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { checkAuthStatus } from '@/lib/redux/slices/authSlice';
import {
  CURRENCY_POLL_INTERVAL_MS,
  fetchUserCurrency,
} from '@/lib/redux/slices/uiSlice';
import { syncAndMergeCart, selectCartItems } from '@/lib/redux/slices/cartSlice';
import { syncAndMergeWishlist, selectWishlistItems } from '@/lib/redux/slices/wishlistSlice';

function CartAuthSync({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const cartItems = useAppSelector(selectCartItems);
  const wishlistItems = useAppSelector(selectWishlistItems);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(syncAndMergeCart(cartItems));
      dispatch(syncAndMergeWishlist(wishlistItems));
    }
  }, [dispatch, isAuthenticated]);

  return <>{children}</>;
}

/**
 * Keeps the storefront currency in sync with the visitor's CURRENT public IP.
 *
 *   • resolves the browser IP with api.ipify.org (VPN aware)
 *   • asks our backend to geolocate that exact IP
 *   • Pakistan → PKR, any other country → USD
 *
 * It re-checks every 10 seconds (plus on tab focus / visibility / reconnect) so
 * turning a VPN on or off updates every price component with no page refresh.
 * Runs on every page, not just the home page.
 */
function CurrencyDetector({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const selectedCurrency = useAppSelector((state) => state.ui.selectedCurrency);
  const currencyName = useAppSelector((state) => state.ui.currencyName);
  const countryCode = useAppSelector((state) => state.ui.countryCode);

  // Prevents overlapping requests when the network is slow.
  const inFlight = useRef(false);

  // Debug trace: fires whenever the store currency actually changes.
  useEffect(() => {
    console.log(
      'CURRENCY STATE NOW:',
      selectedCurrency,
      currencyName ? `— ${currencyName}` : '',
      countryCode ? `(country ${countryCode})` : '(country unknown)'
    );
  }, [selectedCurrency, currencyName, countryCode]);

  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      if (cancelled || inFlight.current) return;
      inFlight.current = true;
      try {
        await dispatch(fetchUserCurrency());
      } finally {
        inFlight.current = false;
      }
    };

    // 1) Immediate check on mount, then 2) repeat so a VPN flip is picked up.
    detect();
    const interval = window.setInterval(detect, CURRENCY_POLL_INTERVAL_MS);

    const handleWake = () => {
      detect();
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) detect();
    };

    window.addEventListener('focus', handleWake);
    window.addEventListener('online', handleWake);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', handleWake);
      window.removeEventListener('online', handleWake);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dispatch]);

  return <>{children}</>;
}

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <CartAuthSync>
        <CurrencyDetector>{children}</CurrencyDetector>
      </CartAuthSync>
    </Provider>
  );
}