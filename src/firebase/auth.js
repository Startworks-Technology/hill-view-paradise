/**
 * ==============================================================================
 * File: src/firebase/auth.js
 * Description: Unified Authentication Module (Email or Mobile Number with Roles)
 * ==============================================================================
 */

import {
  signInWithEmailAndPassword as fbSignIn,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';
import {
  getUserByEmailOrMobile,
  normalizePhoneNumber,
  isEmail,
  getDisplayNameForRole,
} from '../services/userService';

const SESSION_KEY = 'hvp_admin_session';

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
 * Reads any stored local session.
 */
const getStoredSession = () => {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // ignore
  }
  return null;
};

/**
 * Log in user using either an Email Address or Mobile Number.
 * Checks against the Firestore `users` collection with role management.
 * 
 * @param {string} identifier (email or mobile number)
 * @param {string} password
 * @returns {Promise<object>} Authenticated user profile
 */
export const loginUser = async (identifier, password) => {
  if (!identifier || !password) {
    throw new Error('Please provide both email/mobile number and password.');
  }

  const cleanInput = String(identifier).trim();
  const inputIsEmail = isEmail(cleanInput);
  const cleanPhone = normalizePhoneNumber(cleanInput);

  // 1. Look up user record in `users` collection (Firestore or local fallback)
  let userRecord = null;
  try {
    userRecord = await getUserByEmailOrMobile(cleanInput);
  } catch (err) {
    console.warn('User lookup notice:', err);
  }

  // Helper to normalize role
  const resolveRole = (r, email = '', phone = '') => {
    if (r === 'admin' || r === 'media' || r === 'resident') return r;
    const lowerEmail = String(email).toLowerCase();
    const cleanPhone = normalizePhoneNumber(phone);
    if (lowerEmail.includes('admin') || cleanPhone === '9876543210') return 'admin';
    if (lowerEmail.includes('media') || cleanPhone === '9876543212') return 'media';
    return 'resident';
  };

  // 2. Firebase Live Authentication
  if (isFirebaseConfigured && auth) {
    // If a user document exists in `users` collection
    if (userRecord) {
      const role = resolveRole(userRecord.role, userRecord.email, userRecord.mobile);
      const passwordMatches = userRecord.password != null && String(userRecord.password).trim() === String(password).trim();

      // Try Firebase Auth if email is present
      if (userRecord.email) {
        try {
          const userCredential = await fbSignIn(auth, userRecord.email, password);
          const fbUser = userCredential.user;
          const userObj = {
            uid: fbUser.uid || userRecord.id,
            email: userRecord.email || fbUser.email,
            mobile: userRecord.mobile || cleanPhone,
            displayName: getDisplayNameForRole(role),
            role: role,
            isAdmin: role === 'admin',
          };
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
          window.dispatchEvent(new Event('auth_state_changed'));
          return userObj;
        } catch (fbErr) {
          // If direct password in Firestore matched, proceed with custom session
          if (passwordMatches) {
            const userObj = {
              uid: userRecord.id,
              email: userRecord.email,
              mobile: userRecord.mobile || cleanPhone,
              displayName: getDisplayNameForRole(role),
              role: role,
              isAdmin: role === 'admin',
            };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
            window.dispatchEvent(new Event('auth_state_changed'));
            return userObj;
          }
          if (
            fbErr.code === 'auth/wrong-password' ||
            fbErr.code === 'auth/invalid-credential'
          ) {
            throw new Error('Incorrect password. Please verify your credentials.');
          }
        }
      } else if (passwordMatches) {
        // Mobile-only user without Firebase Auth email
        const userObj = {
          uid: userRecord.id,
          email: userRecord.email || '',
          mobile: userRecord.mobile || cleanPhone,
          displayName: getDisplayNameForRole(role),
          role: role,
          isAdmin: role === 'admin',
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
        window.dispatchEvent(new Event('auth_state_changed'));
        return userObj;
      }
    }

    // Fallback: If input is direct email and registered directly in Firebase Auth
    if (inputIsEmail) {
      try {
        const userCredential = await fbSignIn(auth, cleanInput, password);
        const fbUser = userCredential.user;
        const role = resolveRole(null, fbUser.email, cleanPhone);
        const userObj = {
          uid: fbUser.uid,
          email: fbUser.email,
          mobile: cleanPhone,
          displayName: getDisplayNameForRole(role),
          role: role,
          isAdmin: role === 'admin',
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
        window.dispatchEvent(new Event('auth_state_changed'));
        return userObj;
      } catch (error) {
        if (
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/invalid-credential' ||
          error.code === 'auth/wrong-password'
        ) {
          throw new Error('Invalid email/mobile number or password.');
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

    throw new Error('No account found for this email or mobile number.');
  }

  // 3. Local Demo Fallback Mode
  if (userRecord) {
    if (userRecord.password === password || password.length >= 6) {
      const role = resolveRole(userRecord.role, userRecord.email, userRecord.mobile);
      const userObj = {
        uid: userRecord.id,
        email: userRecord.email,
        mobile: userRecord.mobile || cleanPhone,
        displayName: getDisplayNameForRole(role),
        role: role,
        isAdmin: role === 'admin',
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
      window.dispatchEvent(new Event('auth_state_changed'));
      return userObj;
    } else {
      throw new Error('Incorrect password. Password must match or be at least 6 characters.');
    }
  }

  // Fallback demo matching
  if (cleanInput && password.length >= 6) {
    const role = resolveRole(null, inputIsEmail ? cleanInput : '', cleanPhone);
    const userObj = {
      uid: `demo-${Date.now()}`,
      email: inputIsEmail ? cleanInput : `${cleanPhone || 'user'}@hillviewparadise.com`,
      mobile: cleanPhone || '9876543210',
      displayName: getDisplayNameForRole(role),
      role: role,
      isAdmin: role === 'admin',
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
    window.dispatchEvent(new Event('auth_state_changed'));
    return userObj;
  }

  throw new Error('Invalid email or mobile number, or password is too short (min 6 chars).');
};

export const loginAdmin = loginUser;

/**
 * Sign out user session.
 */
export const logoutUser = async () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.clear();
    localStorage.removeItem(SESSION_KEY);
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

export const logoutAdmin = logoutUser;

/**
 * Subscribe to Auth State changes.
 */
export const subscribeToAuthState = (callback) => {
  const checkLocalSession = () => {
    const stored = getStoredSession();
    callback(stored);
  };

  // Live Firebase onAuthStateChanged listener
  if (isFirebaseConfigured && auth) {
    return fbOnAuthStateChanged(auth, async (user) => {
      if (user) {
        // Read enriched session if available
        const sessionUser = getStoredSession();
        let role = sessionUser?.role;
        if (!role) {
          if (user.email?.toLowerCase().includes('admin')) role = 'admin';
          else if (user.email?.toLowerCase().includes('media')) role = 'media';
          else role = 'resident';
        }
        const userObj = {
          uid: user.uid,
          email: user.email,
          mobile: sessionUser?.mobile || '',
          displayName: getDisplayNameForRole(role),
          role: role,
          isAdmin: role === 'admin',
        };
        callback(userObj);
      } else {
        // Check session storage fallback
        checkLocalSession();
      }
    });
  }

  checkLocalSession();

  const handleStorage = () => checkLocalSession();
  window.addEventListener('storage', handleStorage);
  window.addEventListener('auth_state_changed', handleStorage);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('auth_state_changed', handleStorage);
  };
};
