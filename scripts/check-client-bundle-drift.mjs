/**
 * Fails CI when committed public/js drifts from a fresh build:client.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (!existsSync('client/build-client.mjs')) {
  console.log('OK: client bundle drift check skipped (no build script).');
  process.exit(0);
}

execSync('npm run build:client', { stdio: 'inherit' });
execSync('git diff --exit-code -- public/js', { stdio: 'inherit' });
console.log('OK: public/js matches build:client output.');
