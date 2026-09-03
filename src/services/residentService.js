/**
 * ==============================================================================
 * File: src/services/residentService.js
 * Description: Residents & Properties Data Access Layer (CRUD)
 * 
 * Rules:
 * 1. STRICT NO-ARRAY RULE: Every field is a scalar value (string, number, Timestamp).
 * 2. Property Types:
 *    - 'Villa': Has Villa Number, fixed ₹3,000 / month.
 *    - 'Plot': Has Plot Size (in Sq. Yards), no plot number required, Plot Size * ₹3 / month.
 * 3. Graceful fallback to local storage if Firestore throws permissions/network error.
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
  serverTimestamp,
  increment,
} from '../firebase/firestore';
import { VILLA_MAINTENANCE_RATE, PLOT_RATE_PER_SQYD } from '../utils/constants';

// Firestore collection name
const COLLECTION_NAME = 'residents';

// Local storage key for fallback simulation
const LOCAL_STORAGE_KEY = 'hvp_residents_db';

/**
 * Helper to retrieve local mock residents from localStorage.
 * @returns {Array<object>}
 */
const getLocalResidents = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * Helper to persist local mock residents to localStorage.
 * @param {Array<object>} residents
 */
const saveLocalResidents = (residents) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(residents));
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
 * Calculate maintenance based on property type:
 * - Villa: ₹3,000 fixed
 * - Plot: Plot Size (Sq. Yards) * ₹3
 * @param {string} propertyType - 'Villa' | 'Plot'
 * @param {number} plotSize - Sq yards
 * @returns {number} Monthly maintenance amount in INR
 */
export const calculateMaintenance = (propertyType, plotSize = 0) => {
  if (propertyType === 'Plot') {
    const size = Number(plotSize) || 0;
    return size * PLOT_RATE_PER_SQYD;
  }
  return VILLA_MAINTENANCE_RATE; // Default ₹3000 for Villa
};

/**
 * Fetch all registered properties/residents from Firestore.
 * @returns {Promise<Array<object>>} List of all resident documents
 */
export const getResidents = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);
      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const propertyType = data.propertyType || (data.villaNumber?.startsWith('Plot') ? 'Plot' : 'Villa');
        const unit = propertyType === 'Plot' ? 'Plot' : (data.villaNumber || data.flatNumber || '');
        return {
          id: docSnap.id,
          ...data,
          villaNumber: unit,
          flatNumber: unit,
          propertyType: propertyType,
          plotSize: Number(data.plotSize) || 0,
          monthlyMaintenance: Number(data.monthlyMaintenance) || calculateMaintenance(propertyType, data.plotSize),
          outstandingBalance: Number(data.outstandingBalance) || 0,
          lastBilledMonthYear: data.lastBilledMonthYear || '',
        };
      });
    } catch (error) {
      console.warn('Firestore fetch warning (falling back to local storage):', error);
      // Fall through to local storage fallback
    }
  }

  // Local demo fallback
  return getLocalResidents()
    .map((r) => {
      const propertyType = r.propertyType || (r.villaNumber?.startsWith('Plot') ? 'Plot' : 'Villa');
      const unit = propertyType === 'Plot' ? 'Plot' : (r.villaNumber || r.flatNumber || '');
      return {
        ...r,
        villaNumber: unit,
        flatNumber: unit,
        propertyType: propertyType,
        plotSize: Number(r.plotSize) || 0,
        monthlyMaintenance: Number(r.monthlyMaintenance) || calculateMaintenance(propertyType, r.plotSize),
        outstandingBalance: Number(r.outstandingBalance) || 0,
        lastBilledMonthYear: r.lastBilledMonthYear || '',
      };
    })
    .sort((a, b) => (a.residentName || '').localeCompare(b.residentName || ''));
};

/**
 * Fetch a single resident document by its unique document ID.
 * @param {string} residentId - The unique Firestore document ID
 * @returns {Promise<object>} Resident document object
 */
