'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { checkAuthStatus, clearPendingVerification } from '@/lib/redux/slices/authSlice';
import AuthLayout from '@/components/auth/AuthLayout';
import { useToast } from '@/components/ui/Toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyEmailPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const { pendingVerificationEmail, isAuthenticated } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join('');

  // Resolve the email being verified (?email= query param → redux fallback → register)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else if (pendingVerificationEmail) {
      setEmail(pendingVerificationEmail);
    } else {
      router.replace('/register');
    }
  }, [pendingVerificationEmail, router]);

  // Already authenticated visitors go home
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  // Focus the first code box on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Type a digit (or paste several) into a box → fill forward and move focus
  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      setDigits((prev) => prev.map((d, i) => (i === index ? '' : d)));
      return;
    }
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < cleaned.length && index + i < CODE_LENGTH; i++) {
        next[index + i] = cleaned[i];
      }
      return next;
    });
    const nextIndex = Math.min(index + cleaned.length, CODE_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
    inputRefs.current[nextIndex]?.select();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
        setDigits((prev) => prev.map((d, i) => (i === index - 1 ? '' : d)));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (code.length !== CODE_LENGTH || !email) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data.errors ? data.errors.join(', ') : data.message || 'Verification failed. Please try again.',
          'Verification failed'
        );
        setDigits(Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        return;
      }

      toast.success('Email verified! Taking you to your account…', 'Verified');
      dispatch(clearPendingVerification());
      // Pick up the httpOnly session cookies set by the server
      await dispatch(checkAuthStatus());
      router.push('/');
    } catch {
      toast.error('Server connection error. Please try again.', 'Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending || !email) return;

    setIsResending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.errors ? data.errors.join(', ') : data.message || 'Could not resend the code.');
        return;
      }

      toast.success('A new verification code has been sent to your email.', 'Code sent');
      setCooldown(RESEND_COOLDOWN);
    } catch {
      toast.error('Server connection error. Please try again.', 'Connection error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="ONE LAST STEP"
      title="Verify Your Email"
      subtitle="Enter the 6-digit code sent to your email address."
      heroTitle={
        <>
          Verify Your <br /> Email
        </>
      }
      heroSubtitle="A secure step toward your natural wellness journey."
    >
      <form onSubmit={handleVerify}>
        {email && (
          <p className="auth-code-sent-to">
            Code sent to <strong>{email}</strong>
          </p>
        )}

        <div className="auth-input-group">
          <label className="auth-code-label">Verification Code</label>
          <div className="auth-code-group">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={CODE_LENGTH}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className={`auth-code-input ${digit ? 'filled' : ''}`}
                aria-label={`Verification digit ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="auth-resend-row">
          <Mail className="w-4 h-4 text-slate-400" />
          <span>Didn&rsquo;t receive the code?</span>
          <button
            type="button"
            className="auth-resend-btn"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : isResending ? 'Sending…' : 'Resend code'}
          </button>
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          style={{ marginTop: '24px' }}
          disabled={isLoading || code.length !== CODE_LENGTH || !email}
        >
          <span>{isLoading ? 'VERIFYING…' : 'VERIFY EMAIL'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="auth-back-login-wrap">
        <Link href="/login" className="auth-back-login">
          Back to Login
        </Link>
      </div>
    </AuthLayout>
  );
}
