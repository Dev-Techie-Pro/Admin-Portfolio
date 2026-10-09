import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const constantsPath = path.join(process.cwd(), 'lib', 'auth', 'constants.ts');
const text = fs.readFileSync(constantsPath, 'utf8');
const match = text.match(/PUBLIC_API_PREFIXES\s*=\s*\[([\s\S]*?)\];/);
if (!match) {
  console.error('Could not parse PUBLIC_API_PREFIXES');
  process.exit(1);
}

const prefixes = [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
assert.ok(prefixes.length >= 4, 'expected public API prefixes');

for (const prefix of prefixes) {
  assert.ok(prefix.startsWith('/api/'), `prefix must start with /api/: ${prefix}`);
  assert.ok(prefix.endsWith('/'), `prefix must end with / to avoid sibling leaks: ${prefix}`);
}

const risky = ['/api/', '/api'];
for (const p of risky) {
  assert.ok(!prefixes.includes(p), `overly broad public prefix: ${p}`);
}

console.log(`OK: ${prefixes.length} PUBLIC_API_PREFIXES entries.`);
