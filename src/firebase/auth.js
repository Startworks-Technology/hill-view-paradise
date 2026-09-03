/**
 * ==============================================================================
 * File: src/firebase/auth.js
 * Description: Society Administrator Authentication Module
 * ==============================================================================
 */

import {
  signInWithEmailAndPassword as fbSignIn,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

const ADMIN_SESSION_KEY = 'hvp_admin_session';

// Purge any legacy session keys on startup
try {
  localStorage.removeItem('hvp_user_session');
  localStorage.removeItem('hvp_active_session');
  localStorage.removeItem('hvp_session');
  sessionStorage.removeItem('hvp_user_session');
  sessionStorage.removeItem('hvp_active_session');
} catch (e) {
  // ignore
}

/**
 * Log in the society administrator.
 * @param {string} email
 * @param {string} password
 */
export const loginAdmin = async (email, password) => {
  const cleanEmail = email.trim();

  // 1. Live Firebase Authentication if configured
  if (isFirebaseConfigured && auth) {
    try {
      const userCredential = await fbSignIn(auth, cleanEmail, password);
      const user = userCredential.user;
      const adminObj = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Society Administrator',
        isAdmin: true,
      };
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminObj));
      return adminObj;
    } catch (error) {
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/Password sign-in is not enabled in Firebase Console.');
      }
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password'
      ) {
        throw new Error('Invalid email or password. Please verify your admin credentials.');
      }
      if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      }
      throw error;
    }
  }

  // 2. Local fallback mode
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (cleanEmail && password.length >= 6) {
        const adminObj = {
          uid: 'admin-uid-1',
          email: cleanEmail,
          displayName: 'Society Administrator',
          isAdmin: true,
        };
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminObj));
        window.dispatchEvent(new Event('auth_state_changed'));
        resolve(adminObj);
      } else {
        const error = new Error('Invalid email or password. Password must be at least 6 characters.');
        error.code = 'auth/invalid-credential';
        reject(error);
      }
    }, 300);
  });
};

export const loginUser = loginAdmin;

/**
 * Sign out the administrator session.
 */
export const logoutAdmin = async () => {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.clear();
    localStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem('hvp_user_session');
    localStorage.removeItem('hvp_admin_session');
    localStorage.removeItem('hvp_active_session');
  } catch (err) {
    console.error('Session clearance error:', err);
  }

  if (isFirebaseConfigured && auth) {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('Firebase signOut:', err);
    }
  }

  window.dispatchEvent(new Event('auth_state_changed'));
};

export const logoutUser = logoutAdmin;

/**
 * Subscribe to Admin Auth State changes.
 */
export const subscribeToAuthState = (callback) => {
  // Live Firebase onAuthStateChanged listener
  if (isFirebaseConfigured && auth) {
    return fbOnAuthStateChanged(auth, (user) => {
      if (user) {
        const adminObj = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Society Administrator',
          isAdmin: true,
        };
        callback(adminObj);
      } else {
        callback(null);
      }
    });
  }

  // Check active session
  const checkSession = () => {
    try {
      const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        callback(parsed);
        return;
      }
    } catch (e) {
      // ignore
    }
    callback(null);
  };

  checkSession();

  const handleStorage = () => checkSession();
  window.addEventListener('storage', handleStorage);
  window.addEventListener('auth_state_changed', handleStorage);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('auth_state_changed', handleStorage);
  };
};
