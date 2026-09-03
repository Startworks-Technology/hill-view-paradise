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
import { Menu, ShieldCheck, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

const Navbar = ({ onMenuClick }) => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 bg-white/80 border-b border-slate-200/80 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
        {/* Left: Mobile Menu Button (Only visible on mobile screens) */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Toggle Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Right: Admin Actions & Status */}
        <div className="flex items-center space-x-3 ml-auto">
          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>Admin Active</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                title="Sign Out Admin"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link to="/login" state={{ from: location }}>
              <Button
                variant="primary"
                size="sm"
                icon={Lock}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs"
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
