/**
 * ==============================================================================
 * File: src/components/layout/Sidebar.jsx
 * Description: Fixed Desktop & Slide-Over Mobile Sidebar Navigation
 * 
 * Features:
 * - Desktop: Permanently fixed `h-screen`, does not scroll when main content scrolls.
 * - Mobile: Responsive slide-over drawer with backdrop overlay.
 * - Active route indicators for Dashboard, Residents, Collections, Expenses.
 * - Status display for Admin Session vs Public Read-Only Mode.
 * ==============================================================================
 */

import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Receipt,
  LogOut,
  Building2,
  Lock,
  X,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// Navigation links configuration
const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Society & Residents', path: '/residents', icon: Users },
  { name: 'Collections', path: '/collections', icon: Wallet },
  { name: 'Expenses', path: '/expenses', icon: Receipt },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, currentUser, isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container (Fixed height, pinned in place) */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-40 w-64 h-screen bg-slate-900 text-white flex flex-col justify-between shrink-0
          transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
            <Link to="/" className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white line-clamp-1">Hill View Paradise</h1>
                <p className="text-[11px] font-medium text-emerald-400">Society Portal</p>
              </div>
            </Link>
            {/* Mobile close button */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer with Session Info & Admin Toggle */}
        <div className="p-4 border-t border-slate-800">
          {isAuthenticated ? (
            <div>
              <div className="px-3 py-2 mb-2 flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-emerald-400 border border-slate-700">
                  AD
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">
                    {currentUser?.displayName || 'Administrator'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || 'admin@society.com'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Sign Out Admin</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="px-3 py-2 mb-2 flex items-center space-x-2 text-xs text-slate-400">
                <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Public View (Read-Only)</span>
              </div>

              <Link
                to="/login"
                state={{ from: location }}
                className="w-full flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors"
              >
                <Lock className="h-4 w-4 shrink-0" />
                <span>Admin Login</span>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
