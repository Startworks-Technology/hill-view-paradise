/**
 * ==============================================================================
 * File: src/services/s3Service.js
 * Description: AWS S3 Media Upload & Management Service with Client-Side Compression
 * 
 * Features:
 * 1. Automatic client-side image compression before S3 upload (saves bandwidth & S3 cost).
 * 2. Direct browser-to-S3 uploads with `@aws-sdk/client-s3`.
 * 3. Organized directory paths: `gallery/{year}/{month}/{prefix}_{name}_{timestamp}.ext`.
 * 4. Media MIME type auto-detection (images & video formats).
 * 5. Graceful local mock preview fallback if AWS credentials are not yet configured in `.env`.
 * ==============================================================================
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { generateS3Key, buildS3PublicUrl, isVideoMedia } from '../utils/s3Utils';
import { compressImageFile } from '../utils/imageCompressor';

const region = import.meta.env.VITE_AWS_REGION || 'ap-south-1';
const bucket = import.meta.env.VITE_AWS_S3_BUCKET || '';
const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID || '';
const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '';
const cloudFrontDomain = import.meta.env.VITE_AWS_CLOUDFRONT_DOMAIN || '';

/**
 * Flag to verify whether live AWS credentials are fully configured.
 */
export const isS3Configured = Boolean(
  bucket &&
  bucket !== 'your_s3_bucket_here' &&
  accessKeyId &&
  accessKeyId !== 'your_access_key_here' &&
  secretAccessKey &&
  secretAccessKey !== 'your_secret_key_here'
);

let s3Client = null;

if (isS3Configured) {
  try {
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  } catch (err) {
    console.error('Failed to initialize AWS S3 Client:', err);
  }
} else {
  console.info(
    'ℹ️ AWS S3 credentials are not configured or using placeholders in .env. Running S3 service in Local Simulation Mode.'
  );
}

/**
 * Upload a single File / Blob directly to AWS S3, automatically compressing images first.
 * 
 * @param {object} params
 * @param {File} params.file - File object from input
 * @param {number|string} params.month - Month (1-12)
 * @param {number|string} params.year - Year (e.g. 2026)
 * @param {string} [params.customPrefix] - e.g. post title
 * @param {function} [params.onProgress] - Callback (percentage 0-100)
 * @returns {Promise<object>} Uploaded media metadata { s3Key, s3Url, mediaType, name, size, thumbnailUrl }
 */
export const uploadMediaFileToS3 = async ({
  file,
  month,
  year,
  customPrefix = 'media',
  onProgress,
}) => {
  if (!file) throw new Error('No file provided for S3 upload.');

  // 1. Automatically compress image before upload (videos bypass compression)
  const isVideo = isVideoMedia(file);
  const fileToUpload = isVideo ? file : await compressImageFile(file);

  const mediaType = isVideo ? 'video' : 'image';
  const s3Key = generateS3Key({
    year,
    month,
    originalFileName: fileToUpload.name,
    customPrefix,
  });

  const contentType = fileToUpload.type || (isVideo ? 'video/mp4' : 'image/jpeg');

  // Real AWS S3 Upload
  if (isS3Configured && s3Client) {
    try {
      if (onProgress) onProgress(10);

      const arrayBuffer = await fileToUpload.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      if (onProgress) onProgress(40);

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: uint8Array,
        ContentType: contentType,
      });

      await s3Client.send(command);

      if (onProgress) onProgress(100);

      const publicUrl = buildS3PublicUrl(s3Key, bucket, region, cloudFrontDomain);

      return {
        id: `s3_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        s3Key,
        s3Url: publicUrl,
        thumbnailUrl: publicUrl,
        mediaType,
        name: fileToUpload.name,
        size: fileToUpload.size,
        contentType,
      };
    } catch (err) {
      console.error('S3 PutObject failed:', err);
      throw new Error(`AWS S3 Upload Error: ${err.message || 'Failed to upload to S3'}`);
    }
  }

  // Local Simulation Fallback (when AWS credentials are not in .env)
  if (onProgress) {
    onProgress(30);
    await new Promise((res) => setTimeout(res, 200));
    onProgress(70);
    await new Promise((res) => setTimeout(res, 200));
    onProgress(100);
  }

  const localPreviewUrl = isVideo ? URL.createObjectURL(fileToUpload) : await readFileAsDataUrl(fileToUpload);

  return {
    id: `sim_s3_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    s3Key,
    s3Url: localPreviewUrl,
    thumbnailUrl: localPreviewUrl,
    mediaType,
    name: fileToUpload.name,
    size: fileToUpload.size,
    contentType,
  };
};

/**
 * Delete a media object from AWS S3.
 * 
 * @param {string} s3KeyOrUrl - S3 Object Key or full URL
 * @returns {Promise<boolean>}
 */
export const deleteMediaFileFromS3 = async (s3KeyOrUrl) => {
  if (!s3KeyOrUrl) return false;

  let s3Key = s3KeyOrUrl;

  // Extract S3 Key if full URL was passed
  if (s3KeyOrUrl.startsWith('http://') || s3KeyOrUrl.startsWith('https://')) {
    try {
      const url = new URL(s3KeyOrUrl);
      s3Key = url.pathname.replace(/^\/+/, '');
      // If URL contains bucket in pathname: bucket/gallery/...
      if (bucket && s3Key.startsWith(`${bucket}/`)) {
        s3Key = s3Key.replace(`${bucket}/`, '');
      }
    } catch (e) {
      console.warn('Could not parse S3 key from URL:', s3KeyOrUrl);
    }
  }

  if (isS3Configured && s3Client) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: s3Key,
      });
      await s3Client.send(command);
      return true;
    } catch (err) {
      console.warn('Failed to delete object from S3:', err);
      return false;
    }
  }

  return true;
};

/**
 * Helper to read File as Base64 for local offline simulation.
 */
const readFileAsDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
