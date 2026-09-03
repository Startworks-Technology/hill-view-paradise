/**
 * ==============================================================================
 * File: src/components/layout/Navbar.jsx
 * Description: Top Navigation Bar Header Component
 * 
 * Features:
 * - Mobile hamburger menu toggle.
 * - Clean minimal top bar layout without duplicate branding.
 * - Top-Right Admin Action:
 *   - When NOT logged in: Prominent "Admin Login" button directing to `/login`.
 *   - When logged in: "Admin Active" status badge & quick "Sign Out" button.
 * ==============================================================================
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ShieldCheck, Lock, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

const Navbar = ({ onMenuClick }) => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="shrink-0 sticky top-0 z-30 bg-white/90 border-b border-slate-200/80 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
        {/* Left: Mobile Menu Button & Grounded Mobile Branding */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden flex items-center justify-center h-9 w-9 shrink-0 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 active:scale-95 transition-all cursor-pointer select-none"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile-only logo and society title */}
          <Link to="/" className="lg:hidden flex items-center space-x-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 tracking-tight truncate max-w-[130px] sm:max-w-none">
              Hill View Paradise
            </span>
          </Link>
        </div>

        {/* Right: Admin Actions & Status */}
        <div className="flex items-center space-x-2 sm:space-x-3 ml-auto shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <div className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-emerald-600" />
                <span className="hidden sm:inline">Admin Active</span>
                <span className="sm:hidden">Admin</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer shrink-0"
                title="Sign Out Admin"
              >
                <LogOut className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link to="/login" state={{ from: location }} className="shrink-0">
              <Button
                variant="primary"
                size="sm"
                icon={Lock}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs text-xs px-3 py-1.5"
              >
                Admin Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
