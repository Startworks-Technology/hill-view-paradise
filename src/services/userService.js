/**
 * ==============================================================================
 * File: src/services/userService.js
 * Description: User Accounts Service for Mobile / Email & Role Management
 * 
 * Schema for `users` collection:
 * - `mobile`: String or Number (e.g., '9989620473' or 9989620473)
 * - `email`: String (e.g., 'admin@hillviewparadise.com')
 * - `password`: String (plain/hashed password string)
 * - `role`: String ('admin' | 'media' | 'resident')
 * ==============================================================================
 */

import {
  db,
  isFirebaseConfigured,
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from '../firebase/firestore';

const COLLECTION_NAME = 'users';
const LOCAL_STORAGE_USERS_KEY = 'hvp_users_data';

/**
 * Returns display name based solely on the user's role.
 * @param {string} role ('admin' | 'media' | 'resident')
 * @returns {string}
 */
export const getDisplayNameForRole = (role) => {
  if (role === 'admin') return 'Society Administrator';
  if (role === 'media') return 'Media Manager';
  return 'Society Resident';
};

/**
 * Normalizes phone number by removing spaces, hyphens, and non-digits.
 * @param {string} phone
 * @returns {string}
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
};

/**
 * Checks if input is an email address.
 * @param {string} input
 * @returns {boolean}
 */
export const isEmail = (input) => {
  if (!input || typeof input !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
};

/**
 * Initial sample users for local fallback or seeding.
 */
export const DEFAULT_USERS = [
  {
    id: 'user-admin-1',
    email: 'admin@hillviewparadise.com',
    mobile: '9876543210',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-media-1',
    email: 'media@hillviewparadise.com',
    mobile: '9876543212',
    password: 'media123',
    role: 'media',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-resident-1',
    email: 'resident@hillviewparadise.com',
    mobile: '9876543211',
    password: 'resident123',
    role: 'resident',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Get users from local storage simulation.
 */
const getLocalUsers = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_USERS;
  }
};

/**
 * Save users to local storage simulation.
 */
const saveLocalUsers = (users) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to persist local users:', e);
  }
};

/**
 * Look up a user in Firestore or local storage by email or mobile number.
 * Searches across string/number representations and case variations.
 * 
 * @param {string} identifier (email or mobile number)
 * @returns {Promise<object|null>}
 */
