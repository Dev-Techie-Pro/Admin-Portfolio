/**
 * Compile client TypeScript sources to browser-ready ES modules in public/js/.
 * - Standalone scripts: unbundled (boot-prefetch, prefetch-config, body-loader, utilities).
 * - main.ts: bundled with code splitting for page modules.
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const CLIENT_ROOT = path.resolve('client');
const OUT_DIR = path.resolve('public/js');
const CHUNKS_DIR = path.join(OUT_DIR, 'chunks');
const MAIN_ENTRY = path.join(CLIENT_ROOT, 'main.ts');

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

// Committed public/js is checked in CI with `git diff --exit-code`. Deploy runners often set
// NODE_ENV=production, which would change chunk hashes and fail that check — minify only when asked.
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
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkTs(full, results);
    else if (entry.name.endsWith('.ts')) results.push(full);
  }
  return results;
}

const allTs = walkTs(CLIENT_ROOT);
const standaloneEntries = allTs.filter((file) => path.normalize(file) !== path.normalize(MAIN_ENTRY));

if (!allTs.length) {
  console.log('No client TypeScript files found in client/.');
  process.exit(0);
}

async function buildAll() {
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

  console.log(
    `Built ${standaloneEntries.length} standalone + main bundle (${allTs.length} source file(s)) → public/js/`,
  );
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
