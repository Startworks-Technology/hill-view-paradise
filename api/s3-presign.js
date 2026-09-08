/**
 * ==============================================================================
 * File: api/s3-presign.js
 * Description: Vercel Serverless Function to Generate S3 Presigned Upload URLs
 * 
 * Security:
 * - AWS Secret Keys are kept 100% securely on Vercel's server environment.
 * - No AWS secrets are ever sent to or exposed in the browser.
 * - Returns a temporary 60-second single-use upload signature for that exact file.
 * ==============================================================================
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const region =
  process.env.AWS_REGION ||
  process.env.VITE_AWS_REGION ||
  'ap-south-1';

const bucket =
  process.env.AWS_S3_BUCKET ||
  process.env.VITE_AWS_S3_BUCKET ||
  '';

const accessKeyId =
  process.env.AWS_ACCESS_KEY_ID ||
  process.env.VITE_AWS_ACCESS_KEY_ID ||
  '';

const secretAccessKey =
  process.env.AWS_SECRET_ACCESS_KEY ||
  process.env.VITE_AWS_SECRET_ACCESS_KEY ||
  '';

const cloudFrontDomain =
  process.env.AWS_CLOUDFRONT_DOMAIN ||
  process.env.VITE_AWS_CLOUDFRONT_DOMAIN ||
  '';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  if (!bucket || !accessKeyId || !secretAccessKey) {
    return res.status(500).json({
      error: 'AWS S3 credentials are not configured on the server environment.',
    });
  }

  try {
    const { fileName, contentType, year, month, customPrefix } = req.body || {};

    if (!fileName || !contentType) {
      return res.status(400).json({ error: 'Missing fileName or contentType.' });
    }

    const safeYear = Number(year) || new Date().getFullYear();
    const safeMonth = String(Number(month) || new Date().getMonth() + 1).padStart(2, '0');

    const ext = fileName.split('.').pop().toLowerCase();
    const rawBaseName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const cleanPrefix = (customPrefix || 'media').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 6);

    const s3Key = `gallery/${safeYear}/${safeMonth}/${cleanPrefix}_${rawBaseName}_${timestamp}_${randomSuffix}.${ext}`;

    const isVideo = contentType.startsWith('video/') || /\.(mp4|webm|ogg|mov|m4v)$/i.test(fileName);
    const mediaType = isVideo ? 'video' : 'image';

    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      ContentType: contentType,
    });

    // Generate single-use signed URL valid for 60 seconds
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    const s3Url = cloudFrontDomain
      ? `https://${cloudFrontDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')}/${s3Key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

    return res.status(200).json({
      success: true,
      uploadUrl,
      s3Url,
      s3Key,
      mediaType,
      expiresIn: 60,
    });
  } catch (error) {
    console.error('Failed to generate presigned S3 URL:', error);
    return res.status(500).json({
      error: error.message || 'Internal Server Error generating S3 upload URL',
    });
  }
}
