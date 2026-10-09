/**
 * Compile client TypeScript sources to browser-ready ES modules in public/js/.
 * - Standalone scripts: unbundled (boot-prefetch, prefetch-config, body-loader, utilities).
 * - main.ts: bundled with code splitting for page modules.
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { writeClientSourceHash } from '../scripts/client-source-hash.mjs';

const CLIENT_ROOT = path.resolve('client');
const OUT_DIR = path.resolve('public/js');
const CHUNKS_DIR = path.join(OUT_DIR, 'chunks');
const MAIN_ENTRY = path.join(CLIENT_ROOT, 'main.ts');
const VENDOR_DIR = path.join(OUT_DIR, 'vendor');

/** Browser vendor assets (not bundled into ESM chunks). */
const VENDOR_COPIES = [
  {
    from: path.resolve('node_modules/apexcharts/dist/apexcharts.min.js'),
    to: path.join(VENDOR_DIR, 'apexcharts.min.js'),
  },
];

function copyVendorAssets() {
  fs.mkdirSync(VENDOR_DIR, { recursive: true });
  for (const { from, to } of VENDOR_COPIES) {
    if (!fs.existsSync(from)) {
      console.error(`Missing vendor source: ${from} (run npm install)`);
      process.exit(1);
    }
    fs.copyFileSync(from, to);
  }
}

/** esbuild code-splitting uses content hashes; without cleanup, old chunks accumulate and can ship stale module code. */
const cleanSplitChunksPlugin = {
  name: 'clean-split-chunks',
  setup(build) {
    build.onStart(() => {
      if (fs.existsSync(CHUNKS_DIR)) {
        fs.rmSync(CHUNKS_DIR, { recursive: true, force: true });
      }
    });
  },
};

// CI checks client/ ↔ public/js via .client-source-hash (not git diff — chunk hashes vary by OS).
// Minify only when CLIENT_BUILD_MINIFY=1 (do not tie to NODE_ENV).
const isProd = process.env.CLIENT_BUILD_MINIFY === '1';

const SHARED_BUILD = {
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  sourcemap: !isProd,
  minify: isProd,
  logLevel: 'info',
};

function walkTs(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkTs(full, results);
    else if (entry.name.endsWith('.ts')) results.push(full);
  }
  return results;
}

const allTs = walkTs(CLIENT_ROOT).sort((a, b) => a.localeCompare(b));
const standaloneEntries = allTs.filter((file) => path.normalize(file) !== path.normalize(MAIN_ENTRY));

if (!allTs.length) {
  console.log('No client TypeScript files found in client/.');
  process.exit(0);
}

async function buildAll() {
  copyVendorAssets();

  if (standaloneEntries.length) {
    await esbuild.build({
      ...SHARED_BUILD,
      entryPoints: standaloneEntries,
      outdir: OUT_DIR,
      outbase: CLIENT_ROOT,
      bundle: false,
    });
  }

  if (fs.existsSync(MAIN_ENTRY)) {
    await esbuild.build({
      ...SHARED_BUILD,
      entryPoints: [MAIN_ENTRY],
      outdir: OUT_DIR,
      outbase: CLIENT_ROOT,
      bundle: true,
      splitting: true,
      chunkNames: 'chunks/[name]-[hash]',
      plugins: [cleanSplitChunksPlugin],
    });
  }

  const sourceHash = writeClientSourceHash(CLIENT_ROOT);
  console.log(
    `Built ${standaloneEntries.length} standalone + main bundle (${allTs.length} source file(s)) → public/js/`,
  );
  console.log(`client-source-hash: ${sourceHash}`);
}

if (process.argv.includes('--watch')) {
  const contexts = [];
  if (standaloneEntries.length) {
    contexts.push(
      await esbuild.context({
        ...SHARED_BUILD,
        entryPoints: standaloneEntries,
        outdir: OUT_DIR,
        outbase: CLIENT_ROOT,
        bundle: false,
      }),
    );
  }
  if (fs.existsSync(MAIN_ENTRY)) {
    contexts.push(
      await esbuild.context({
        ...SHARED_BUILD,
        entryPoints: [MAIN_ENTRY],
        outdir: OUT_DIR,
        outbase: CLIENT_ROOT,
        bundle: true,
        splitting: true,
        chunkNames: 'chunks/[name]-[hash]',
        plugins: [cleanSplitChunksPlugin],
      }),
    );
  }
  for (const ctx of contexts) await ctx.watch();
  console.log(`Watching client sources → public/js/`);
} else {
  await buildAll();
}
