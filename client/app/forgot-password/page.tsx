'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight } from 'lucide-react';
import AuthLayout from '@/components/auth/AuthLayout';
import { useToast } from '@/components/ui/Toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || isLoading || cooldown > 0) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data.errors ? data.errors.join(', ') : data.message || 'Could not send the reset link. Please try again.',
          'Could not send link'
        );
        return;
      }

      // Generic success message (the API responds the same whether or not the account exists)
      toast.success(
        data.message || 'If an account exists for that email, a password reset link has been sent.',
        'Check your inbox'
      );
      setCooldown(COOLDOWN_SECONDS);
    } catch {
      toast.error('Server connection error. Please try again.', 'Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="FORGOT PASSWORD?"
      title="Reset Your Password"
      subtitle="Enter your email address and we'll send you a password reset link."
      heroTitle={
        <>
          RESET YOUR <br /> PASSWORD
        </>
      }
      heroSubtitle="Don't worry! It happens. Enter your email address and we'll send you a link to reset your password."
      topLinkHref="/login"
      topLinkText="BACK TO LOGIN"
    >
      <form onSubmit={handleSubmit}>
        <div className="auth-input-group">
          <label className="auth-code-label">Email Address</label>
          <div className="auth-input-field-wrap">
            <span className="auth-input-icon-left">
              <Mail className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="YOU@EXAMPLE.COM"
              className="auth-input"
            />
          </div>
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          style={{ marginTop: '8px' }}
          disabled={isLoading || cooldown > 0}
        >
          <span>
            {isLoading
              ? 'SENDING…'
              : cooldown > 0
                ? `RESEND IN ${cooldown}s`
                : 'SEND RESET LINK'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Divider */}
      <div className="auth-divider">
        <span className="auth-divider-text">OR</span>
      </div>

      <div className="auth-back-login-wrap" style={{ marginTop: 0 }}>
        <Link href="/login" className="auth-back-login">
          Back to Login
        </Link>
      </div>
    </AuthLayout>
  );
}