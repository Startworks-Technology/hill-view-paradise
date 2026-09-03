/**
 * ==============================================================================
 * File: src/services/expenseService.js
 * Description: Society Expenses Data Access Layer (CRUD)
 * 
 * Rules:
 * 1. STRICT NO-ARRAY RULE: Every field is a scalar value (string, number, Timestamp).
 * 2. `month` and `year` are automatically derived from `expenseDate` as scalar numbers.
 * 3. Graceful fallback to local storage if Firestore throws network/permission error.
 * ==============================================================================
 */

import {
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
  serverTimestamp,
  Timestamp,
} from '../firebase/firestore';

// Firestore collection name
const COLLECTION_NAME = 'expenses';

// Local storage key for fallback simulation
const LOCAL_STORAGE_KEY = 'hvp_expenses_db';

/**
 * Helper to retrieve local mock expenses from localStorage.
 * @returns {Array<object>}
 */
const getLocalExpenses = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * Helper to persist local mock expenses to localStorage.
 * @param {Array<object>} expenses
 */
const saveLocalExpenses = (expenses) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expenses));
};

/**
 * Schema Validation Guard:
 * Strictly verifies that NO property in the document payload is an array.
 * @param {object} obj - Payload object being prepared for write
 */
const assertNoArrayFields = (obj) => {
  for (const key of Object.keys(obj)) {
    if (Array.isArray(obj[key])) {
      throw new Error(`Strict Schema Violation: Field "${key}" cannot be an array in Firestore.`);
    }
  }
};

/**
 * Fetch expenses for a specific month and year.
 * @param {number} month - Month number (1-12)
 * @param {number} year - Four-digit year (e.g. 2026)
 * @returns {Promise<Array<object>>} List of expense records
 */
export const getExpensesByMonth = async (month, year) => {
  const numMonth = Number(month);
  const numYear = Number(year);

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(
        colRef,
        where('month', '==', numMonth),
        where('year', '==', numYear)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
    } catch (error) {
      console.warn('Firestore getExpensesByMonth warning (falling back to local storage):', error);
    }
  }

  // Local storage mode: filter by numeric month and year
  return getLocalExpenses().filter(
    (e) => Number(e.month) === numMonth && Number(e.year) === numYear
  );
};

/**
 * Fetch all expense records across all months and years.
 * @returns {Promise<Array<object>>}
 */
export const getAllExpenses = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
    } catch (error) {
      console.warn('Firestore getAllExpenses warning (falling back to local storage):', error);
    }
  }

  return getLocalExpenses();
};

/**
 * Create a new expense voucher record.
 * 
 * @param {object} expenseData - Form input payload
 * @returns {Promise<object>} Created expense document
 */
export const createExpense = async (expenseData) => {
  const dateObj = expenseData.expenseDate ? new Date(expenseData.expenseDate) : new Date();
  const derivedMonth = dateObj.getMonth() + 1;
  const derivedYear = dateObj.getFullYear();
  const numAmount = Number(expenseData.amount);

  const payload = {
    category: expenseData.category,
    description: expenseData.description.trim(),
    amount: numAmount,
    expenseDate: isFirebaseConfigured ? Timestamp.fromDate(dateObj) : dateObj.toISOString(),
    month: derivedMonth,
    year: derivedYear,
    paymentMode: expenseData.paymentMode || 'Bank Transfer',
    notes: expenseData.notes ? expenseData.notes.trim() : '',
    createdAt: isFirebaseConfigured ? serverTimestamp() : new Date().toISOString(),
    updatedAt: isFirebaseConfigured ? serverTimestamp() : new Date().toISOString(),
  };

  assertNoArrayFields(payload);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
      return {
        id: docRef.id,
        ...payload,
      };
    } catch (error) {
      console.warn('Firestore addDoc expense error (falling back to local storage):', error);
    }
  }

  const localList = getLocalExpenses();
  const newExpense = {
    id: 'exp_' + Date.now() + Math.random().toString(36).substring(2, 7),
    ...payload,
  };
  localList.push(newExpense);
  saveLocalExpenses(localList);
  return newExpense;
};

/**
 * Update an existing expense record by ID.
 * 
 * @param {string} expenseId - Document ID to update
 * @param {object} updateData - Updated fields
 * @returns {Promise<object>}
 */
export const updateExpense = async (expenseId, updateData) => {
  if (!expenseId) throw new Error('Expense ID is required');

  const dateObj = updateData.expenseDate ? new Date(updateData.expenseDate) : new Date();
  const derivedMonth = dateObj.getMonth() + 1;
  const derivedYear = dateObj.getFullYear();
  const numAmount = Number(updateData.amount);

  const payload = {
    category: updateData.category,
    description: updateData.description.trim(),
    amount: numAmount,
    expenseDate: isFirebaseConfigured ? Timestamp.fromDate(dateObj) : dateObj.toISOString(),
    month: derivedMonth,
    year: derivedYear,
    paymentMode: updateData.paymentMode || 'Bank Transfer',
    notes: updateData.notes ? updateData.notes.trim() : '',
    updatedAt: isFirebaseConfigured ? serverTimestamp() : new Date().toISOString(),
  };

  assertNoArrayFields(payload);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, expenseId);
      await updateDoc(docRef, payload);
      return {
        id: expenseId,
        ...payload,
      };
    } catch (error) {
      console.warn('Firestore updateDoc expense error (falling back to local storage):', error);
    }
  }

  const localList = getLocalExpenses();
  const index = localList.findIndex((e) => e.id === expenseId);
  if (index === -1) throw new Error('Expense record not found to update');

  localList[index] = {
    ...localList[index],
    ...payload,
  };
  saveLocalExpenses(localList);
  return localList[index];
};

/**
 * Delete an expense record by document ID.
 * @param {string} expenseId - Document ID to remove
 * @returns {Promise<void>}
 */
export const deleteExpense = async (expenseId) => {
  if (!expenseId) throw new Error('Expense ID is required');

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, expenseId);
      await deleteDoc(docRef);
      return;
    } catch (error) {
      console.warn('Firestore deleteDoc expense error (falling back to local storage):', error);
    }
  }

  const localList = getLocalExpenses();
  const filtered = localList.filter((e) => e.id !== expenseId);
  saveLocalExpenses(filtered);
};
