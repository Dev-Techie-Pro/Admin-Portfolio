// @ts-nocheck
import {
  handleFileValidation,
  isSupportedImageType,
  MAX_CONTACT_ATTACHMENT_BYTES,
  MAX_UPLOAD_IMAGE_BYTES,
  readOptimizedImageBlob,
} from './files.js';
import {
  compressPresetForUploadFolder,
  extensionForMime,
  type ImageCompressOptions,
} from './image-compress.js';
import { showToast } from '../modules/shell/toast.js';
import {
  buildUploadFileName,
  extensionForUploadMime,
  type UploadPage,
  type UploadPurpose,
} from './upload-file-name.js';

export class MediaUploadError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MediaUploadError';
  }
}

export type CmsUploadFolder =
  | 'general'
  | 'projects'
  | 'avatars'
  | 'icons'
  | 'blog'
  | 'testimonials'
  | 'contact';

type OptimizeOptions = ImageCompressOptions | false;

type UploadOptions = {
  folder?: CmsUploadFolder;
  mode?: 'image' | 'contact' | 'font';
  /** `false` skips compression; omit or pass options to tune (defaults from upload folder). */
  optimize?: OptimizeOptions;
  /** When set with `purpose`, storage uses a generated name instead of the original file name. */
  page?: UploadPage;
  purpose?: UploadPurpose;
  /** 1-based index for multi-file uploads (gallery, batch library upload). */
  sequence?: number;
  fileName?: string;
};

function resolveContextualUploadName(
  file: File,
  options: UploadOptions,
  folder: CmsUploadFolder,
  mimeType: string,
  reencoded: boolean,
) {
  if (options.fileName) return options.fileName;
  if (options.page && options.purpose) {
    const ext =
      reencoded ? extensionForMime(mimeType) : extensionForUploadMime(mimeType) || undefined;
    return buildUploadFileName(options.page, options.purpose, file.name, {
      mediaFolder: folder,
      sequence: options.sequence,
      extension: ext,
    });
  }
  if (!reencoded) return file.name;
  const ext = extensionForMime(mimeType);
  return file.name.replace(/\.[^.]+$/, '') + ext;
}

function resolveOptimizeForUpload(
  folder: CmsUploadFolder,
  mode: UploadOptions['mode'],
  optimize: OptimizeOptions | undefined,
): ImageCompressOptions | false {
  if (optimize === false || mode === 'font') return false;
  const preset = compressPresetForUploadFolder(folder);
  if (optimize && typeof optimize === 'object') {
    return { preset, ...optimize };
  }
  return { preset };
}

async function prepareImageBlob(
  file: File,
  folder: CmsUploadFolder,
  optimize: ImageCompressOptions | false,
) {
  if (optimize === false) {
    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      throw new MediaUploadError('Image exceeds the 10MB limit. Try a smaller file.');
    }
    return { blob: file as Blob, mimeType: file.type };
  }

  const maxBytes =
    folder === 'contact'
      ? MAX_CONTACT_ATTACHMENT_BYTES
      : MAX_UPLOAD_IMAGE_BYTES;

  const { blob, mimeType } = await readOptimizedImageBlob(file, {
    ...optimize,
    maxBytes: optimize.maxBytes ?? maxBytes,
  });

  if (blob.size > maxBytes) {
    throw new MediaUploadError(
      folder === 'contact'
        ? 'Attachment is still too large after compression (5MB max).'
        : 'Image is still too large after compression (10MB max).',
    );
  }

  return { blob, mimeType };
}

async function postUploadForm(form: FormData) {
  const res = await fetch('/api/media/upload', {
    method: 'POST',
    body: form,
    credentials: 'same-origin',
  });
  if (res.status === 401) {
    window.location.href = '/login';
    throw new MediaUploadError('Session expired. Please sign in again.');
  }
  const raw = await res.text();
  let payload: { error?: string; url?: string } = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = {};
  }
  if (!res.ok) {
    throw new MediaUploadError(payload.error || raw || 'Upload failed.');
  }
  return payload;
}

