/**
 * ==============================================================================
 * File: src/pages/Login.jsx
 * Description: Unified Sign-In Page (Admin & Residents)
 * 
 * Responsibilities:
 * 1. Collects email and password for both administrators and society residents.
 * 2. Authenticates through `AuthContext.login()`.
 * 3. Redirects authenticated user to dashboard or intended protected route.
 * 4. Provides quick-fill demo credentials for both Admin and Resident roles.
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, Lock, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { DEFAULT_SOCIETY_CONFIG } from '../utils/constants';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Preserved destination path if user was redirected from a protected route
  const from = location.state?.from?.pathname || '/';

  // If already logged in, navigate straight to dashboard/intended path
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Handle Login Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
            <Building2 className="h-8 w-8" />
          </div>
        </div>

        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Hill View Paradise Housing Society
        </h2>
        <p className="mt-1 text-center text-xs text-emerald-400 font-medium">
          Residential Society Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-bold text-slate-900">Sign In to Your Account</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter your credentials to access the society dashboard
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center text-xs font-medium text-rose-700">
                <ShieldAlert className="h-4 w-4 mr-2 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="hvp@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5"
              loading={loading ? 'Signing in...' : false}
            >
              Sign In to Dashboard
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Hill View Paradise Society • Secure Portal
        </p>
      </div>
    </div>
  );
};

export default Login;
