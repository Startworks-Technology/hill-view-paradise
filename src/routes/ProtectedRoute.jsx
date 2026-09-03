/**
 * ==============================================================================
 * File: src/routes/ProtectedRoute.jsx
 * Description: Client-Side Route Guard Component
 * 
 * Responsibilities:
 * 1. Checks if the user is authenticated via `useAuth()`.
 * 2. If authentication state is still loading, renders a full-page loading spinner.
 * 3. If unauthenticated, redirects user to `/login` while preserving the intended path.
 * 4. If authenticated, renders the protected child component tree.
 * ==============================================================================
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // Show loading indicator during initial session check
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render protected content if user is logged in
  return children;
};

export default ProtectedRoute;
