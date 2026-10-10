// @ts-nocheck
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from './constants';

export const MEDIA_BUCKET = 'media';

const MEDIA_FOLDERS = new Set([
  'general',
  'projects',
  'avatars',
  'icons',
  'blog',
  'testimonials',
  'contact',
]);

export const UPLOAD_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const UPLOAD_MAX_CONTACT_BYTES = 5 * 1024 * 1024;
export const UPLOAD_MAX_FONT_BYTES = 5 * 1024 * 1024;

export const UPLOAD_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export function sniffImageMime(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }
  if (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a') {
    return 'image/gif';
  }
  return null;
}

export const UPLOAD_CONTACT_MIMES = [
  ...UPLOAD_IMAGE_MIMES,
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
];

export const UPLOAD_FONT_MIMES = [
  'font/woff',
  'font/woff2',
  'font/ttf',
  'font/otf',
  'application/font-woff',
  'application/font-woff2',
  'application/x-font-woff',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/octet-stream',
];

export function getMediaPublicUrl(storagePath: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!base) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL.');
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${storagePath}`;
}

function sanitizeFileName(name: string) {
  return String(name || 'file')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'file';
}

export function normalizeUploadFolder(folder: string | null | undefined) {
  const key = String(folder || 'general').trim().toLowerCase();
  return MEDIA_FOLDERS.has(key) ? key : 'general';
}

export function assertAllowedUpload({
  mimeType,
  sizeBytes,
  folder,
  mode = 'image',
}: {
  mimeType: string;
  sizeBytes: number;
  folder: string;
  mode?: 'image' | 'contact' | 'font';
}) {
  const mime = (mimeType || 'application/octet-stream').split(';')[0].trim().toLowerCase();
  const normalizedFolder = normalizeUploadFolder(folder);

  if (mode === 'font') {
    if (sizeBytes > UPLOAD_MAX_FONT_BYTES) {
      throw new Error('Font file exceeds the 5MB limit.');
    }
    if (!UPLOAD_FONT_MIMES.includes(mime) && !mime.endsWith('font-woff2') && !mime.endsWith('font-woff')) {
      throw new Error('Unsupported font type. Use WOFF or WOFF2.');
    }
    return { mime, folder: normalizedFolder };
  }

  if (mode === 'contact' || normalizedFolder === 'contact') {
    if (sizeBytes > UPLOAD_MAX_CONTACT_BYTES) {
      throw new Error('Attachment exceeds the 5MB limit.');
    }
    if (!UPLOAD_CONTACT_MIMES.includes(mime)) {
      throw new Error('Unsupported attachment type.');
    }
    return { mime, folder: 'contact' };
  }

  if (sizeBytes > UPLOAD_MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds the 10MB limit.');
  }
  if (!UPLOAD_IMAGE_MIMES.includes(mime)) {
    throw new Error('Only PNG, JPG, WebP, or GIF images are supported.');
  }
  return { mime, folder: normalizedFolder };
}

export function assertBufferMatchesImageMime(buffer: Buffer, declaredMime: string) {
  const sniffed = sniffImageMime(buffer);
  const mime = (declaredMime || '').split(';')[0].trim().toLowerCase();
  if (!sniffed || sniffed !== mime) {
    throw new Error('File content does not match the declared image type.');
  }
}

export const VERCEL_PROXY_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

export async function createSignedMediaUpload({
  mimeType,
  fileName,
  folder = 'general',
  sizeBytes,
}: {
  mimeType: string;
  fileName: string;
  folder?: string;
  sizeBytes: number;
}) {
  const { mime, folder: resolvedFolder } = assertAllowedUpload({
    mimeType,
    sizeBytes,
    folder,
    mode: 'image',
  });
  const safeFolder = normalizeUploadFolder(resolvedFolder);
  const safeName = sanitizeFileName(fileName);
  const storagePath = `${SITE_ID}/${safeFolder}/${randomUUID()}-${safeName}`;

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(MEDIA_BUCKET).createSignedUploadUrl(storagePath);
  if (error || !data?.signedUrl) throw new Error(error?.message || 'Could not create upload URL.');

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    storagePath,
    publicUrl: getMediaPublicUrl(storagePath),
    fileName: safeName,
    mimeType: mime,
    folder: safeFolder,
  };
}

export async function uploadMediaBuffer({
  buffer,
  mimeType,
  fileName,
  folder = 'general',
}: {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  folder?: string;
}) {
  const safeFolder = normalizeUploadFolder(folder);
  const safeName = sanitizeFileName(fileName);
  const storagePath = `${SITE_ID}/${safeFolder}/${randomUUID()}-${safeName}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from(MEDIA_BUCKET).upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  return {
    url: getMediaPublicUrl(storagePath),
    storagePath,
    fileName: safeName,
    size: buffer.length,
    mimeType,
    folder: safeFolder,
  };
}
