/**
 * ==============================================================================
 * File: src/utils/s3Utils.js
 * Description: AWS S3 Media & URL Utility Functions
 * ==============================================================================
 */

/**
 * Format bytes to human-readable string (KB, MB, GB).
 * @param {number} bytes
 * @param {number} decimals
 * @returns {string}
 */
export const formatFileSize = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Check if a file or URL points to a video.
 * @param {string|object} fileOrUrl
 * @returns {boolean}
 */
export const isVideoMedia = (fileOrUrl) => {
  if (!fileOrUrl) return false;
  if (typeof fileOrUrl === 'object') {
    if (fileOrUrl.mediaType === 'video') return true;
    if (fileOrUrl.type && fileOrUrl.type.startsWith('video/')) return true;
    if (fileOrUrl.name) {
      return /\.(mp4|webm|ogg|mov|m4v)$/i.test(fileOrUrl.name);
    }
  }
  if (typeof fileOrUrl === 'string') {
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(fileOrUrl) || fileOrUrl.includes('video');
  }
  return false;
};

/**
 * Generate a clean, sanitized S3 Object Key for a gallery file.
 * @param {object} params
 * @param {number|string} params.year
 * @param {number|string} params.month
 * @param {string} params.originalFileName
 * @param {string} [params.customPrefix]
 * @returns {string} e.g. "gallery/2026/09/sports_day_1_1725785000.jpg"
 */
export const generateS3Key = ({ year, month, originalFileName, customPrefix = 'media' }) => {
  const safeYear = Number(year) || new Date().getFullYear();
  const safeMonth = String(Number(month) || new Date().getMonth() + 1).padStart(2, '0');
  
  const ext = originalFileName ? originalFileName.split('.').pop().toLowerCase() : 'jpg';
  const rawBaseName = originalFileName
    ? originalFileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
    : 'item';
    
  const cleanPrefix = customPrefix.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6);

  return `gallery/${safeYear}/${safeMonth}/${cleanPrefix}_${rawBaseName}_${timestamp}_${randomSuffix}.${ext}`;
};

/**
 * Construct public S3 / CloudFront URL from S3 bucket, region, and object key.
 * @param {string} s3Key
 * @param {string} [bucket]
 * @param {string} [region]
 * @param {string} [cloudFrontDomain]
 * @returns {string}
 */
export const buildS3PublicUrl = (s3Key, bucket, region, cloudFrontDomain) => {
  if (!s3Key) return '';
  if (s3Key.startsWith('http://') || s3Key.startsWith('https://')) {
    return s3Key;
  }
  if (cloudFrontDomain) {
    const cleanDomain = cloudFrontDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${cleanDomain}/${s3Key}`;
  }
  const cleanBucket = bucket || import.meta.env.VITE_AWS_S3_BUCKET || 'hillview-paradise-media';
  const cleanRegion = region || import.meta.env.VITE_AWS_REGION || 'ap-south-1';
  return `https://${cleanBucket}.s3.${cleanRegion}.amazonaws.com/${s3Key}`;
};
