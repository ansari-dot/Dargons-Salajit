'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { loginUser, clearAuthError } from '@/lib/redux/slices/authSlice';
import AuthLayout from '@/components/auth/AuthLayout';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Clear previous errors when page loads
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Redirect if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <AuthLayout
      eyebrow="WELCOME BACK"
      title="Log in to Your Account"
      subtitle="Access your orders, wishlist and more."
    >
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '20px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin}>
        {/* Email Field */}
        <div className="auth-input-group">
          <label className="auth-input-label">Email Address</label>
          <div className="auth-input-field-wrap">
            <span className="auth-input-icon-left">
              <Mail className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="auth-input"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="auth-input-group">
          <label className="auth-input-label">Password</label>
          <div className="auth-input-field-wrap">
            <span className="auth-input-icon-left">
              <Lock className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="auth-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="auth-toggle-pass-btn"
              title={showPassword ? 'Hide Password' : 'Show Password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="auth-forgot-wrap">
          <Link href="/forgot-password" className="auth-forgot-link">
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="auth-submit-btn"
        >
          <span>{isLoading ? 'LOGGING IN...' : 'LOG IN'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Divider */}
      <div className="auth-divider">
        <span className="auth-divider-text">OR</span>
      </div>

      {/* Switch to Register */}
      <div className="auth-switch-text">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="auth-switch-link">
          Register Now
        </Link>
      </div>
    </AuthLayout>
  );
}
