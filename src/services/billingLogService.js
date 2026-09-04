/**
 * ==============================================================================
 * File: src/services/billingLogService.js
 * Description: Service for tracking and persisting monthly dues generation logs in Cloud Firestore.
 * 
 * Provides:
 * - getBillingLogs: Fetch all billing generation logs directly from Firestore.
 * - getBillingLogByMonth: Fetch billing log for a specific month and year.
 * - createBillingLog: Record a new billing log entry in Firestore.
 * - deleteBillingLog: Remove a billing log from Firestore.
 * ==============================================================================
 */

import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from '../firebase/firestore';

const COLLECTION_NAME = 'billing_logs';

/**
 * Fetch all billing logs directly from Cloud Firestore.
 * @returns {Promise<Array<object>>}
 */
export const getBillingLogs = async () => {
  if (!db) return [];

  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  const logs = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  return logs.sort((a, b) => {
    if (Number(b.year) !== Number(a.year)) return Number(b.year) - Number(a.year);
    return Number(b.month) - Number(a.month);
  });
};

/**
 * Fetch a billing log entry for a specific month and year directly from Firestore.
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g. 2026)
 * @returns {Promise<object|null>}
 */
export const getBillingLogByMonth = async (month, year) => {
  if (!db) return null;

  const numMonth = Number(month);
  const numYear = Number(year);
  const docId = `bill_${numYear}_${String(numMonth).padStart(2, '0')}`;

  const docRef = doc(db, COLLECTION_NAME, docId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() };
  }
  return null;
};

/**
 * Create a new billing log entry directly in Cloud Firestore.
 * @param {object} logData
 * @returns {Promise<object>}
 */
export const createBillingLog = async (logData) => {
  if (!db) throw new Error('Firestore is not initialized');

  const numMonth = Number(logData.month);
  const numYear = Number(logData.year);
  const monthKey = `${numYear}-${String(numMonth).padStart(2, '0')}`;
  const docId = `bill_${numYear}_${String(numMonth).padStart(2, '0')}`;

  const payload = {
    month: numMonth,
    year: numYear,
    monthKey,
    billedDate: logData.billedDate || new Date().toISOString(),
    billedPropertiesCount: Number(logData.billedPropertiesCount) || 0,
    totalBilledAmount: Number(logData.totalBilledAmount) || 0,
    status: 'Completed',
    triggeredBy: logData.triggeredBy || 'Manual (Admin)',
    createdAt: serverTimestamp(),
  };

  const docRef = doc(db, COLLECTION_NAME, docId);
  await setDoc(docRef, payload, { merge: true });
  return { id: docId, ...payload };
};

/**
 * Delete a billing log entry by document ID from Cloud Firestore.
 * @param {string} logId
 * @returns {Promise<void>}
 */
export const deleteBillingLog = async (logId) => {
  if (!db || !logId) return;

  const docRef = doc(db, COLLECTION_NAME, logId);
  await deleteDoc(docRef);
};
