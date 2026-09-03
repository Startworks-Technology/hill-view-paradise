/**
 * ==============================================================================
 * File: src/App.jsx
 * Description: Root Routing & Layout Configuration
 * 
 * Architecture:
 * - Public Society Views (Open to everyone):
 *   - `/` or `/dashboard` -> Society Dashboard with members info, collections, expenses, and revenue metrics.
 *   - `/residents` (and `/society`) -> Society & Residents Directory.
 *   - `/collections` -> Monthly Maintenance Ledger.
 *   - `/expenses` -> Society Expenditure Tracking.
 * - Admin Authentication:
 *   - `/login` -> Admin Login page (accessible via Top-Right "Admin Login" button).
 * ==============================================================================
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import Collections from './pages/Collections';
import Expenses from './pages/Expenses';
import Gallery from './pages/Gallery';
import NotFound from './pages/NotFound';
import LoadingSpinner from './components/common/LoadingSpinner';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* 1. Login Route */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      {/* 2. Authenticated-Only Application Routes */}
      {isAuthenticated ? (
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="residents" element={<Residents />} />
          <Route path="society" element={<Navigate to="/residents" replace />} />
          <Route path="collections" element={<Collections />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      ) : (
        /* If unauthenticated, redirect ANY path to /login */
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

export default App;
