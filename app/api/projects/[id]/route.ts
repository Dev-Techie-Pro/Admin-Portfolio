import { NextResponse } from 'next/server';
import { guardEditor, isGuardFailure } from '@/lib/auth/guard';
import { projectPatchSchema } from '@/lib/schemas/project';
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from '@/lib/cms/constants';
import { invalidateCmsReadCaches } from '@/lib/cms/server-cache';

type RouteParams = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await guardEditor();
  if (isGuardFailure(auth)) return auth.response;

  try {
    const raw = await request.json();
    const parsed = projectPatchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const legacyId = parseInt(params.id, 10);
    if (!Number.isFinite(legacyId)) {
      return NextResponse.json({ error: 'Invalid project id.' }, { status: 400 });
    }

    const sb = createAdminClient();
    const { data: existing } = await sb
      .from('projects')
      .select('id, updated_at')
      .eq('site_id', SITE_ID)
      .eq('legacy_id', legacyId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const ifMatch = request.headers.get('if-match');
    if (ifMatch && existing.updated_at && existing.updated_at !== ifMatch) {
      return NextResponse.json({ error: 'Conflict: project was modified elsewhere.' }, { status: 409 });
    }

    const row: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) row.title = parsed.data.title;
    if (parsed.data.slug !== undefined) row.slug = parsed.data.slug;
    if (parsed.data.description !== undefined) row.description = parsed.data.description;

    if (!Object.keys(row).length) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
    }

    const { data, error } = await sb
      .from('projects')
      .update(row)
      .eq('id', existing.id)
      .select('legacy_id, title, slug, updated_at')
      .single();
    if (error) throw error;

    invalidateCmsReadCaches();
    return NextResponse.json({ ok: true, project: data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
