/**
 * Context-aware storage file names: `{page}-{purpose}[-{folder}]-{timestamp}[-{seq}].{ext}`
 * (UUID prefix is added server-side in storage paths.)
 */

export type UploadPage =
  | 'media-library'
  | 'projects'
  | 'blog'
  | 'testimonials'
  | 'settings'
  | 'quick-add'
  | 'contact-messages'
  | 'shell'
  | 'customization';

export type UploadPurpose =
  | 'library-asset'
  | 'library-replace'
  | 'project-featured'
  | 'project-gallery'
  | 'blog-featured'
  | 'testimonial-avatar'
  | 'profile-avatar'
  | 'profile-cover'
  | 'user-avatar'
  | 'contact-reply-attachment'
  | 'custom-font';

export type BuildUploadFileNameOptions = {
  /** 1-based index when multiple files upload in one action (e.g. gallery). */
  sequence?: number;
  /** Optional storage folder slug (e.g. projects, blog). */
  mediaFolder?: string;
  /** Override extension (with or without leading dot). */
  extension?: string;
};

function sanitizeSegment(value: string, maxLen = 48) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLen);
}

function uploadTimestamp(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function extensionFromFileName(fileName: string) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(String(fileName || ''));
  return match ? `.${match[1].toLowerCase()}` : '';
}

export function extensionForUploadMime(mimeType: string) {
  const mime = String(mimeType || 'application/octet-stream').split(';')[0].trim().toLowerCase();
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip',
    'font/woff': '.woff',
    'font/woff2': '.woff2',
    'font/ttf': '.ttf',
    'font/otf': '.otf',
    'application/font-woff': '.woff',
    'application/font-woff2': '.woff2',
    'application/x-font-woff': '.woff',
    'application/x-font-ttf': '.ttf',
    'application/x-font-otf': '.otf',
  };
  return map[mime] || extensionFromFileName('');
}

export function buildUploadFileName(
  page: UploadPage,
  purpose: UploadPurpose,
  originalFileName: string,
  options: BuildUploadFileNameOptions = {},
) {
  const pagePart = sanitizeSegment(page, 32);
  const purposePart = sanitizeSegment(purpose, 40);
  const folderPart = options.mediaFolder ? sanitizeSegment(options.mediaFolder, 24) : '';
  const stamp = uploadTimestamp();
  const seq =
    options.sequence != null && options.sequence > 0
      ? String(options.sequence).padStart(2, '0')
      : '';

  const extRaw = options.extension ?? extensionFromFileName(originalFileName) ?? '';
  const ext = extRaw ? (extRaw.startsWith('.') ? extRaw : `.${extRaw}`) : '';

  const parts = [pagePart, purposePart];
  if (folderPart) parts.push(folderPart);
  parts.push(stamp);
  if (seq) parts.push(seq);

  const base = parts.filter(Boolean).join('-');
  return `${base}${ext || '.bin'}`;
}

export function isUploadPage(value: string): value is UploadPage {
  return (
    value === 'media-library' ||
    value === 'projects' ||
    value === 'blog' ||
    value === 'testimonials' ||
    value === 'settings' ||
    value === 'quick-add' ||
    value === 'contact-messages' ||
    value === 'shell' ||
    value === 'customization'
  );
}

export function isUploadPurpose(value: string): value is UploadPurpose {
  const purposes: UploadPurpose[] = [
    'library-asset',
    'library-replace',
    'project-featured',
    'project-gallery',
    'blog-featured',
    'testimonial-avatar',
    'profile-avatar',
    'profile-cover',
    'user-avatar',
    'contact-reply-attachment',
    'custom-font',
  ];
  return purposes.includes(value as UploadPurpose);
}
