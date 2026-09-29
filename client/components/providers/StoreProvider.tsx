'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { checkAuthStatus } from '@/lib/redux/slices/authSlice';
import { fetchUserCurrency } from '@/lib/redux/slices/uiSlice';
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
 * Detects the visitor's country once through the server IP tracker and picks the
 * currency for the whole storefront: Pakistan → PKR, any other country → USD.
 * Runs on every page (not just the home page).
 */
function CurrencyDetector({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchUserCurrency());
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
