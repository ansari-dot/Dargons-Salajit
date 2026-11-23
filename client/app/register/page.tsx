'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Building2, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { registerUser, clearAuthError } from '@/lib/redux/slices/authSlice';
import AuthLayout from '@/components/auth/AuthLayout';
import { useToast } from '@/components/ui/Toast';

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();

  const { isAuthenticated, isLoading, error, pendingVerificationEmail } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    street_address: '',
    city: '',
    postal_code: '54000',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  // Clear previous errors when page loads
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Surface registration failures as toast notifications
  useEffect(() => {
    if (error) {
      toast.error(error, 'Registration failed');
      dispatch(clearAuthError());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // Redirect if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // After registration → send the user to the email verification page
  useEffect(() => {
    if (pendingVerificationEmail) {
      toast.success('Almost there! Enter the 6-digit code we emailed you.', 'Account created');
      router.push(`/verify-email?email=${encodeURIComponent(pendingVerificationEmail)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingVerificationEmail]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(registerUser(formData));
  };

  return (
    <AuthLayout
      eyebrow="JOIN PALSES WELLNESS"
      title="Create Your Account"
      subtitle="Fill in your details below to set up your account."
    >
      <form onSubmit={handleRegister}>
        {/* First & Last Name */}
        <div className="auth-form-grid">
          <div className="auth-input-group">
            <label className="auth-input-label">First Name *</label>
            <div className="auth-input-field-wrap">
              <span className="auth-input-icon-left">
                <User className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                placeholder="John"
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-input-label">Last Name *</label>
            <div className="auth-input-field-wrap">
              <span className="auth-input-icon-left">
                <User className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                className="auth-input"
              />
            </div>
          </div>
        </div>

        {/* Email Field */}
        <div className="auth-input-group">
          <label className="auth-input-label">Email Address *</label>
          <div className="auth-input-field-wrap">
            <span className="auth-input-icon-left">
              <Mail className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="auth-input"
            />
          </div>
        </div>

        {/* Phone & City */}
        <div className="auth-form-grid">
          <div className="auth-input-group">
            <label className="auth-input-label">Phone Number *</label>
            <div className="auth-input-field-wrap">
              <span className="auth-input-icon-left">
                <Phone className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+92 300 1234567"
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-input-label">City *</label>
            <div className="auth-input-field-wrap">
              <span className="auth-input-icon-left">
                <Building2 className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder="Lahore"
                className="auth-input"
              />
            </div>
          </div>
        </div>

        {/* Street Address */}
        <div className="auth-input-group">
          <label className="auth-input-label">Street Address *</label>
          <div className="auth-input-field-wrap">
            <span className="auth-input-icon-left">
              <MapPin className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              name="street_address"
              required
              value={formData.street_address}
              onChange={handleChange}
              placeholder="House / Flat No, Street, Area"
              className="auth-input"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="auth-input-group">
          <label className="auth-input-label">Password *</label>
          <div className="auth-input-field-wrap">
            <span className="auth-input-icon-left">
              <Lock className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="auth-submit-btn"
          style={{ marginTop: '8px' }}
        >
          <span>{isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Divider */}
      <div className="auth-divider">
        <span className="auth-divider-text">OR</span>
      </div>

      {/* Switch to Login */}
      <div className="auth-switch-text">
        Already have an account?{' '}
        <Link href="/login" className="auth-switch-link">
          Log In
        </Link>
      </div>
    </AuthLayout>
  );
}
