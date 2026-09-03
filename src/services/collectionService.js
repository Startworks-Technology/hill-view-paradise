/**
 * ==============================================================================
 * File: src/services/collectionService.js
 * Description: Maintenance Collections Data Access Layer (CRUD)
 * 
 * Rules:
 * 1. STRICT NO-ARRAY RULE: Every field is a scalar value (string, number, Timestamp, null).
 * 2. Month and Year stored as separate scalar numbers for clean composite filtering.
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
import { adjustResidentOutstanding } from './residentService';

// Firestore collection name
const COLLECTION_NAME = 'collections';

// Local storage key for fallback simulation
const LOCAL_STORAGE_KEY = 'hvp_collections_db';

/**
 * Helper to retrieve local mock collections from localStorage.
 * @returns {Array<object>}
 */
const getLocalCollections = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * Helper to persist local mock collections to localStorage.
 * @param {Array<object>} collections
 */
const saveLocalCollections = (collections) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(collections));
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
 * Fetch maintenance collection records for a specific month and year.
 * @param {number} month - Month number (1-12)
 * @param {number} year - Four-digit year (e.g. 2026)
 * @returns {Promise<Array<object>>} List of collections for the specified month
 */
export const getCollectionsByMonth = async (month, year) => {
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
      console.warn('Firestore getCollectionsByMonth warning (falling back to local storage):', error);
    }
  }

  // Local storage mode: filter by numeric month and year
  return getLocalCollections().filter(
    (c) => Number(c.month) === numMonth && Number(c.year) === numYear
  );
};

/**
 * Fetch all collection records across all months and years.
 * @returns {Promise<Array<object>>}
 */
export const getAllCollections = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
    } catch (error) {
      console.warn('Firestore getAllCollections warning (falling back to local storage):', error);
    }
  }

  return getLocalCollections();
};

/**
 * Record a new maintenance collection payment.
 * 
 * @param {object} collectionData - Form input payload
 * @returns {Promise<object>} Created collection document
 */
export const createCollection = async (collectionData) => {
  const numMonth = Number(collectionData.month);
  const numYear = Number(collectionData.year);
  const numAmount = Number(collectionData.amount);

  const existingMonthCollections = await getCollectionsByMonth(numMonth, numYear);
  const isDuplicate = existingMonthCollections.some(
    (c) => c.residentId === collectionData.residentId
  );
  if (isDuplicate) {
    throw new Error(
      `A collection record already exists for ${collectionData.residentName} (${collectionData.flatNumber}) for ${numMonth}/${numYear}.`
    );
  }

  let parsedPaidDate = null;
  if (collectionData.status === 'Paid') {
    if (collectionData.paidDate) {
      parsedPaidDate = isFirebaseConfigured
        ? Timestamp.fromDate(new Date(collectionData.paidDate))
        : new Date(collectionData.paidDate).toISOString();
    } else {
      parsedPaidDate = isFirebaseConfigured ? Timestamp.now() : new Date().toISOString();
    }
  }

  const payload = {
    residentId: collectionData.residentId,
    flatNumber: collectionData.flatNumber,
    residentName: collectionData.residentName,
    amount: numAmount,
    month: numMonth,
    year: numYear,
    paidDate: parsedPaidDate,
    status: collectionData.status || 'Paid',
    paymentMode: collectionData.status === 'Paid' ? (collectionData.paymentMode || 'UPI') : '',
    notes: collectionData.notes ? collectionData.notes.trim() : '',
    createdAt: isFirebaseConfigured ? serverTimestamp() : new Date().toISOString(),
    updatedAt: isFirebaseConfigured ? serverTimestamp() : new Date().toISOString(),
  };

  assertNoArrayFields(payload);

  let createdDoc = null;
  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
      createdDoc = {
        id: docRef.id,
        ...payload,
      };
    } catch (error) {
      console.warn('Firestore addDoc collection error (falling back to local storage):', error);
    }
  }

  if (!createdDoc) {
    const localList = getLocalCollections();
    createdDoc = {
      id: 'col_' + Date.now() + Math.random().toString(36).substring(2, 7),
      ...payload,
    };
    localList.push(createdDoc);
    saveLocalCollections(localList);
  }

  // If created as Paid, deduct amount from resident's outstanding balance
  if (payload.status === 'Paid' && payload.residentId) {
    await adjustResidentOutstanding(payload.residentId, -numAmount);
  }

  return createdDoc;
};

