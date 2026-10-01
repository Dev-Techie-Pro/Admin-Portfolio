import fs from 'node:fs';
import path from 'node:path';

const clientPath = path.join(process.cwd(), 'client', 'prefetch-config.ts');
const serverPath = path.join(process.cwd(), 'lib', 'cms', 'prefetch-config.ts');

function extractPageKeys(source) {
  const match = source.match(/PAGE_KEYS\s*=\s*\{([\s\S]*?)\n\s*\};/);
  if (!match) throw new Error('PAGE_KEYS block not found');
  const keys = [...match[1].matchAll(/^\s*['"]?([\w-]+)['"]?\s*:/gm)].map((m) => m[1]);
  return keys.sort();
}

const clientKeys = extractPageKeys(fs.readFileSync(clientPath, 'utf8'));
const serverKeys = extractPageKeys(fs.readFileSync(serverPath, 'utf8'));

if (clientKeys.join(',') !== serverKeys.join(',')) {
  console.error('PAGE_KEYS mismatch between client and lib/cms prefetch-config');
  console.error('client:', clientKeys);
  console.error('server:', serverKeys);
  process.exit(1);
}

console.log('OK: prefetch PAGE_KEYS in sync.');
