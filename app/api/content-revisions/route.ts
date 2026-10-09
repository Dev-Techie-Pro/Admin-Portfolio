// @ts-nocheck
import { NextResponse } from 'next/server';
import { guardEditor, isGuardFailure } from '@/lib/auth/guard';
import { listContentRevisions, listContentRevisionsByLegacyId } from '@/lib/cms/content-revisions';

export async function GET(request: Request) {
  const auth = await guardEditor();
  if (isGuardFailure(auth)) return auth.response;

  const url = new URL(request.url);
  const entityType = url.searchParams.get('entityType') || '';
  const entityId = url.searchParams.get('entityId') || '';
  const legacyIdRaw = url.searchParams.get('legacyId');
  if (!entityType) {
    return NextResponse.json({ error: 'entityType is required.' }, { status: 400 });
  }

  try {
    if (legacyIdRaw != null && legacyIdRaw !== '') {
      const legacyId = parseInt(legacyIdRaw, 10);
      if (!Number.isFinite(legacyId)) {
        return NextResponse.json({ error: 'Invalid legacyId.' }, { status: 400 });
      }
      const revisions = await listContentRevisionsByLegacyId(entityType, legacyId);
      return NextResponse.json({ revisions });
    }
    if (!entityId) {
      return NextResponse.json({ error: 'entityId or legacyId is required.' }, { status: 400 });
    }
    const revisions = await listContentRevisions(entityType, entityId);
    return NextResponse.json({ revisions });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to load revisions.' }, { status: 500 });
  }
}