/**
 * Fetch a single collection document by its unique ID.
 * @param {string} collectionId
 * @returns {Promise<object|null>}
 */
export const getCollectionById = async (collectionId) => {
  if (!collectionId) return null;
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, collectionId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (err) {
      console.warn('Firestore getCollectionById warning:', err);
    }
  }
  const localList = getLocalCollections();
  return localList.find((c) => c.id === collectionId) || null;
};

/**
 * Update an existing maintenance collection record.
 * 
 * @param {string} collectionId - Document ID to update
 * @param {object} updateData - Updated fields
 * @returns {Promise<object>}
 */
export const updateCollection = async (collectionId, updateData) => {
  if (!collectionId) throw new Error('Collection ID is required');

  const oldDoc = await getCollectionById(collectionId);
  const oldStatus = oldDoc?.status || 'Pending';
  const oldAmount = Number(oldDoc?.amount) || 0;
  const residentId = updateData.residentId || oldDoc?.residentId;

  const numMonth = Number(updateData.month);
  const numYear = Number(updateData.year);
  const numAmount = Number(updateData.amount);

  let parsedPaidDate = null;
  if (updateData.status === 'Paid') {
    if (updateData.paidDate) {
      parsedPaidDate = isFirebaseConfigured
        ? Timestamp.fromDate(new Date(updateData.paidDate))
        : new Date(updateData.paidDate).toISOString();
    } else {
      parsedPaidDate = isFirebaseConfigured ? Timestamp.now() : new Date().toISOString();
    }
  }

  const payload = {
    amount: numAmount,
    month: numMonth,
    year: numYear,
    paidDate: parsedPaidDate,
    status: updateData.status || 'Paid',
    paymentMode: updateData.status === 'Paid' ? (updateData.paymentMode || 'UPI') : '',
    notes: updateData.notes ? updateData.notes.trim() : '',
    updatedAt: isFirebaseConfigured ? serverTimestamp() : new Date().toISOString(),
  };

  if (updateData.residentName) payload.residentName = updateData.residentName;
  if (updateData.flatNumber) payload.flatNumber = updateData.flatNumber;

  assertNoArrayFields(payload);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, collectionId);
      await updateDoc(docRef, payload);
    } catch (error) {
      console.warn('Firestore updateDoc collection error (falling back to local storage):', error);
    }
  }

  const localList = getLocalCollections();
  const index = localList.findIndex((c) => c.id === collectionId);
  if (index !== -1) {
    localList[index] = {
      ...localList[index],
      ...payload,
    };
    saveLocalCollections(localList);
  }

  // Adjust resident outstanding balance on status / amount transition
  if (residentId) {
    const newStatus = payload.status;
    if (oldStatus !== 'Paid' && newStatus === 'Paid') {
      // Changed from Pending to Paid -> deduct new amount
      await adjustResidentOutstanding(residentId, -numAmount);
    } else if (oldStatus === 'Paid' && newStatus !== 'Paid') {
      // Changed from Paid to Pending -> restore old amount
      await adjustResidentOutstanding(residentId, +oldAmount);
    } else if (oldStatus === 'Paid' && newStatus === 'Paid' && oldAmount !== numAmount) {
      // Both Paid but amount changed -> adjust difference
      await adjustResidentOutstanding(residentId, -(numAmount - oldAmount));
    }
  }

  return {
    id: collectionId,
    ...(oldDoc || {}),
    ...payload,
  };
};

/**
 * Delete a collection record by document ID.
 * @param {string} collectionId - Document ID to remove
 * @returns {Promise<void>}
 */
export const deleteCollection = async (collectionId) => {
  if (!collectionId) throw new Error('Collection ID is required');

  const oldDoc = await getCollectionById(collectionId);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, collectionId);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn('Firestore deleteDoc collection error (falling back to local storage):', error);
    }
  }

  const localList = getLocalCollections();
  const filtered = localList.filter((c) => c.id !== collectionId);
  saveLocalCollections(filtered);

  // If deleted collection was Paid, restore the amount to resident outstanding balance
  if (oldDoc && oldDoc.status === 'Paid' && oldDoc.residentId) {
    await adjustResidentOutstanding(oldDoc.residentId, Number(oldDoc.amount) || 0);
  }
};
