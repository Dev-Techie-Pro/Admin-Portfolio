// @ts-nocheck
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { withStaffGet } from '@/lib/api/with-staff-get';

const TAGS_URL = 'https://raw.githubusercontent.com/Remix-Design/RemixIcon/master/tags.json';
const GLYPH_PATH = path.join(process.cwd(), 'node_modules/remixicon/fonts/remixicon.glyph.json');

let tagsCache: Record<string, unknown> | null = null;
let tagsLoadPromise: Promise<Record<string, unknown>> | null = null;

async function loadTags(): Promise<Record<string, unknown>> {
  if (tagsCache) return tagsCache;
  if (!tagsLoadPromise) {
    tagsLoadPromise = fetch(TAGS_URL)
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}))
      .then((data) => {
        tagsCache = data && typeof data === 'object' ? data : {};
        return tagsCache;
      });
  }
  return tagsLoadPromise;
}

export async function GET() {
  return withStaffGet(async () => {
    const glyphs = JSON.parse(await readFile(GLYPH_PATH, 'utf8'));
    const tags = await loadTags();
    return { glyphs, tags };
  }, { maxAgeSec: 86400 });
}
