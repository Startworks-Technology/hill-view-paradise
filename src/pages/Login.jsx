/**
 * ==============================================================================
 * File: src/pages/Login.jsx
 * Description: Admin Sign-In Page
 * 
 * Responsibilities:
 * 1. Collects admin email and password.
 * 2. Authenticates through `AuthContext.login()`.
 * 3. Redirects authenticated admin to dashboard or intended route.
 * 4. Provides quick-fill demo credentials helper for development testing.
 * 5. Provides link to return to the public society homepage.
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Lock, Mail, ShieldAlert, Sparkles, ArrowLeft } from 'lucide-react';
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
  const from = location.state?.from?.pathname || '/dashboard';

  // If already logged in, navigate straight to dashboard
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

  // Quick fill demo credentials for instant testing
  const handleFillDemo = () => {
    setEmail('admin@hillviewparadise.com');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Left Back to Website Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 backdrop-blur-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Society Website</span>
        </Link>
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 mt-8 sm:mt-0">
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
            <Building2 className="h-8 w-8" />
          </div>
        </div>

        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {DEFAULT_SOCIETY_CONFIG.societyName}
        </h2>
        <p className="mt-1 text-center text-xs text-emerald-400 font-medium">
          Residential Society Administrative Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center text-xs font-medium text-rose-700">
                <ShieldAlert className="h-4 w-4 mr-2 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Admin Email Address"
              type="email"
              icon={Mail}
              placeholder="admin@hillviewparadise.com"
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
              loading={loading ? 'Authenticating...' : false}
            >
              Sign In to Dashboard
            </Button>
          </form>

          {/* Instant Demo credentials button for review/testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Need quick access?</span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Fill Demo Credentials
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Single Admin Architecture • Cloud Firestore Backend
        </p>
      </div>
    </div>
  );
};

export default Login;
