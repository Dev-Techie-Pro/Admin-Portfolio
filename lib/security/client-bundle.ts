import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

const HASH_FILE = path.join(process.cwd(), 'public', 'js', '.client-source-hash');

/** Short hash for cache-busting client scripts in layout (matches CI client-source-hash). */
export function getClientBundleVersion(): string {
  try {
    if (!fs.existsSync(HASH_FILE)) return 'dev';
    const full = fs.readFileSync(HASH_FILE, 'utf8').trim();
    return full.slice(0, 12) || 'dev';
  } catch {
    return 'dev';
  }
}

export function clientScriptUrl(relativePath: string): string {
  const v = getClientBundleVersion();
  const base = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${base}?v=${encodeURIComponent(v)}`;
}