/**
 * Upload a file to Supabase Storage via the CMS API. Returns a public HTTPS URL.
 * Raster images are compressed automatically unless `optimize: false`.
 */
export async function uploadCmsFile(file: File, options: UploadOptions = {}) {
  if (!file) throw new MediaUploadError('No file selected.');

  const mode = options.mode || 'image';
  const folder = options.folder || 'general';
  const isRasterUpload = mode === 'image' || (mode === 'contact' && isSupportedImageType(file));
  const optimize =
    isRasterUpload && options.optimize !== false
      ? resolveOptimizeForUpload(folder, mode, options.optimize)
      : false;

  if (isRasterUpload && !handleFileValidation(file)) {
    throw new MediaUploadError('Invalid image file.');
  }

  const form = new FormData();
  form.append('folder', folder);
  form.append('mode', mode);
  if (options.page) form.append('page', options.page);
  if (options.purpose) form.append('purpose', options.purpose);
  if (options.sequence != null && options.sequence > 0) {
    form.append('sequence', String(options.sequence));
  }
  form.append('originalFileName', file.name);

  let uploadBlob: Blob = file;
  let uploadMime = file.type;
  const willReencode = isRasterUpload && optimize !== false;

  if (isRasterUpload) {
    const prepared = await prepareImageBlob(file, folder, optimize);
    uploadBlob = prepared.blob;
    uploadMime = prepared.mimeType;
  }

  const uploadName = resolveContextualUploadName(
    file,
    options,
    folder,
    uploadMime,
    willReencode,
  );

  form.append('file', uploadBlob, uploadName);

  const payload = await postUploadForm(form);
  if (!payload.url) throw new MediaUploadError('Upload did not return a URL.');

  return {
    url: payload.url as string,
    storagePath: (payload as { storagePath?: string }).storagePath || '',
    fileName: (payload as { fileName?: string }).fileName || uploadName,
    size: Number((payload as { size?: number }).size) || uploadBlob.size,
    mimeType: (payload as { mimeType?: string }).mimeType || uploadMime,
    folder: (payload as { folder?: string }).folder || folder,
  };
}

/** Upload with instant object-URL preview; revokes preview URL when done. */
export async function uploadCmsFileWithPreview(
  file: File,
  options: UploadOptions & { onPreview?: (previewUrl: string) => void } = {},
) {
  const previewUrl = URL.createObjectURL(file);
  options.onPreview?.(previewUrl);
  try {
    return await uploadCmsFile(file, options);
  } finally {
    queueMicrotask(() => URL.revokeObjectURL(previewUrl));
  }
}

export async function uploadContactAttachment(file: File) {
  if (!file) throw new MediaUploadError('No file selected.');

  if (isSupportedImageType(file)) {
    if (!handleFileValidation(file)) {
      throw new MediaUploadError('Invalid image file.');
    }
    return uploadCmsFile(file, {
      folder: 'contact',
      mode: 'contact',
      page: 'contact-messages',
      purpose: 'contact-reply-attachment',
      optimize: { preset: 'general', maxBytes: MAX_CONTACT_ATTACHMENT_BYTES },
    });
  }

  if (file.size > MAX_CONTACT_ATTACHMENT_BYTES) {
    showToast('Attachment exceeds the 5MB limit.', 'danger');
    throw new MediaUploadError('Attachment exceeds the 5MB limit.');
  }
  return uploadCmsFile(file, {
    folder: 'contact',
    mode: 'contact',
    page: 'contact-messages',
    purpose: 'contact-reply-attachment',
    optimize: false,
  });
}

export async function uploadCustomFontFile(file: File) {
  return uploadCmsFile(file, {
    folder: 'general',
    mode: 'font',
    optimize: false,
    page: 'customization',
    purpose: 'custom-font',
  });
}
