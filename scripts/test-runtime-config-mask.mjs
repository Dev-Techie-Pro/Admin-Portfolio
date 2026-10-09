import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), 'lib', 'config', 'runtime-settings.ts');
const text = fs.readFileSync(file, 'utf8');

if (!text.includes('maskSecretValue')) {
  console.error('runtime-settings must mask secrets for API responses (P6).');
  process.exit(1);
}
if (!text.includes('isSecretKey(key) && raw ? maskSecretValue(raw)')) {
  console.error('getRuntimeConfigForApi must mask secret keys (P6).');
  process.exit(1);
}

console.log('OK: runtime config secret masking (P6).');
