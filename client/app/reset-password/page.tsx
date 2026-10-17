'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { useToast } from '@/components/ui/Toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();

  const [token, setToken] = useState('');
  const [hasToken, setHasToken] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Pull the reset token from the emailed link (?token=…)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setHasToken(false);
      toast.error('This reset link is invalid. Please request a new one.', 'Invalid link');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After a successful reset → send the user to login
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => router.push('/login'), 2500);
    return () => clearTimeout(timer);
  }, [done, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !password) return;

    if (password.length < 6) {
      toast.warning('Password must be at least 6 characters long.', 'Weak password');
      return;
    }
    if (password !== confirmPassword) {
      toast.warning('Passwords do not match. Please re-enter them.', 'Mismatch');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data.errors ? data.errors.join(', ') : data.message || 'Could not reset the password. Please try again.',
          'Reset failed'
        );
        return;
      }

      toast.success(data.message || 'Your password has been reset successfully. Taking you to login…', 'Password reset');
      setDone(true);
    } catch {
      toast.error('Server connection error. Please try again.', 'Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="RESET PASSWORD"
      title="Set a New Password"
      subtitle="Enter and confirm your new password below."
      heroTitle={
        <>
          Reset Your <br /> Password
        </>
      }
      heroSubtitle="Almost done! Choose a new password and continue your natural wellness journey."
      topLinkHref="/login"
      topLinkText="Back to Login"
    >
      <form onSubmit={handleSubmit}>
        {/* New Password */}
        <div className="auth-input-group">
          <label className="auth-input-label">New Password</label>
          <div className="auth-input-field-wrap">
            <span className="auth-input-icon-left">
              <Lock className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="auth-input"
              disabled={!hasToken || done}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="auth-toggle-pass-btn"
              title={showPassword ? 'Hide Password' : 'Show Password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-slate-400" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="auth-input-group">
          <label className="auth-input-label">Confirm Password</label>
          <div className="auth-input-field-wrap">
            <span className="auth-input-icon-left">
              <Lock className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="auth-input"
              disabled={!hasToken || done}
            />
          </div>
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          style={{ marginTop: '8px' }}
          disabled={isLoading || !hasToken || done}
        >
          <span>{isLoading ? 'UPDATING…' : 'RESET PASSWORD'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="auth-back-login-wrap">
        {hasToken ? (
          <Link href="/login" className="auth-back-login">
            Back to Login
          </Link>
        ) : (
          <Link href="/forgot-password" className="auth-back-login">
            Request a New Link
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}