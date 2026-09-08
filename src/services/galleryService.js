/**
 * ==============================================================================
 * File: src/services/galleryService.js
 * Description: Gallery Media Data Access Layer (AWS S3 + Firebase Firestore)
 * 
 * Rules:
 * 1. STRICT NO-ARRAY RULE: Every field in the Firestore document is a scalar value.
 *    Media lists are stored as JSON string `mediaFilesJson`.
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
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from '../firebase/firestore';
import { isVideoMedia } from '../utils/s3Utils';

// Firestore collection name
const GALLERY_COLLECTION = 'gallery';

// Local storage key for fallback simulation
const LOCAL_STORAGE_GALLERY_KEY = 'hvp_gallery_db';

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
 * Helper to parse media item and normalize mediaFiles.
 * Supports S3 URLs, direct media URLs, and legacy posts.
 * @param {object} rawItem
 * @returns {object}
 */
export const normalizeMediaPost = (rawItem) => {
  if (!rawItem) return null;

  let parsedFiles = [];
  if (rawItem.mediaFilesJson && typeof rawItem.mediaFilesJson === 'string') {
    try {
      parsedFiles = JSON.parse(rawItem.mediaFilesJson);
    } catch (e) {
      console.warn('Failed to parse mediaFilesJson:', e);
    }
  }

  // If no parsed files, construct from single post scalar fields
  if (!parsedFiles || parsedFiles.length === 0) {
    const singleUrl = rawItem.s3Url || rawItem.mediaUrl || rawItem.driveLink || rawItem.thumbnailUrl || '';
    if (singleUrl) {
      const isVideo = rawItem.mediaType === 'video' || isVideoMedia(singleUrl);
      parsedFiles = [
        {
          id: rawItem.s3Key || rawItem.driveFileId || 'file_0',
          s3Url: singleUrl,
          s3Key: rawItem.s3Key || '',
          thumbnailUrl: rawItem.thumbnailUrl || singleUrl,
          mediaType: isVideo ? 'video' : 'image',
          name: rawItem.title || 'Media file',
          size: rawItem.fileSize || 0,
        },
      ];
    }
  }

  const primaryFile = parsedFiles[0] || {};
  const mediaCount = parsedFiles.length || 1;
  const hasVideo = parsedFiles.some((f) => f.mediaType === 'video' || isVideoMedia(f.s3Url || f.thumbnailUrl));

  const primaryUrl = primaryFile.s3Url || rawItem.s3Url || rawItem.mediaUrl || primaryFile.thumbnailUrl || rawItem.thumbnailUrl || '';
  const primaryThumb = primaryFile.thumbnailUrl || rawItem.thumbnailUrl || primaryUrl;

  return {
    ...rawItem,
    mediaFiles: parsedFiles,
    mediaCount,
    hasVideo,
    s3Url: primaryUrl,
    s3Key: primaryFile.s3Key || rawItem.s3Key || '',
    thumbnailUrl: primaryThumb,
    mediaType: rawItem.mediaType || (hasVideo ? 'video' : 'image'),
  };
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
        return normalizeMediaPost({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        });
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
  const filtered = localItems
    .filter((item) => Number(item.month) === numMonth && Number(item.year) === numYear)
    .map(normalizeMediaPost);

  filtered.sort((a, b) => new Date(b.eventDate || b.createdAt || 0) - new Date(a.eventDate || a.createdAt || 0));
  return filtered;
};

/**
 * Create a new gallery media / post record with S3 files.
 * @param {object} itemData - Media post payload
 * @returns {Promise<object>} Created media item with generated ID
 */
