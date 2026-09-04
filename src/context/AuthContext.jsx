/**
 * ==============================================================================
 * File: src/context/AuthContext.jsx
 * Description: Global Authentication State Management & Context Provider
 * 
 * Responsibilities:
 * 1. Provides `currentUser`, `loading`, `authError`, `login`, and `logout`
 *    to all components throughout the application tree.
 * 2. Supports login via Email or Mobile Number.
 * 3. Listens to auth state changes for automatic session restoration.
 * 4. Manages role-based permissions (`isAdmin`, `role`).
 * ==============================================================================
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginUser, logoutUser, subscribeToAuthState } from '../firebase/auth';

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
   * Log in user with email or mobile number & password.
   * @param {string} identifier (email or mobile number)
   * @param {string} password
   */
  const login = async (identifier, password) => {
    setAuthError(null);
    try {
      const user = await loginUser(identifier, password);
      setCurrentUser(user);
      return user;
    } catch (err) {
      // Translate raw Firebase or app errors into friendly user messages
      let friendlyMessage = err.message || 'Unable to sign in. Please verify your credentials.';
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        friendlyMessage = 'Invalid email/mobile number or password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many failed login attempts. Please try again later.';
      }
      setAuthError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  /**
   * Sign out the active user session.
   */
  const logout = async () => {
    setAuthError(null);
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setCurrentUser(null);
    }
  };

  const role = currentUser?.role || (currentUser ? 'resident' : null);
  const isAdmin = Boolean(currentUser && (currentUser.isAdmin || role === 'admin'));
  const isMedia = Boolean(currentUser && role === 'media');
  const canManageMedia = Boolean(currentUser && (role === 'admin' || role === 'media'));

  const value = {
    currentUser,
    loading,
    authError,
    login,
    logout,
    isAuthenticated: Boolean(currentUser),
    isAdmin,
    isMedia,
    canManageMedia,
    role,
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
