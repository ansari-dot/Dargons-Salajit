import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

/**
 * Guards admin routes: requires a logged-in admin user.
 * Anything else (no session, customer role) is redirected to /login,
 * preserving the intended destination in ?next= so login can return there.
 */
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useSelector((state: RootState) => state.adminAuth);
  const location = useLocation();

  const isAuthenticated = Boolean(token && user);
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';

  if (!isAuthenticated || !isAdmin) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <>{children}</>;
};