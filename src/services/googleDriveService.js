/**
 * ==============================================================================
 * File: src/services/googleDriveService.js
 * Description: Automated Google Drive API Service (Auto-Folder & Direct Upload)
 * 
 * Capabilities:
 * 1. Client-Side OAuth Token generation via Google Identity Services (GIS).
 * 2. Auto-searches or Auto-creates month folders (e.g. `September 2026`) inside the Root Gallery Drive Folder.
 * 3. Direct multipart upload of images & videos directly into that month folder with `supportsAllDrives=true`.
 * 4. Automatically sets public read permissions on uploaded items.
 * ==============================================================================
 */

import { extractDriveId } from '../utils/driveUtils';

const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file';

let tokenClient = null;
let currentAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Dynamically loads the official Google Identity Services (GIS) client script.
 * @returns {Promise<void>}
 */
export const loadGoogleIdentityScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('google-gis-client');
    if (existingScript) {
      existingScript.onload = () => resolve();
      existingScript.onerror = (e) => reject(e);
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gis-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error('Failed to load Google Identity Services library: ' + err));
    document.body.appendChild(script);
  });
};

/**
 * Requests an OAuth 2.0 Access Token from the user via Google Identity Services.
 * @param {string} clientId - Google OAuth 2.0 Client ID
 * @returns {Promise<string>} OAuth Access Token
 */
export const getGoogleAccessToken = async (clientId) => {
  if (!clientId || clientId.trim() === '' || clientId.includes('your_client_id_here')) {
    throw new Error('Google OAuth Client ID is missing. Please check VITE_GOOGLE_CLIENT_ID in your .env file.');
  }

  const now = Date.now();
  if (currentAccessToken && tokenExpiresAt > now + 60000) {
    return currentAccessToken;
  }

  await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId.trim(),
        scope: DRIVE_SCOPES,
        callback: (response) => {
          if (response.error !== undefined) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          currentAccessToken = response.access_token;
          const expiresIn = response.expires_in ? Number(response.expires_in) * 1000 : 3600 * 1000;
          tokenExpiresAt = Date.now() + expiresIn;
          resolve(currentAccessToken);
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Searches for an existing month folder inside the root gallery folder.
 * If not found, automatically creates the month folder (e.g. `September 2026`) in Google Drive.
 * 
 * @param {object} params
 * @param {string} params.rootFolderId - Main root gallery folder ID (or URL)
 * @param {string} params.folderName - e.g. "September 2026"
 * @param {string} params.accessToken - OAuth access token
 * @returns {Promise<{ folderId: string, folderUrl: string, name: string }>}
 */
export const getOrCreateMonthFolder = async ({
  rootFolderId,
  folderName,
  accessToken,
}) => {
  if (!accessToken) throw new Error('Google Drive access token is required.');

  const cleanRootId = extractDriveId(rootFolderId) || (rootFolderId ? rootFolderId.trim() : null);

  // 1. Search for existing month folder inside root folder
  let searchQuery = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (cleanRootId) {
    searchQuery += ` and '${cleanRootId}' in parents`;
  }

  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,webViewLink)`;

  try {
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (listRes.ok) {
      const data = await listRes.json();
      if (data.files && data.files.length > 0) {
        const existing = data.files[0];
        return {
          folderId: existing.id,
          folderUrl: existing.webViewLink || `https://drive.google.com/drive/folders/${existing.id}`,
          name: existing.name,
        };
      }
    }
  } catch (searchErr) {
    console.warn('Could not search existing folder:', searchErr);
  }

  // 2. Folder does not exist: Create it STRICTLY inside the configured root folder
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (cleanRootId) {
    metadata.parents = [cleanRootId];
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to create "${folderName}" inside Google Drive folder (${cleanRootId || 'root'}).`);
  }

  const createdData = await createRes.json();
  const folderId = createdData.id;

  // 3. Set public viewer permission on the created folder
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions?supportsAllDrives=true`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });
  } catch (permErr) {
    console.warn('Could not set public permissions on month folder:', permErr);
  }

  const folderUrl = createdData.webViewLink || `https://drive.google.com/drive/folders/${folderId}`;

  return {
    folderId,
    folderUrl,
    name: folderName,
  };
};

/**
 * Uploads a file (photo or video) directly into the specified month's Google Drive folder.
 * 
 * @param {object} params
 * @param {File} params.file - File object to upload
 * @param {string} params.targetFolderId - Month folder ID in Google Drive
 * @param {string} params.accessToken - OAuth Access Token
 * @param {string} [params.customFileName] - Custom file title
 * @param {function} [params.onProgress] - Progress callback (0-100)
 * @returns {Promise<{ fileId: string, driveLink: string, webViewLink: string, name: string, mimeType: string, size: number }>}
 */
export const uploadFileToMonthFolder = async ({
  file,
  targetFolderId,
  accessToken,
  customFileName,
  onProgress,
}) => {
  if (!file) throw new Error('No file provided for upload.');
  if (!accessToken) throw new Error('Google Drive Access Token is missing.');

  const fileName = customFileName || file.name;
  const mimeType = file.type || 'application/octet-stream';

  const metadata = {
    name: fileName,
    mimeType: mimeType,
  };

  const cleanTargetId = extractDriveId(targetFolderId) || (targetFolderId ? targetFolderId.trim() : null);
  if (cleanTargetId) {
    metadata.parents = [cleanTargetId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataBlob = new Blob([
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n`
  ], { type: 'text/plain' });

  const closeBlob = new Blob([closeDelimiter], { type: 'text/plain' });

  const multipartBody = new Blob([metadataBlob, file, closeBlob], {
    type: `multipart/related; boundary=${boundary}`,
  });

  if (onProgress) onProgress(35);

  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink';

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: multipartBody,
  });

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Google Drive upload failed with status ${uploadResponse.status}`);
  }

  const uploadedData = await uploadResponse.json();
  const fileId = uploadedData.id;

  if (onProgress) onProgress(80);

  // Set file to anyone with link can view
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });
  } catch (permErr) {
    console.warn('Could not auto-set public read permission on uploaded file:', permErr);
  }

  if (onProgress) onProgress(100);

  const driveLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

  return {
    fileId,
    driveLink,
    thumbnailLink: uploadedData.thumbnailLink || null,
    webViewLink: uploadedData.webViewLink || driveLink,
    name: uploadedData.name,
    mimeType: uploadedData.mimeType,
    size: uploadedData.size ? Number(uploadedData.size) : file.size,
  };
};

/**
 * Deletes a file or folder from Google Drive.
 * @param {object} params
 * @param {string} params.fileId - Google Drive File or Folder ID
 * @param {string} params.accessToken - OAuth Access Token
 * @returns {Promise<void>}
 */
export const deleteFileFromGoogleDrive = async ({ fileId, accessToken }) => {
  if (!fileId || !accessToken) return;
  const cleanId = extractDriveId(fileId) || fileId.trim();

  try {
    const url = `https://www.googleapis.com/drive/v3/files/${cleanId}?supportsAllDrives=true`;
    await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    console.warn(`Failed to delete Google Drive file ${fileId}:`, err);
  }
};