export const getUserByEmailOrMobile = async (identifier) => {
  if (!identifier) return null;
  const cleanInput = String(identifier).trim();
  const inputLower = cleanInput.toLowerCase();
  const inputIsEmail = isEmail(cleanInput);
  const cleanMobile = normalizePhoneNumber(cleanInput);
  const numericMobile = cleanMobile && !isNaN(Number(cleanMobile)) ? Number(cleanMobile) : null;

  if (isFirebaseConfigured && db) {
    const collectionsToTry = ['users', 'Users'];

    for (const collName of collectionsToTry) {
      try {
        const usersRef = collection(db, collName);

        if (inputIsEmail) {
          // 1. Query by email (lowercase)
          const qEmail = query(usersRef, where('email', '==', inputLower));
          const emailSnap = await getDocs(qEmail);
          if (!emailSnap.empty) {
            const docSnap = emailSnap.docs[0];
            return { id: docSnap.id, ...docSnap.data() };
          }

          // 2. Query by email (exact case)
          if (cleanInput !== inputLower) {
            const qExact = query(usersRef, where('email', '==', cleanInput));
            const exactSnap = await getDocs(qExact);
            if (!exactSnap.empty) {
              const docSnap = exactSnap.docs[0];
              return { id: docSnap.id, ...docSnap.data() };
            }
          }
        } else if (cleanMobile) {
          // 1. Query by mobile (as String)
          const qMobileStr = query(usersRef, where('mobile', '==', cleanMobile));
          const snapStr = await getDocs(qMobileStr);
          if (!snapStr.empty) {
            const docSnap = snapStr.docs[0];
            return { id: docSnap.id, ...docSnap.data() };
          }

          // 2. Query by mobile (as Number in Firestore)
          if (numericMobile !== null) {
            const qMobileNum = query(usersRef, where('mobile', '==', numericMobile));
            const snapNum = await getDocs(qMobileNum);
            if (!snapNum.empty) {
              const docSnap = snapNum.docs[0];
              return { id: docSnap.id, ...docSnap.data() };
            }
          }

          // 3. Query by phone field (as String)
          const qPhoneStr = query(usersRef, where('phone', '==', cleanMobile));
          const snapPhoneStr = await getDocs(qPhoneStr);
          if (!snapPhoneStr.empty) {
            const docSnap = snapPhoneStr.docs[0];
            return { id: docSnap.id, ...docSnap.data() };
          }

          // 4. Query by phone field (as Number)
          if (numericMobile !== null) {
            const qPhoneNum = query(usersRef, where('phone', '==', numericMobile));
            const snapPhoneNum = await getDocs(qPhoneNum);
            if (!snapPhoneNum.empty) {
              const docSnap = snapPhoneNum.docs[0];
              return { id: docSnap.id, ...docSnap.data() };
            }
          }

          // 5. Query by mobileNumber field
          const qMobileNumber = query(usersRef, where('mobileNumber', '==', cleanMobile));
          const snapMobileNumber = await getDocs(qMobileNumber);
          if (!snapMobileNumber.empty) {
            const docSnap = snapMobileNumber.docs[0];
            return { id: docSnap.id, ...docSnap.data() };
          }
        }
      } catch (err) {
        if (err.code === 'permission-denied') {
          console.error(
            '⚠️ Firestore Permission Denied: Unauthenticated reads to the "users" collection are blocked by your Firestore Security Rules. Please update your Firestore Rules in Firebase Console to: match /users/{userId} { allow read: if true; }'
          );
          throw new Error(
            'Firestore Security Rules blocked reading the "users" collection. In Firebase Console -> Firestore Database -> Rules, add: match /users/{userId} { allow read: if true; }'
          );
        }
        console.warn(`Firestore lookup in "${collName}" notice:`, err);
      }
    }
  }

  // Local storage fallback lookup
  const localUsers = getLocalUsers();
  return (
    localUsers.find((u) => {
      if (inputIsEmail && u.email?.toLowerCase() === inputLower) {
        return true;
      }
      if (!inputIsEmail && (u.mobile || u.phone)) {
        const storedMobileDigits = normalizePhoneNumber(u.mobile || u.phone);
        if (storedMobileDigits && cleanMobile && storedMobileDigits === cleanMobile) {
          return true;
        }
        if (String(u.mobile || u.phone).trim() === cleanInput) {
          return true;
        }
      }
      return false;
    }) || null
  );
};

/**
 * Fetch all user accounts.
 * @returns {Promise<Array>}
 */
export const getAllUsers = async () => {
  if (isFirebaseConfigured && db) {
    try {
      const usersRef = collection(db, COLLECTION_NAME);
      const snap = await getDocs(usersRef);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Firestore getAllUsers error:', err);
    }
  }

  return getLocalUsers();
};

/**
 * Create a new user in the `users` collection.
 * @param {object} userData
 * @returns {Promise<object>}
 */
export const createUserAccount = async (userData) => {
  const cleanEmail = userData.email ? userData.email.trim().toLowerCase() : '';
  const storedMobile = userData.mobile ? normalizePhoneNumber(userData.mobile) : '';

  const newUser = {
    email: cleanEmail,
    mobile: storedMobile || userData.mobile || '',
    password: String(userData.password || 'password123'),
    role: userData.role === 'admin' ? 'admin' : (userData.role === 'media' ? 'media' : 'resident'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), newUser);
      return { id: docRef.id, ...newUser };
    } catch (err) {
      console.error('Firestore createUserAccount error:', err);
      throw err;
    }
  }

  // Local storage fallback
  const localUsers = getLocalUsers();
  const created = { id: `user-${Date.now()}`, ...newUser };
  localUsers.push(created);
  saveLocalUsers(localUsers);
  return created;
};

/**
 * Batch create resident users where password === mobile, email === '', role === 'resident'.
 * Skips already existing mobile numbers.
 * 
 * @param {string[]} mobileList - Array of mobile numbers
 * @returns {Promise<{ created: number, skipped: number }>}
 */
export const createResidentUsersBatch = async (mobileList = []) => {
  let created = 0;
  let skipped = 0;

  for (const rawPhone of mobileList) {
    const cleanMobile = normalizePhoneNumber(rawPhone);
    if (!cleanMobile) continue;

    const existing = await getUserByEmailOrMobile(cleanMobile);
    if (existing) {
      skipped++;
      continue;
    }

    await createUserAccount({
      mobile: cleanMobile,
      password: cleanMobile,
      email: '',
      role: 'resident',
    });
    created++;
  }

  return { created, skipped };
};
