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
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      {/* 1. Main Application Layout (Directly opens Dashboard with members, collections & revenue) */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="residents" element={<Residents />} />
        <Route path="society" element={<Navigate to="/residents" replace />} />
        <Route path="collections" element={<Collections />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* 2. Admin Authentication Portal (Accessed from top-right corner) */}
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
