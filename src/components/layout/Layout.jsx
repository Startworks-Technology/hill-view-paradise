/**
 * ==============================================================================
 * File: src/components/layout/Layout.jsx
 * Description: Main Layout Wrapper with Fixed Sidebar and Scrollable Content Area
 * 
 * Responsibilities:
 * 1. Keeps the Sidebar permanently fixed on desktop (no page-level sidebar scrolling).
 * 2. Only the main content area scrolls vertically (`overflow-y-auto`).
 * 3. Houses the responsive Navbar and React Router `<Outlet />`.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-50">
      {/* Fixed Sidebar (Stays pinned, does not scroll with page) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Right Area: Header + Scrollable Content */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
