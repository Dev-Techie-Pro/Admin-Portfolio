/**
 * Concatenate supabase/migrations/*.sql (lex order) into one baseline file.
 * Sources: migrations dir and/or migrations_archive/pre_baseline_20261011/
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const migrationsDir = path.join(root, 'supabase/migrations');
const archiveDir = path.join(
  root,
  'supabase/migrations_archive/pre_baseline_20261011',
);
const baselineName = '20261011120000_portfolio_admin_baseline.sql';
const outPath = path.join(migrationsDir, baselineName);

function listSourceFiles() {
  const dir = fs.existsSync(archiveDir)
    ? archiveDir
    : migrationsDir;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql') && f !== baselineName)
    .sort();
  if (files.length === 0) {
    console.error(`No .sql migrations found in ${dir}`);
    process.exit(1);
  }
  return { dir, files };
}

function build() {
  const { dir, files } = listSourceFiles();
  const generatedAt = new Date().toISOString();
  const parts = [
    '-- =============================================================================',
    '-- Portfolio Admin — squashed baseline (generated; do not edit by hand)',
    `-- Generated: ${generatedAt}`,
    `-- Source: ${files.length} files from ${path.relative(root, dir)}`,
    '-- Regenerate: npm run db:baseline',
    '-- =============================================================================',
    '',
  ];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8').trimEnd();
    parts.push(`-- === section: ${file} ===`, content, '');
  }

  fs.mkdirSync(migrationsDir, { recursive: true });
  fs.writeFileSync(outPath, `${parts.join('\n')}\n`, 'utf8');
  console.log(`Wrote ${path.relative(root, outPath)} (${files.length} sections)`);
}

build();
