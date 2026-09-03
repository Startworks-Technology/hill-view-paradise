/**
 * ==============================================================================
 * File: src/firebase/config.js
 * Description: Firebase Initialization & Configuration Module
 * 
 * Responsibilities:
 * 1. Reads Firebase credentials from environment variables (`import.meta.env`).
 * 2. Initializes the Firebase App, Auth, and Cloud Firestore services.
 * 3. Provides graceful fallback to Local Demo Mode when Firebase credentials
 *    are not yet configured or contain placeholder values, ensuring the UI
 *    and CRUD workflows can be previewed immediately.
 * ==============================================================================
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Extract Firebase project credentials from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Flag to verify whether real, non-placeholder Firebase credentials are provided.
 * If true, all database operations interact with live Cloud Firestore.
 * If false, services fall back to local storage simulation.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your_project_id'
);

let app = null;
let auth = null;
let db = null;

// Initialize Firebase SDK if credentials are valid
if (isFirebaseConfigured) {
  try {
    // Re-use existing initialized app instance if available (prevents duplicate app errors)
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error('Failed to initialize Firebase SDK:', error);
  }
} else {
  console.info(
    'ℹ️ Firebase environment variables are not configured or using placeholders. Running in seamless Local Demo Mode. To connect your live Firebase project, configure .env with real credentials.'
  );
}

export { app, auth, db };
