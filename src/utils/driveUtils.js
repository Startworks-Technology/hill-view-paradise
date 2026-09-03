/**
 * ==============================================================================
 * File: src/utils/driveUtils.js
 * Description: Google Drive & Google Shared Drive URL Utilities & Converters
 * 
 * Features:
 * 1. Extract File ID or Folder ID from various Google Drive share URLs.
 * 2. Generate high-resolution direct thumbnail / preview URLs for images.
 * 3. Generate responsive embed preview URLs for Google Drive video playback.
 * 4. Generate direct view & download links.
 * ==============================================================================
 */

/**
 * Extracts Google Drive File ID or Folder ID from arbitrary Google Drive URLs.
 * Handles formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/file/d/FILE_ID/preview
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.google.com/drive/folders/FOLDER_ID
 * - https://drive.google.com/drive/u/0/folders/FOLDER_ID
 * - Raw ID string (25+ alphanumeric characters)
 * 
 * @param {string} url - Google Drive URL or ID
 * @returns {string|null} Extracted ID or null if not found
 */
export const extractDriveId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // If already a clean Google Drive alphanumeric ID
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return trimmed;
  }

  // Matches /file/d/ID, /d/ID, /folders/ID, or /shared-drives/ID
  const matchPath = trimmed.match(/\/(?:file\/d|d|folders|shared-drives)\/([a-zA-Z0-9_-]+)/i);
  if (matchPath && matchPath[1]) {
    return matchPath[1];
  }

  // Matches ?id=ID or &id=ID
  const matchQuery = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchQuery && matchQuery[1]) {
    return matchQuery[1];
  }

  return null;
};

/**
 * Checks if a given string looks like a Google Drive or Shared Drive URL.
 * @param {string} url
 * @returns {boolean}
 */
export const isGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('drive.google.com') || url.includes('docs.google.com') || extractDriveId(url) !== null;
};

/**
 * Generates a high-resolution direct thumbnail / preview URL for an image stored on Google Drive.
 * @param {string} driveUrlOrId - Google Drive link or File ID
 * @param {number} size - Desired max dimension in px (default: 1000)
 * @returns {string} Thumbnail URL
 */
export const getDriveThumbnailUrl = (driveUrlOrId, size = 1000) => {
  if (!driveUrlOrId) return '';
  const fileId = extractDriveId(driveUrlOrId);

  if (fileId) {
    // lh3.googleusercontent.com is Google's fast, high-performance thumbnail CDN for Drive files
    return `https://lh3.googleusercontent.com/d/${fileId}=w${size}`;
  }

  // If not a Google Drive URL, return original URL (e.g. direct image URL)
  return driveUrlOrId;
};

/**
 * Generates an alternative thumbnail URL via drive.google.com thumbnail endpoint.
 * @param {string} driveUrlOrId
 * @param {number} size
 * @returns {string}
 */
export const getDriveAltThumbnailUrl = (driveUrlOrId, size = 1000) => {
  const fileId = extractDriveId(driveUrlOrId);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
  }
  return driveUrlOrId || '';
};

/**
 * Generates an embed preview URL suitable for iframes (ideal for Google Drive video player or doc preview).
 * @param {string} driveUrlOrId
 * @returns {string}
 */
export const getDriveEmbedUrl = (driveUrlOrId) => {
  const fileId = extractDriveId(driveUrlOrId);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return driveUrlOrId || '';
};

/**
 * Generates a standard web view link for opening the file in Google Drive.
 * @param {string} driveUrlOrId
 * @returns {string}
 */
export const getDriveViewUrl = (driveUrlOrId) => {
  const fileId = extractDriveId(driveUrlOrId);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  }
  return driveUrlOrId || '';
};

/**
 * Generates a standard folder view link for opening a Shared Drive folder.
 * @param {string} folderUrlOrId
 * @returns {string}
 */
export const getDriveFolderUrl = (folderUrlOrId) => {
  const folderId = extractDriveId(folderUrlOrId);
  if (folderId) {
    return `https://drive.google.com/drive/folders/${folderId}`;
  }
  return folderUrlOrId || '';
};

/**
 * Formats file size in human-readable bytes.
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '';
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
};
