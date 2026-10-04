import { NextResponse } from 'next/server';
import { syncAllEntityMedia } from '@/lib/cms/media-sync';
import { invalidateCmsReadCaches } from '@/lib/cms/server-cache';
import { guardEditor } from '@/lib/auth/guard';

const FULL_SYNC_COOLDOWN_MS = 5 * 60 * 1000;
let lastFullSyncFinishedAt = 0;

/** Backfill media_assets from images used across CMS tables. */
export async function POST(request: Request) {
  const auth = await guardEditor();
  if (!auth.ok) return auth.response;

  const force = request.headers.get('x-pa-media-sync-force') === '1';
  const now = Date.now();
  if (!force && lastFullSyncFinishedAt && now - lastFullSyncFinishedAt < FULL_SYNC_COOLDOWN_MS) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'cooldown' });
  }

  try {
    const result = await syncAllEntityMedia();
    invalidateCmsReadCaches();
    lastFullSyncFinishedAt = Date.now();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
