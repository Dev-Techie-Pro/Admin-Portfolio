import { NextResponse } from 'next/server';
import {
  deleteMediaByLegacyId,
  getMedia,
  updateMediaByLegacyId,
} from '@/lib/cms/repository';
import { guardEditor } from '@/lib/auth/guard';
import { logMediaChanges } from '@/lib/cms/activity-events';

function errorResponse(error: unknown, label: string) {
  const err = error as { message?: string; code?: string };
  console.error(label, error);
  return NextResponse.json(
    { error: err?.message || 'Request failed', code: err?.code },
    { status: 500 },
  );
}

/** Delete one media item by legacy id (small payload; no full-library PUT). */
export async function DELETE(request: Request) {
  const auth = await guardEditor();
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const id = body?.id;
    if (id == null || id === '') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const before = await getMedia();
    const { propagation, records: after } = await deleteMediaByLegacyId(id);
    await logMediaChanges({ auth, request, before, after });
    return NextResponse.json({ ok: true, propagation });
  } catch (error) {
    return errorResponse(error, '[DELETE /api/media/item]');
  }
}

/** Update one media item by legacy id (small payload; no full-library PUT). */
export async function PATCH(request: Request) {
  const auth = await guardEditor();
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const { id, ...patch } = body || {};
    if (id == null || id === '') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const before = await getMedia();
    const { record, records: after, propagation } = await updateMediaByLegacyId(id, patch);
    await logMediaChanges({ auth, request, before, after });
    return NextResponse.json({ ok: true, record, propagation });
  } catch (error) {
    return errorResponse(error, '[PATCH /api/media/item]');
  }
}
