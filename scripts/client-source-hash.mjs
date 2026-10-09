/**
 * Stable fingerprint of client/ TypeScript sources (for CI freshness checks).
 * Chunk filenames from esbuild can differ by OS; we verify sources vs committed hash instead.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const CLIENT_HASH_FILE = path.join('public', 'js', '.client-source-hash');
export const CLIENT_HASH_VERSION = 1;

export function walkClientTsFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkClientTsFiles(full, results);
    else if (entry.name.endsWith('.ts')) results.push(full);
  }
  return results;
}

export function hashClientSources(clientRoot = path.resolve('client')) {
  const files = walkClientTsFiles(clientRoot).sort((a, b) => a.localeCompare(b));
  const h = crypto.createHash('sha256');
  h.update(`v${CLIENT_HASH_VERSION}\0`);
  for (const file of files) {
    const rel = path.relative(clientRoot, file).split(path.sep).join('/');
    h.update(rel);
    h.update('\0');
    h.update(fs.readFileSync(file));
    h.update('\0');
  }
  return h.digest('hex');
}

export function readCommittedClientHash() {
  if (!fs.existsSync(CLIENT_HASH_FILE)) return null;
  return fs.readFileSync(CLIENT_HASH_FILE, 'utf8').trim();
}

export function writeClientSourceHash(clientRoot = path.resolve('client')) {
  const hash = hashClientSources(clientRoot);
  fs.mkdirSync(path.dirname(CLIENT_HASH_FILE), { recursive: true });
  fs.writeFileSync(CLIENT_HASH_FILE, `${hash}\n`, 'utf8');
  return hash;
}
