/**
 * ==============================================================================
 * File: scripts/createResidentUsers.js
 * Description: Batch creates resident user rows in Firestore from a list of numbers.
 * 
 * Rules:
 * - mobile: mobile number
 * - password: same as mobile number
 * - email: ""
 * - role: "resident"
 * 
 * Usage:
 *   1. Paste your mobile numbers into the MOBILE_NUMBERS array below.
 *   2. Run: node scripts/createResidentUsers.js
 * ==============================================================================
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// ==============================================================================
// 📱 PASTE YOUR LIST OF MOBILE NUMBERS HERE:
// ==============================================================================
export const MOBILE_NUMBERS = [
  '9491400907',
  '9440545487',
  '9652507033',
  '9703700354',
  '6370749990',
  '4798718290',
  '8977733348',
  '8886160866',
  '8478263963',
  '8977733349',
  '8919108727',
  '9652507233',
  '8260799260',
  '7207304023',
  '9490236689',
  '9581811336',
  '7893088444',
  '7207451846',
  '8248673541',
  '7799777425',
  '9689840943',
  '7793944499',
  '8248459476',
  '9160434921'
];

// Helper to load .env file if available
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...vals] = trimmed.split('=');
        if (key && vals.length > 0) {
          process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
  }
}

loadEnv();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function createResidentUsersFromList() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Firebase credentials not found in .env file.');
    console.error('Please ensure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID are set in .env');
    return;
  }

  console.log(`🔌 Connecting to Firebase project: ${firebaseConfig.projectId}...`);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const usersCollection = collection(db, 'users');

  // 1. Fetch existing users to avoid duplicates
  console.log('🔍 Checking existing users in Firestore...');
  const existingUsersSnap = await getDocs(usersCollection);
  const existingMobiles = new Set();
  existingUsersSnap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.mobile) {
      existingMobiles.add(String(data.mobile).trim());
    }
  });

  console.log(`Found ${existingMobiles.size} existing accounts in Firestore.`);
  console.log(`Processing list of ${MOBILE_NUMBERS.length} numbers...\n`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const rawNumber of MOBILE_NUMBERS) {
    const cleanMobile = String(rawNumber).replace(/\D/g, '').trim();

    if (!cleanMobile) {
      continue;
    }

    if (existingMobiles.has(cleanMobile)) {
      console.log(`⏩ [Skipped] Mobile ${cleanMobile} already exists.`);
      skippedCount++;
      continue;
    }

    const newUserDoc = {
      mobile: cleanMobile,
      password: cleanMobile, // password is same as mobile number
      email: '',            // email is empty
      role: 'resident',      // role is resident
    };

    try {
      const docRef = await addDoc(usersCollection, newUserDoc);
      console.log(`✅ [Created] Mobile: ${cleanMobile} | Password: ${cleanMobile} (ID: ${docRef.id})`);
      existingMobiles.add(cleanMobile);
      createdCount++;
    } catch (err) {
      console.error(`❌ [Error] Failed for ${cleanMobile}:`, err.message);
    }
  }

  console.log('\n========================================');
  console.log(`🎉 Finished! Created: ${createdCount} new accounts | Skipped: ${skippedCount} existing`);
  console.log('========================================\n');
}

createResidentUsersFromList().catch(console.error);
