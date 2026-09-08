/**
 * ==============================================================================
 * File: api/s3-delete.js
 * Description: Vercel Serverless Function to Securely Delete S3 Objects
 * ==============================================================================
 */

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  if (!bucket || !accessKeyId || !secretAccessKey) {
    return res.status(500).json({
      error: 'AWS S3 credentials are not configured on the server.',
    });
  }

  try {
    const { s3Key } = req.body || {};

    if (!s3Key) {
      return res.status(400).json({ error: 'Missing s3Key parameter.' });
    }

    let cleanKey = s3Key;
    if (s3Key.startsWith('http://') || s3Key.startsWith('https://')) {
      try {
        const url = new URL(s3Key);
        cleanKey = url.pathname.replace(/^\/+/, '');
        if (bucket && cleanKey.startsWith(`${bucket}/`)) {
          cleanKey = cleanKey.replace(`${bucket}/`, '');
        }
      } catch (e) {
        console.warn('Could not parse S3 key from URL:', s3Key);
      }
    }

    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: cleanKey,
    });

    await s3Client.send(command);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to delete S3 object:', error);
    return res.status(500).json({
      error: error.message || 'Internal Server Error deleting S3 object',
    });
  }
}
