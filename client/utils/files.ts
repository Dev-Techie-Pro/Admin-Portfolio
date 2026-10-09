import { showToast } from '../modules/shell/toast.js';
import {
  compressImageFile,
  type ImageCompressOptions,
  resolveImageCompressOptions,
} from './image-compress.js';

export const VALID_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const MAX_SOURCE_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_UPLOAD_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_CONTACT_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function readOptimizedImageBlob(file, options: ImageCompressOptions = {}) {
  const resolved = resolveImageCompressOptions(options);
  return compressImageFile(file, {
    ...options,
    maxBytes: options.maxBytes ?? Math.min(resolved.maxBytes, MAX_UPLOAD_IMAGE_BYTES),
  });
}

export function readOptimizedImageDataUrl(file, options: ImageCompressOptions = {}) {
  return readOptimizedImageBlob(file, options).then(({ blob }) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  });
}

export function isSupportedImageType(file: File) {
  return VALID_IMAGE_TYPES.includes(file.type);
}

export function handleFileValidation(file) {
  if (!isSupportedImageType(file)) {
    showToast(`"${file.name}" — only PNG, JPG, WebP, or GIF images are supported.`, 'danger');
    return false;
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    showToast(`"${file.name}" — image is too large (max ${Math.round(MAX_SOURCE_IMAGE_BYTES / (1024 * 1024))}MB before compression).`, 'danger');
    return false;
  }
  return true;
}

export async function readValidFiles(fileList, { folder = 'general', page, purpose, sequenceStart = 0 } = {}) {
  const { uploadCmsFile } = await import('./media-upload.js');
  const files = Array.from(fileList || []);
  const results = [];
  let seq = sequenceStart;
  for (const file of files) {
    if (!handleFileValidation(file)) continue;
    seq += 1;
    try {
      const uploaded = await uploadCmsFile(file, {
        folder,
        page: page || 'media-library',
        purpose: purpose || 'library-asset',
        sequence: seq,
      });
      results.push({
        url: uploaded.url,
        name: uploaded.fileName || file.name,
        size: uploaded.size || file.size,
        type: uploaded.mimeType || file.type,
      });
    } catch {
    }
  }
  return results;
}
