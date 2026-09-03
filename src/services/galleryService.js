/**
 * ==============================================================================
 * File: src/services/galleryService.js
 * Description: Gallery Media & Google Shared Drive Data Access Layer (CRUD)
 * 
 * Rules:
 * 1. STRICT NO-ARRAY RULE: Every field is a scalar value (string, number, Timestamp, null).
 * 2. Month and Year stored as separate scalar numbers for clean composite filtering.
 * 3. Graceful fallback to local storage if Firestore is unconfigured or in demo mode.
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
import { extractDriveId, getDriveThumbnailUrl } from '../utils/driveUtils';

// Firestore collection names
const GALLERY_COLLECTION = 'gallery';
const FOLDERS_COLLECTION = 'gallery_folders';

// Local storage keys for fallback simulation
const LOCAL_STORAGE_GALLERY_KEY = 'hvp_gallery_db';
const LOCAL_STORAGE_FOLDERS_KEY = 'hvp_gallery_folders_db';

/**
 * Helper to retrieve local mock media items from localStorage.
 * @returns {Array<object>}
 */
const getLocalGallery = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_GALLERY_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * Helper to persist local mock media items to localStorage.
 * @param {Array<object>} items
 */
const saveLocalGallery = (items) => {
  localStorage.setItem(LOCAL_STORAGE_GALLERY_KEY, JSON.stringify(items));
};

/**
 * Helper to retrieve local mock folders from localStorage.
 * @returns {Array<object>}
 */
const getLocalFolders = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_FOLDERS_KEY);
  return data ? JSON.parse(data) : [];
};

/**
 * Helper to persist local mock folders to localStorage.
 * @param {Array<object>} folders
 */
const saveLocalFolders = (folders) => {
  localStorage.setItem(LOCAL_STORAGE_FOLDERS_KEY, JSON.stringify(folders));
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
 * Fetch gallery media items for a specific month and year.
 * @param {number} month - Month number (1-12)
 * @param {number} year - Four-digit year (e.g. 2026)
 * @returns {Promise<Array<object>>} List of media items for the specified month
 */
export const getMediaByMonth = async (month, year) => {
  const numMonth = Number(month);
  const numYear = Number(year);

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, GALLERY_COLLECTION);
      const q = query(
        colRef,
        where('month', '==', numMonth),
        where('year', '==', numYear)
      );

      const snapshot = await getDocs(q);
      const items = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });

      // Sort client-side by eventDate or createdAt descending
      items.sort((a, b) => new Date(b.eventDate || b.createdAt || 0) - new Date(a.eventDate || a.createdAt || 0));
      return items;
    } catch (error) {
      console.warn('Firestore getMediaByMonth failed, falling back to local storage:', error);
    }
  }

  // Fallback: Local storage simulation
  const localItems = getLocalGallery();
  const filtered = localItems.filter(
    (item) => Number(item.month) === numMonth && Number(item.year) === numYear
  );
  filtered.sort((a, b) => new Date(b.eventDate || b.createdAt || 0) - new Date(a.eventDate || a.createdAt || 0));
  return filtered;
};

/**
 * Create a new gallery media record.
 * @param {object} itemData - Media item payload
 * @returns {Promise<object>} Created media item with generated ID
 */
