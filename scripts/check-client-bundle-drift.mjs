/**
 * CI: compile client/ and verify public/js/.client-source-hash is in sync with sources.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (!existsSync('client/build-client.mjs')) {
  console.log('OK: client bundle drift check skipped (no build script).');
  process.exit(0);
}

execSync('npm run build:client', {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' },
});
execSync('node scripts/verify-client-bundle-freshness.mjs', { stdio: 'inherit' });
console.log('OK: client bundle build succeeded and source hash matches.');
