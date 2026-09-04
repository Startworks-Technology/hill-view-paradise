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
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wallet,
  Receipt,
  Images,
  LogOut,
  Building2,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// Navigation links configuration
const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Society & Residents', path: '/residents', icon: Users },
  { name: 'Collections', path: '/collections', icon: Wallet },
  { name: 'Expenses', path: '/expenses', icon: Receipt },
  { name: 'Media Gallery', path: '/gallery', icon: Images },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container (Fixed height, pinned in place) */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[85vw] h-screen h-dvh bg-slate-900 text-white flex flex-col justify-between shrink-0
          transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:w-64 lg:z-auto
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

        {/* Footer with Authenticated User Info & Sign Out */}
        <div className="p-4 border-t border-slate-800">
          <div className="px-3 py-2 mb-3 flex items-center space-x-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
              currentUser?.role === 'admin'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : currentUser?.role === 'media'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
            }`}>
              {currentUser?.role === 'admin' ? 'AD' : currentUser?.role === 'media' ? 'MD' : 'RS'}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser?.displayName || (
                  currentUser?.role === 'admin'
                    ? 'Society Administrator'
                    : currentUser?.role === 'media'
                    ? 'Media Manager'
                    : 'Society Resident'
                )}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {currentUser?.email || currentUser?.mobile || 'Active User'}
              </p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-1.5 py-0.2 text-[10px] font-semibold rounded-sm ${
                  currentUser?.role === 'admin'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : currentUser?.role === 'media'
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-sky-500/20 text-sky-300'
                }`}>
                  {currentUser?.role === 'admin' ? 'Administrator' : currentUser?.role === 'media' ? 'Media' : 'Resident'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 hover:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
