/**
 * ==============================================================================
 * File: src/pages/NotFound.jsx
 * Description: 404 Fallback Page Component
 * 
 * Rendered when a user navigates to an unrecognized URL path.
 * Provides a direct button to return to `/dashboard`.
 * ==============================================================================
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/common/Button';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-black text-emerald-600 mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        The requested society management route does not exist or has been moved.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" icon={Home}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