export const createMediaItem = async (itemData) => {
  const driveFileId = extractDriveId(itemData.driveLink);
  const thumbnailUrl = itemData.thumbnailUrl || (driveFileId ? getDriveThumbnailUrl(driveFileId) : itemData.driveLink);

  const payload = {
    title: itemData.title ? itemData.title.trim() : 'Untitled Media',
    description: itemData.description ? itemData.description.trim() : '',
    mediaType: itemData.mediaType === 'video' ? 'video' : 'image',
    driveLink: itemData.driveLink ? itemData.driveLink.trim() : '',
    driveFileId: driveFileId || '',
    thumbnailUrl: thumbnailUrl || '',
    album: itemData.album ? itemData.album.trim() : 'General',
    month: Number(itemData.month) || new Date().getMonth() + 1,
    year: Number(itemData.year) || new Date().getFullYear(),
    eventDate: itemData.eventDate || new Date().toISOString().split('T')[0],
    fileSize: Number(itemData.fileSize) || 0,
    uploadedBy: itemData.uploadedBy || 'Administrator',
  };

  assertNoArrayFields(payload);

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, GALLERY_COLLECTION);
      const docRef = await addDoc(colRef, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        id: docRef.id,
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('Firestore createMediaItem failed, writing to local storage fallback:', error);
    }
  }

  // Fallback: Local storage
  const localItems = getLocalGallery();
  const newItem = {
    id: `local_media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localItems.unshift(newItem);
  saveLocalGallery(localItems);
  return newItem;
};

/**
 * Update an existing gallery media record.
 * @param {string} id - Document ID
 * @param {object} updateData - Partial update payload
 * @returns {Promise<object>} Updated document
 */
export const updateMediaItem = async (id, updateData) => {
  if (!id) throw new Error('Cannot update media item without a valid ID.');

  const driveFileId = updateData.driveLink !== undefined ? extractDriveId(updateData.driveLink) : undefined;

  const payload = {
    ...(updateData.title !== undefined && { title: updateData.title.trim() }),
    ...(updateData.description !== undefined && { description: updateData.description.trim() }),
    ...(updateData.mediaType !== undefined && { mediaType: updateData.mediaType }),
    ...(updateData.driveLink !== undefined && { driveLink: updateData.driveLink.trim() }),
    ...(driveFileId !== undefined && { driveFileId: driveFileId || '' }),
    ...(updateData.thumbnailUrl !== undefined && { thumbnailUrl: updateData.thumbnailUrl }),
    ...(updateData.album !== undefined && { album: updateData.album.trim() }),
    ...(updateData.month !== undefined && { month: Number(updateData.month) }),
    ...(updateData.year !== undefined && { year: Number(updateData.year) }),
    ...(updateData.eventDate !== undefined && { eventDate: updateData.eventDate }),
  };

  if (payload.driveLink && !payload.thumbnailUrl && driveFileId) {
    payload.thumbnailUrl = getDriveThumbnailUrl(driveFileId);
  }

  assertNoArrayFields(payload);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, GALLERY_COLLECTION, id);
      await updateDoc(docRef, {
        ...payload,
        updatedAt: serverTimestamp(),
      });

      return { id, ...payload, updatedAt: new Date().toISOString() };
    } catch (error) {
      console.warn('Firestore updateMediaItem failed, updating local storage:', error);
    }
  }

  // Fallback: Local storage
  const localItems = getLocalGallery();
  const index = localItems.findIndex((item) => item.id === id);
  if (index !== -1) {
    localItems[index] = {
      ...localItems[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    saveLocalGallery(localItems);
    return localItems[index];
  }

  throw new Error(`Media item with ID ${id} not found in local records.`);
};

/**
 * Delete a gallery media record.
 * @param {string} id - Document ID
 * @returns {Promise<boolean>}
 */
export const deleteMediaItem = async (id) => {
  if (!id) throw new Error('Cannot delete media item without a valid ID.');

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, GALLERY_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.warn('Firestore deleteMediaItem failed, removing from local storage:', error);
    }
  }

  // Fallback: Local storage
  const localItems = getLocalGallery();
  const filtered = localItems.filter((item) => item.id !== id);
  saveLocalGallery(filtered);
  return true;
};

/**
 * Get the Google Shared Drive Folder link configured for a specific month and year.
 * @param {number} month
 * @param {number} year
 * @returns {Promise<object|null>}
 */
export const getMonthlyDriveFolder = async (month, year) => {
  const numMonth = Number(month);
  const numYear = Number(year);

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, FOLDERS_COLLECTION);
      const q = query(
        colRef,
        where('month', '==', numMonth),
        where('year', '==', numYear)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() };
      }
    } catch (error) {
      console.warn('Firestore getMonthlyDriveFolder failed, checking local storage:', error);
    }
  }

  const localFolders = getLocalFolders();
  return (
    localFolders.find(
      (f) => Number(f.month) === numMonth && Number(f.year) === numYear
    ) || null
  );
};

/**
 * Set or update the Google Shared Drive Folder link for a specific month and year.
 * @param {number} month
 * @param {number} year
 * @param {string} driveFolderUrl
 * @param {string} [folderName]
 * @returns {Promise<object>}
 */
export const setMonthlyDriveFolder = async (month, year, driveFolderUrl, folderName = '') => {
  const numMonth = Number(month);
  const numYear = Number(year);
  const folderId = extractDriveId(driveFolderUrl);

  const payload = {
    month: numMonth,
    year: numYear,
    driveFolderUrl: driveFolderUrl.trim(),
    folderId: folderId || '',
    folderName: folderName ? folderName.trim() : `Gallery - ${month}/${year}`,
  };

  assertNoArrayFields(payload);

  if (isFirebaseConfigured && db) {
    try {
      const existing = await getMonthlyDriveFolder(month, year);
      if (existing && existing.id) {
        const docRef = doc(db, FOLDERS_COLLECTION, existing.id);
        await updateDoc(docRef, { ...payload, updatedAt: serverTimestamp() });
        return { id: existing.id, ...payload };
      } else {
        const colRef = collection(db, FOLDERS_COLLECTION);
        const docRef = await addDoc(colRef, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return { id: docRef.id, ...payload };
      }
    } catch (error) {
      console.warn('Firestore setMonthlyDriveFolder failed, saving to local storage:', error);
    }
  }

  // Fallback: Local storage
  const localFolders = getLocalFolders();
  const index = localFolders.findIndex(
    (f) => Number(f.month) === numMonth && Number(f.year) === numYear
  );

  const newFolder = {
    id: index !== -1 ? localFolders[index].id : `folder_${Date.now()}`,
    ...payload,
    updatedAt: new Date().toISOString(),
  };

  if (index !== -1) {
    localFolders[index] = newFolder;
  } else {
    localFolders.push(newFolder);
  }

  saveLocalFolders(localFolders);
  return newFolder;
};