export const createMediaItem = async (itemData) => {
  // Normalize media files array
  const filesList = Array.isArray(itemData.mediaFiles) && itemData.mediaFiles.length > 0
    ? itemData.mediaFiles
    : [
        {
          id: itemData.s3Key || `file_${Date.now()}`,
          s3Url: itemData.s3Url || itemData.thumbnailUrl || '',
          s3Key: itemData.s3Key || '',
          thumbnailUrl: itemData.thumbnailUrl || itemData.s3Url || '',
          mediaType: itemData.mediaType || 'image',
          name: itemData.title || 'Media File',
          size: Number(itemData.fileSize) || 0,
        },
      ];

  const primaryFile = filesList[0] || {};
  const primaryUrl = primaryFile.s3Url || itemData.s3Url || '';
  const primaryThumb = primaryFile.thumbnailUrl || itemData.thumbnailUrl || primaryUrl;
  const isVideo = filesList.some((f) => f.mediaType === 'video' || isVideoMedia(f.s3Url));

  const totalSize = filesList.reduce((acc, f) => acc + (f.size || 0), 0);

  const payload = {
    title: itemData.title ? itemData.title.trim() : 'Untitled Event',
    description: itemData.description ? itemData.description.trim() : '',
    mediaType: itemData.mediaType || (isVideo ? 'video' : 'image'),
    s3Url: primaryUrl,
    s3Key: primaryFile.s3Key || itemData.s3Key || '',
    thumbnailUrl: primaryThumb,
    album: itemData.album ? itemData.album.trim() : 'General',
    month: Number(itemData.month) || new Date().getMonth() + 1,
    year: Number(itemData.year) || new Date().getFullYear(),
    eventDate: itemData.eventDate || new Date().toISOString().split('T')[0],
    fileSize: totalSize || Number(itemData.fileSize) || 0,
    mediaCount: filesList.length,
    mediaFilesJson: JSON.stringify(filesList), // Scalar JSON string to satisfy strict no-array rule
    uploadedBy: itemData.uploadedBy || 'Admin/Media',
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

      return normalizeMediaPost({
        id: docRef.id,
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
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
  return normalizeMediaPost(newItem);
};

/**
 * Update an existing gallery media post.
 * @param {string} id - Document ID
 * @param {object} updateData - Partial update payload
 * @returns {Promise<object>} Updated document
 */
export const updateMediaItem = async (id, updateData) => {
  if (!id) throw new Error('Cannot update media item without a valid ID.');

  const payload = {};

  if (updateData.title !== undefined) payload.title = updateData.title.trim();
  if (updateData.description !== undefined) payload.description = updateData.description.trim();
  if (updateData.album !== undefined) payload.album = updateData.album.trim();
  if (updateData.month !== undefined) payload.month = Number(updateData.month);
  if (updateData.year !== undefined) payload.year = Number(updateData.year);
  if (updateData.eventDate !== undefined) payload.eventDate = updateData.eventDate;
  if (updateData.mediaType !== undefined) payload.mediaType = updateData.mediaType;

  if (Array.isArray(updateData.mediaFiles) && updateData.mediaFiles.length > 0) {
    payload.mediaFilesJson = JSON.stringify(updateData.mediaFiles);
    payload.mediaCount = updateData.mediaFiles.length;
    const primary = updateData.mediaFiles[0];
    if (primary) {
      payload.s3Url = primary.s3Url || '';
      payload.s3Key = primary.s3Key || '';
      payload.thumbnailUrl = primary.thumbnailUrl || primary.s3Url || '';
    }
  } else if (updateData.s3Url !== undefined) {
    payload.s3Url = updateData.s3Url.trim();
    payload.thumbnailUrl = updateData.thumbnailUrl || updateData.s3Url.trim();
  }

  assertNoArrayFields(payload);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, GALLERY_COLLECTION, id);
      await updateDoc(docRef, {
        ...payload,
        updatedAt: serverTimestamp(),
      });

      return normalizeMediaPost({ id, ...payload, updatedAt: new Date().toISOString() });
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
    return normalizeMediaPost(localItems[index]);
  }

  throw new Error(`Media item with ID ${id} not found in local records.`);
};

/**
 * Delete a gallery media record from Firestore.
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
