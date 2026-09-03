/**
 * ==============================================================================
 * File: src/firebase/auth.js
 * Description: Firebase Authentication Wrapper
 * 
 * Responsibilities:
 * 1. Encapsulates Firebase Authentication methods for single-admin sign-in,
 *    sign-out, and auth state subscription (`onAuthStateChanged`).
 * 2. Provides demo authentication fallback if live credentials are not present.
 * 3. Never stores passwords in Firestore; credentials are handled strictly
 *    by Firebase Authentication.
 * ==============================================================================
 */

import {
  signInWithEmailAndPassword as fbSignIn,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

// Key for saving local demo session when running in offline/demo mode
const DEMO_AUTH_KEY = 'hvp_admin_session';

/**
 * Log in the society administrator using email and password credentials.
 * @param {string} email - Admin email address
 * @param {string} password - Admin password
 * @returns {Promise<object>} Authenticated user object
 */
export const loginAdmin = async (email, password) => {
  // Use real Firebase Auth if configured
  if (isFirebaseConfigured && auth) {
    try {
      const userCredential = await fbSignIn(auth, email, password);
      return userCredential.user;
    } catch (error) {
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password sign-in is not enabled. Go to Firebase Console -> Authentication -> Sign-in method and enable Email/Password.');
      }
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        throw new Error('Account not found or incorrect password. If you haven\'t created this admin user yet, go to Firebase Console -> Authentication -> Users tab -> Add user.');
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('Please provide a valid email address.');
      }
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.');
      }
      throw error;
    }
  }

  // Fallback: Simulate admin authentication in local demo mode
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email.trim() && password.length >= 6) {
        const demoUser = {
          uid: 'demo-admin-uid-1',
          email: email.trim(),
          displayName: 'Society Administrator',
          isDemo: true,
        };
        localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(demoUser));
        window.dispatchEvent(new Event('auth_state_changed'));
        resolve(demoUser);
      } else {
        const error = new Error('Invalid email or password. Password must be at least 6 characters.');
        error.code = 'auth/invalid-credential';
        reject(error);
      }
    }, 400);
  });
};

/**
 * Log out the currently authenticated society administrator.
 * @returns {Promise<void>}
 */
export const logoutAdmin = async () => {
  // Use real Firebase Auth if configured
  if (isFirebaseConfigured && auth) {
    await fbSignOut(auth);
    return;
  }

  // Fallback: Clear local demo session
  localStorage.removeItem(DEMO_AUTH_KEY);
  window.dispatchEvent(new Event('auth_state_changed'));
};

/**
 * Subscribe to authentication state changes (handles page refreshes & logout events).
 * @param {Function} callback - Function receiving current user or null
 * @returns {Function} Unsubscribe cleanup function
 */
export const subscribeToAuthState = (callback) => {
  // Use real Firebase onAuthStateChanged listener if configured
  if (isFirebaseConfigured && auth) {
    return fbOnAuthStateChanged(auth, callback);
  }

  // Fallback: Check local storage demo session
  const checkDemoAuth = () => {
    const stored = localStorage.getItem(DEMO_AUTH_KEY);
    callback(stored ? JSON.parse(stored) : null);
  };

  // Trigger initial auth verification
  checkDemoAuth();

  // Listen for storage events (e.g. cross-tab changes) and local auth events
  const handleStorage = () => checkDemoAuth();
  window.addEventListener('storage', handleStorage);
  window.addEventListener('auth_state_changed', handleStorage);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('auth_state_changed', handleStorage);
  };
};