export const getResidentById = async (residentId) => {
  if (!residentId) throw new Error('Resident ID is required');

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, residentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const propertyType = data.propertyType || 'Villa';
        const unit = propertyType === 'Plot' ? 'Plot' : (data.villaNumber || data.flatNumber || '');
        return {
          id: docSnap.id,
          ...data,
          villaNumber: unit,
          flatNumber: unit,
          propertyType: propertyType,
          plotSize: Number(data.plotSize) || 0,
          monthlyMaintenance: Number(data.monthlyMaintenance) || calculateMaintenance(propertyType, data.plotSize),
          outstandingBalance: Number(data.outstandingBalance) || 0,
          lastBilledMonthYear: data.lastBilledMonthYear || '',
        };
      }
    } catch (error) {
      console.warn('Firestore getDoc warning (falling back to local storage):', error);
    }
  }

  const residents = await getResidents();
  const resident = residents.find((r) => r.id === residentId);
  if (!resident) throw new Error('Resident not found');
  return resident;
};

/**
 * Create a new property/resident record.
 * 
 * @param {object} residentData - Form input data
 * @returns {Promise<object>} Created resident document
 */
export const createResident = async (residentData) => {
  const existingResidents = await getResidents();
  const propertyType = residentData.propertyType === 'Plot' ? 'Plot' : 'Villa';
  const plotSize = propertyType === 'Plot' ? Math.max(0, Number(residentData.plotSize) || 0) : 0;
  const monthlyMaintenance = calculateMaintenance(propertyType, plotSize);

  let unitIdentifier = 'Plot';
  if (propertyType === 'Villa') {
    unitIdentifier = (residentData.villaNumber || residentData.flatNumber || '').trim().toUpperCase();
    if (!unitIdentifier) {
      throw new Error('Villa number is required for Villas.');
    }
    // Validate unique Villa number among existing Villas
    const isDuplicate = existingResidents.some(
      (r) => r.propertyType === 'Villa' && (r.villaNumber || r.flatNumber || '').trim().toUpperCase() === unitIdentifier
    );
    if (isDuplicate) {
      throw new Error(`Villa Number "${unitIdentifier}" already exists in the records.`);
    }
  }

  // Strictly scalar payload (ZERO ARRAYS)
  const payload = {
    villaNumber: unitIdentifier,
    flatNumber: unitIdentifier,
    residentName: residentData.residentName.trim(),
    propertyType: propertyType,
    plotSize: plotSize,
    monthlyMaintenance: monthlyMaintenance,
    outstandingBalance: Number(residentData.outstandingBalance) || 0,
    lastBilledMonthYear: residentData.lastBilledMonthYear || '',
    phone: residentData.phone ? residentData.phone.trim() : '',
    email: residentData.email ? residentData.email.trim().toLowerCase() : '',
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
      console.warn('Firestore addDoc error (falling back to local storage):', error);
    }
  }

  // Local storage mode
  const localList = getLocalResidents();
  const newResident = {
    id: 'res_' + Date.now() + Math.random().toString(36).substring(2, 7),
    ...payload,
  };
  localList.push(newResident);
  saveLocalResidents(localList);
  return newResident;
};

/**
 * Update an existing property/resident document.
 * 
 * @param {string} residentId - The document ID to update
 * @param {object} updateData - Updated fields
 * @returns {Promise<object>} Updated document
 */
export const updateResident = async (residentId, updateData) => {
  if (!residentId) throw new Error('Resident ID is required');

  const existingResidents = await getResidents();
  const propertyType = updateData.propertyType === 'Plot' ? 'Plot' : 'Villa';
  const plotSize = propertyType === 'Plot' ? Math.max(0, Number(updateData.plotSize) || 0) : 0;
  const monthlyMaintenance = calculateMaintenance(propertyType, plotSize);

  let unitIdentifier = 'Plot';
  if (propertyType === 'Villa') {
    unitIdentifier = (updateData.villaNumber || updateData.flatNumber || '').trim().toUpperCase();
    if (!unitIdentifier) {
      throw new Error('Villa number is required for Villas.');
    }
    // Validate duplicate villa number among other Villas
    const isDuplicate = existingResidents.some(
      (r) => r.id !== residentId && r.propertyType === 'Villa' && (r.villaNumber || r.flatNumber || '').trim().toUpperCase() === unitIdentifier
    );
    if (isDuplicate) {
      throw new Error(`Villa Number "${unitIdentifier}" is already assigned to another villa.`);
    }
  }

  const existing = existingResidents.find((r) => r.id === residentId);
  const outstandingBalance = updateData.outstandingBalance !== undefined
    ? Number(updateData.outstandingBalance) || 0
    : (existing?.outstandingBalance || 0);

  // Strictly scalar payload (ZERO ARRAYS)
  const payload = {
    villaNumber: unitIdentifier,
    flatNumber: unitIdentifier,
    residentName: updateData.residentName.trim(),
    propertyType: propertyType,
    plotSize: plotSize,
    monthlyMaintenance: monthlyMaintenance,
    outstandingBalance: outstandingBalance,
    lastBilledMonthYear: updateData.lastBilledMonthYear !== undefined ? updateData.lastBilledMonthYear : (existing?.lastBilledMonthYear || ''),
    phone: updateData.phone ? updateData.phone.trim() : '',
    email: updateData.email ? updateData.email.trim().toLowerCase() : '',
    updatedAt: isFirebaseConfigured ? serverTimestamp() : new Date().toISOString(),
  };

  assertNoArrayFields(payload);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, residentId);
      await updateDoc(docRef, payload);
      return {
        id: residentId,
        ...payload,
      };
    } catch (error) {
      console.warn('Firestore updateDoc error (falling back to local storage):', error);
    }
  }

  // Local storage mode
  const localList = getLocalResidents();
  const index = localList.findIndex((r) => r.id === residentId);
  if (index === -1) throw new Error('Resident not found to update');

  localList[index] = {
    ...localList[index],
    ...payload,
  };
  saveLocalResidents(localList);
  return localList[index];
};

