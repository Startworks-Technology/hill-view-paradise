/**
 * ==============================================================================
 * File: src/context/AuthContext.jsx
 * Description: Global Authentication State Management & Context Provider
 * 
 * Responsibilities:
 * 1. Provides `currentUser`, `loading`, `authError`, `login`, and `logout`
 *    to all components throughout the application tree.
 * 2. Listens to Firebase Auth state (`onAuthStateChanged`) for automatic session
 *    restoration on page refreshes.
 * 3. Sanitizes and presents user-friendly error messages upon authentication failures.
 * ==============================================================================
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginAdmin, logoutAdmin, subscribeToAuthState } from '../firebase/auth';

// Create React context for authentication state
const AuthContext = createContext(null);

/**
 * Authentication Provider component wrapping the application tree.
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Subscribe to auth state changes when component mounts
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Log in admin with email & password.
   */
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const user = await loginAdmin(email, password);
      setCurrentUser(user);
      return user;
    } catch (err) {
      // Translate raw Firebase errors into friendly user messages
      let friendlyMessage = 'Unable to sign in. Please verify your credentials.';
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        friendlyMessage = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many failed login attempts. Please try again later.';
      }
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  /**
   * Sign out the active administrator session.
   */
  const logout = async () => {
    setAuthError(null);
    try {
      await logoutAdmin();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const value = {
    currentUser,
    loading,
    authError,
    login,
    logout,
    isAuthenticated: Boolean(currentUser),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to consume the AuthContext within components.
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
