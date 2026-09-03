/**
 * ==============================================================================
 * File: src/firebase/firestore.js
 * Description: Cloud Firestore Modular SDK Exports & Helpers
 * 
 * Responsibilities:
 * 1. Re-exports standard Cloud Firestore modular methods (`getDocs`, `addDoc`,
 *    `updateDoc`, `deleteDoc`, `query`, `where`, `serverTimestamp`, etc.).
 * 2. Provides the initialized database instance (`db`).
 * 3. Keeps database references centralized and easy to maintain.
 * ==============================================================================
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export {
  db,
  isFirebaseConfigured,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment,
};