/**
 * Adjust a resident's outstanding balance atomically by a positive or negative amount.
 * @param {string} residentId - Resident Document ID
 * @param {number} deltaAmount - Amount to add (+ positive for unpaid/reversal, - negative for payment)
 */
export const adjustResidentOutstanding = async (residentId, deltaAmount) => {
  if (!residentId || !deltaAmount || isNaN(deltaAmount)) return;

  const numDelta = Math.round(Number(deltaAmount) * 100) / 100;
  if (numDelta === 0) return;

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, residentId);
      await updateDoc(docRef, {
        outstandingBalance: increment(numDelta),
        updatedAt: serverTimestamp(),
      });
      return;
    } catch (error) {
      console.warn('Firestore adjustResidentOutstanding error (falling back to local storage):', error);
    }
  }

  // Local storage mode
  const localList = getLocalResidents();
  const index = localList.findIndex((r) => r.id === residentId);
  if (index !== -1) {
    const current = Number(localList[index].outstandingBalance) || 0;
    localList[index].outstandingBalance = Math.round((current + numDelta) * 100) / 100;
    saveLocalResidents(localList);
  }
};

/**
 * Batch rollover unpaid maintenance for an active month to resident outstanding balances.
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g. 2026)
 * @param {Array<object>} collectionsList - List of collection documents for this month
 * @returns {Promise<{ billedCount: number, totalBilled: number, monthKey: string }>}
 */
export const rolloverUnpaidMonth = async (month, year, collectionsList = []) => {
  const numMonth = Number(month);
  const numYear = Number(year);
  const monthKey = `${numYear}-${String(numMonth).padStart(2, '0')}`;

  const residents = await getResidents();
  const paidResidentIds = new Set(
    collectionsList
      .filter((c) => Number(c.month) === numMonth && Number(c.year) === numYear && c.status === 'Paid')
      .map((c) => c.residentId)
  );

  let billedCount = 0;
  let totalBilled = 0;

  for (const resident of residents) {
    // If unpaid and not already billed for this exact month
    if (!paidResidentIds.has(resident.id) && resident.lastBilledMonthYear !== monthKey) {
      const fee = Number(resident.monthlyMaintenance) || calculateMaintenance(resident.propertyType, resident.plotSize);
      const newBalance = Math.round(((Number(resident.outstandingBalance) || 0) + fee) * 100) / 100;

      await updateResident(resident.id, {
        ...resident,
        outstandingBalance: newBalance,
        lastBilledMonthYear: monthKey,
      });

      billedCount += 1;
      totalBilled += fee;
    }
  }

  return { billedCount, totalBilled, monthKey };
};

/**
 * Delete a resident document by document ID.
 * @param {string} residentId - The document ID to remove
 * @returns {Promise<void>}
 */
export const deleteResident = async (residentId) => {
  if (!residentId) throw new Error('Resident ID is required');

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, COLLECTION_NAME, residentId);
      await deleteDoc(docRef);
      return;
    } catch (error) {
      console.warn('Firestore deleteDoc error (falling back to local storage):', error);
    }
  }

  // Local storage mode
  const localList = getLocalResidents();
  const filtered = localList.filter((r) => r.id !== residentId);
  saveLocalResidents(filtered);
};
