import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BASELINE_PATH = path.join(ROOT, 'scripts', 'ts-nocheck-baseline.json');

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'public/js']);

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function countNocheckFiles() {
  let count = 0;
  for (const file of walk(ROOT)) {
    const text = fs.readFileSync(file, 'utf8');
    if (text.startsWith('// @ts-nocheck') || text.startsWith('//@ts-nocheck')) {
      count += 1;
    }
  }
  return count;
}

const mode = process.argv[2] || 'check';
const current = countNocheckFiles();

if (mode === 'write-baseline') {
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify({ count: current, updatedAt: new Date().toISOString() }, null, 2)}\n`);
  console.log(`Wrote baseline: ${current} files with @ts-nocheck`);
  process.exit(0);
}

if (!fs.existsSync(BASELINE_PATH)) {
  console.error('Missing scripts/ts-nocheck-baseline.json — run: node scripts/count-ts-nocheck.mjs write-baseline');
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
const maxAllowed = typeof baseline.count === 'number' ? baseline.count : current;

if (current > maxAllowed) {
  console.error(
    `@ts-nocheck ratchet failed: ${current} files (max ${maxAllowed}). Remove @ts-nocheck or lower the baseline intentionally.`,
  );
  process.exit(1);
}

console.log(`OK: @ts-nocheck count ${current} (max ${maxAllowed})`);
